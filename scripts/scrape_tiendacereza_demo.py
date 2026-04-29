#!/usr/bin/env python3
import csv
import json
import re
from pathlib import Path
from urllib.parse import urljoin

import requests

BASE_URL = "https://tiendacereza.com/"
PRODUCTS_ENDPOINT = "https://tiendacereza.com/products.json"
MAX_PRODUCTS = 60


def infer_categories(product):
    bucket = {"Demo Guia Cereza"}
    tokens = " ".join(
        [
            str(product.get("title", "")),
            str(product.get("product_type", "")),
            str(product.get("vendor", "")),
            " ".join(product.get("tags", []) if isinstance(product.get("tags"), list) else [str(product.get("tags", ""))]),
        ]
    ).lower()

    rules = [
        ("Lubricantes", ["lubricante", "jabon intimo", "gel", "aceite", "milk"]),
        ("Lencería", ["lenceria", "panty", "body", "conjunto", "cachetero", "enterizo", "falda"]),
        ("Juguetes", ["vibrador", "dildo", "estimulador", "plug", "bullet", "huevo", "satisfyer", "rabbit"]),
        ("BDSM", ["bondage", "nalgadas", "paleta", "bdsm"]),
        ("Accesorios", ["bateria", "maleta", "kit"]),
        ("Salud y Bienestar", ["intimo", "salud", "belleza"]),
    ]
    for category, keywords in rules:
        if any(keyword in tokens for keyword in keywords):
            bucket.add(category)

    if len(bucket) == 1:
        bucket.add("Otros")

    return sorted(bucket)


def infer_tags(product):
    tags = {"demo", "importado", "guia-cereza"}
    vendor = str(product.get("vendor", "")).strip().lower().replace(" ", "-")
    if vendor:
        tags.add(vendor)
    product_type = str(product.get("product_type", "")).strip().lower().replace(" ", "-")
    if product_type:
        tags.add(product_type)
    return sorted(tags)


def parse_price(value):
    if value is None:
        return 0
    text = str(value).strip()
    return int(float(text))


def clean_description(html):
    text = re.sub(r"<[^>]+>", " ", html or "")
    text = re.sub(r"\s+", " ", text).strip()
    return text[:320]


def collect_products():
    products = []
    page = 1
    session = requests.Session()

    while len(products) < MAX_PRODUCTS:
        response = session.get(
            PRODUCTS_ENDPOINT,
            params={"limit": 250, "page": page},
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        batch = data.get("products", [])
        if not batch:
            break

        for product in batch:
            variants = product.get("variants", [])
            first_variant = variants[0] if variants else {}
            price = parse_price(first_variant.get("price"))
            compare_at = parse_price(first_variant.get("compare_at_price"))
            image = ""
            if product.get("image") and product["image"].get("src"):
                image = product["image"]["src"]
            elif product.get("images"):
                image = product["images"][0].get("src", "")

            item = {
                "id": f"cereza-{product.get('id')}",
                "name": product.get("title", "Producto"),
                "price": price,
                "regular_price": compare_at or price,
                "description": clean_description(product.get("body_html", "")),
                "image": image,
                "brand": product.get("vendor", "Guia Cereza"),
                "url": urljoin(BASE_URL, f"products/{product.get('handle', '')}"),
                "categories": infer_categories(product),
                "tags": infer_tags(product),
            }
            products.append(item)
            if len(products) >= MAX_PRODUCTS:
                break

        page += 1

    return products


def export_json(products, path):
    payload = {"source": BASE_URL, "count": len(products), "products": products}
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def export_js(products, path):
    payload = {"source": BASE_URL, "count": len(products), "products": products}
    js = "window.oasisDemoProducts = " + json.dumps(payload, ensure_ascii=False) + ";"
    path.write_text(js, encoding="utf-8")


def export_woocommerce_csv(products, path):
    fieldnames = [
        "Type",
        "SKU",
        "Name",
        "Published",
        "Regular price",
        "Sale price",
        "Description",
        "Short description",
        "Images",
        "Categories",
        "Tags",
    ]
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for item in products:
            writer.writerow(
                {
                    "Type": "simple",
                    "SKU": item["id"],
                    "Name": item["name"],
                    "Published": 1,
                    "Regular price": item["regular_price"],
                    "Sale price": item["price"] if item["price"] < item["regular_price"] else "",
                    "Description": item["description"],
                    "Short description": item["description"][:140],
                    "Images": item["image"],
                    "Categories": ", ".join(item.get("categories", ["Demo Guia Cereza"])),
                    "Tags": ", ".join(item.get("tags", ["demo", "importado"])),
                }
            )


def main():
    root = Path(__file__).resolve().parents[1]
    products = collect_products()
    if not products:
        raise RuntimeError("No fue posible extraer productos.")

    export_json(products, root / "products-demo.json")
    export_js(products, root / "products-demo.js")
    export_woocommerce_csv(products, root / "products-demo-woocommerce.csv")
    print(f"Productos extraídos: {len(products)}")
    print("Archivos creados: products-demo.json, products-demo.js, products-demo-woocommerce.csv")


if __name__ == "__main__":
    main()
