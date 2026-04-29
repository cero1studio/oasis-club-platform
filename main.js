document.addEventListener('DOMContentLoaded', () => {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const reveals = document.querySelectorAll('.reveal');
    const CART_STORAGE_KEY = 'oasis_cart_v1';
    const isFileMode = window.location.protocol === 'file:' || window.location.pathname.endsWith('.html');

    function routeTo(slug) {
        if (isFileMode) return slug ? `${slug}.html` : 'index.html';
        return slug ? `/${slug}/` : '/';
    }

    // HAMBURGER MENU
    const navHamburger = document.getElementById('nav-hamburger');
    const navHamburgerClose = document.getElementById('nav-hamburger-close');
    const navLinks = document.getElementById('nav-links');

    const openMenu = () => {
        if (!navLinks) return;
        navLinks.classList.add('open');
        document.body.classList.add('menu-open');
        if (navHamburger) navHamburger.setAttribute('aria-expanded', 'true');
    };

    const closeMenu = () => {
        if (!navLinks) return;
        navLinks.classList.remove('open');
        document.body.classList.remove('menu-open');
        if (navHamburger) navHamburger.setAttribute('aria-expanded', 'false');
    };

    if (navHamburger && navLinks) {
        navHamburger.setAttribute('aria-expanded', 'false');
        navHamburger.addEventListener('click', openMenu);
    }
    if (navHamburgerClose && navLinks) {
        navHamburgerClose.addEventListener('click', closeMenu);
    }
    // Close menu when a nav link is clicked
    if (navLinks) {
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
        navLinks.addEventListener('click', (e) => {
            if (e.target === navLinks) closeMenu();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMenu();
            if (cartSidebar) cartSidebar.classList.remove('active');
        }
    });

    function toNumberPrice(value) {
        const onlyDigits = String(value || '').replace(/\D/g, '');
        return Number(onlyDigits || 0);
    }

    function formatPrice(value) {
        return `$${Number(value || 0).toLocaleString('es-CO')} COP`;
    }

    function getCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
        } catch (_error) {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }

    function getCartTotal(cart) {
        return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    }

    function extractBgImageUrl(value) {
        const match = String(value || '').match(/url\(["']?(.*?)["']?\)/);
        return match ? match[1] : 'caja-oasis.png';
    }

    function buildProductId(name) {
        return String(name || 'producto')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    function getProductDataFromButton(button) {
        const card = button.closest('.product-card');
        if (card) {
            const name = card.querySelector('h3')?.textContent?.trim() || 'Producto Oasis';
            const priceText = card.querySelector('.price')?.textContent?.trim() || '$0';
            const price = toNumberPrice(priceText);
            const image = extractBgImageUrl(card.querySelector('.product-img')?.style?.backgroundImage || '');
            return { id: buildProductId(name), name, price, image, qty: 1 };
        }

        const meta = button.closest('.product-meta') || document.querySelector('.product-meta');
        if (meta) {
            const name = meta.querySelector('h1')?.textContent?.trim() || 'Producto Oasis';
            const priceText = meta.querySelector('.price')?.textContent?.trim() || '$0';
            const price = toNumberPrice(priceText);
            const image = document.querySelector('.product-gallery img')?.getAttribute('src') || 'caja-oasis.png';
            return { id: buildProductId(name), name, price, image, qty: 1 };
        }
        return null;
    }

    function renderCartSidebar() {
        if (!cartItemsContainer || !cartTotalAmount) return;
        const cart = getCart();

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-msg">Tu carrito está vacío.</p>';
            cartTotalAmount.textContent = '$0 COP';
            return;
        }

        cartItemsContainer.innerHTML = cart.map((item) => `
            <div style="display:flex; gap:0.8rem; margin-bottom:1rem; padding-bottom:1rem; border-bottom:1px solid #f1f1f1;">
                <img src="${item.image}" alt="${item.name}" style="width:56px; height:56px; border-radius:12px; object-fit:cover;">
                <div style="flex:1;">
                    <p style="font-weight:600; font-size:0.85rem; line-height:1.3;">${item.name}</p>
                    <p style="font-size:0.8rem; color:#666; margin-top:0.2rem;">${formatPrice(item.price)}</p>
                    <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.4rem;">
                        <button data-qty-change="-1" data-product-id="${item.id}" style="border:1px solid #ddd; background:#fff; width:26px; height:26px; border-radius:8px; cursor:pointer;">-</button>
                        <span style="min-width:16px; text-align:center; font-size:0.85rem;">${item.qty}</span>
                        <button data-qty-change="1" data-product-id="${item.id}" style="border:1px solid #ddd; background:#fff; width:26px; height:26px; border-radius:8px; cursor:pointer;">+</button>
                        <button data-remove-cart="${item.id}" style="margin-left:auto; border:none; background:transparent; color:#9b1c1c; cursor:pointer; font-size:0.75rem;">Eliminar</button>
                    </div>
                </div>
            </div>
        `).join('');

        cartTotalAmount.textContent = formatPrice(getCartTotal(cart));
    }

    function addToCart(product) {
        if (!product || !product.id) return;
        const cart = getCart();
        const existing = cart.find(item => item.id === product.id);
        if (existing) existing.qty += 1;
        else cart.push(product);
        saveCart(cart);
        renderCartSidebar();
    }

    function updateQty(productId, delta) {
        const cart = getCart();
        const item = cart.find(p => p.id === productId);
        if (!item) return;
        item.qty += delta;
        saveCart(cart.filter(p => p.qty > 0));
        renderCartSidebar();
    }

    function removeFromCart(productId) {
        saveCart(getCart().filter(p => p.id !== productId));
        renderCartSidebar();
    }

    function renderCheckoutSummary() {
        const checkoutPath = window.location.pathname;
        if (!checkoutPath.includes('checkout')) return;
        const itemsList = document.getElementById('checkout-items-list');
        const totalEl = document.getElementById('checkout-total');
        const mainBtn = document.getElementById('main-checkout-btn');
        if (!itemsList || !totalEl) return;

        const params = new URLSearchParams(window.location.search);
        const plan = params.get('plan');
        const plans = {
            creator: { name: 'Membresía Creator', price: 97000 },
            pareja: { name: 'Membresía Pareja Perfecto', price: 105000 },
            pro: { name: 'Membresía Socio Pro', price: 128000 }
        };
        if (plan && plans[plan]) {
            const selected = plans[plan];
            itemsList.innerHTML = `<div style="display:flex;justify-content:space-between;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid #f0f0f0;"><span>${selected.name}</span><strong>${formatPrice(selected.price)}</strong></div>`;
            totalEl.textContent = formatPrice(selected.price);
            if (mainBtn) mainBtn.textContent = 'Activar mi Membresía';
            return;
        }

        const cart = getCart();
        if (cart.length === 0) {
            itemsList.innerHTML = '<p style="opacity:0.65; font-size:0.9rem;">Tu carrito está vacío. Regresa a la boutique para agregar productos.</p>';
            totalEl.textContent = '$0 COP';
            if (mainBtn) mainBtn.disabled = true;
            return;
        }

        itemsList.innerHTML = cart.map((item) => `
            <div style="display:flex;justify-content:space-between;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid #f0f0f0;">
                <span>${item.name} x${item.qty}</span>
                <strong>${formatPrice(item.price * item.qty)}</strong>
            </div>
        `).join('');
        totalEl.textContent = formatPrice(getCartTotal(cart));
    }

    function setupCheckoutSubmit() {
        const mainBtn = document.getElementById('main-checkout-btn');
        if (!mainBtn) return;
        mainBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (mainBtn.disabled) return;
            const plan = new URLSearchParams(window.location.search).get('plan');
            if (!plan) localStorage.removeItem(CART_STORAGE_KEY);
            alert('Pedido confirmado. Gracias por tu compra en Oasis Club.');
            window.location.href = routeTo('');
        });
    }

    // GLOBAL CLICK DELEGATION (Para elementos dinámicos)
    document.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.btn-add-cart');
        const cartIcon = e.target.closest('.cart-icon');

        if (addBtn) {
            e.preventDefault();
            addToCart(getProductDataFromButton(addBtn));
            if (cartSidebar) cartSidebar.classList.add('active');
            else window.location.href = routeTo('checkout');
            return;
        }

        if (cartIcon) {
            e.preventDefault();
            if (cartSidebar) cartSidebar.classList.add('active');
            return;
        }

        // Cerrar si hace clic en el botón de cerrar
        if (e.target.closest('#close-cart')) {
            if (cartSidebar) cartSidebar.classList.remove('active');
        }

        // Cerrar si hace clic fuera del carrito
        if (cartSidebar && cartSidebar.classList.contains('active') && !cartSidebar.contains(e.target) && !cartIcon && !addBtn) {
            cartSidebar.classList.remove('active');
        }

        const removeBtn = e.target.closest('[data-remove-cart]');
        if (removeBtn) {
            removeFromCart(removeBtn.getAttribute('data-remove-cart'));
        }

        const qtyBtn = e.target.closest('[data-qty-change]');
        if (qtyBtn) {
            updateQty(
                qtyBtn.getAttribute('data-product-id'),
                Number(qtyBtn.getAttribute('data-qty-change') || 0)
            );
        }
    });

    // Reveal elements on scroll
    function revealOnScroll() {
        reveals.forEach(el => {
            const windowHeight = window.innerHeight;
            const elementTop = el.getBoundingClientRect().top;
            const elementVisible = 100;

            if (elementTop < windowHeight - elementVisible) {
                el.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();

    function reorderHomeSections() {
        const isHomeLike = window.location.pathname === '/' || window.location.pathname.includes('index') || window.location.pathname.includes('inicio');
        if (!isHomeLike) return;
        const planesSection = document.getElementById('planes')?.closest('section');
        const shopSection = document.getElementById('boutique')?.closest('section');
        if (!planesSection || !shopSection) return;
        const parent = shopSection.parentElement;
        if (!parent) return;
        if (planesSection.compareDocumentPosition(shopSection) & Node.DOCUMENT_POSITION_FOLLOWING) {
            parent.insertBefore(planesSection, shopSection);
        }
    }

    reorderHomeSections();

    // INFINITE SCROLL LOGIC
    const productGrid = document.querySelector('.product-grid');
    const path = window.location.pathname;
    const isHomePage = path.includes('index.html') || path === '/' || path === '';
    const isShopPage = path.includes('shop');
    const urlParams = new URLSearchParams(window.location.search);
    const selectedCategory = (urlParams.get('categoria') || '').toLowerCase();
    const selectedAudience = (urlParams.get('destino') || '').toLowerCase();
    let loadCount = 0;
    const MAX_HOME_LOADS = 2;
    let demoProducts = [];
    let demoCursor = 0;

    const sentinel = document.getElementById('shop-sentinel') || document.createElement('div');
    if (!document.getElementById('shop-sentinel') && productGrid) {
        productGrid.after(sentinel);
    }

    const TOTAL_PRODUCTS_AVAILABLE = 60;
    let totalLoaded = 0;

    function formatCop(number) {
        return `$${Number(number || 0).toLocaleString('es-CO')}`;
    }

    function normalizeText(value) {
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function matchesCategory(product, categorySlug) {
        if (!categorySlug) return true;
        const slugMap = {
            combos: ['combos', 'accesorios', 'otros'],
            lenceria: ['lenceria'],
            bdsm: ['bdsm'],
            juegos: ['juguetes'],
            bienestar: ['salud y bienestar', 'lubricantes'],
            novedades: ['demo guia cereza', 'otros'],
            accesorios: ['accesorios'],
        };
        const productCategories = (product.categories || []).map(normalizeText);
        const accepted = (slugMap[categorySlug] || [categorySlug]).map(normalizeText);
        return accepted.some((cat) => productCategories.includes(cat));
    }

    function matchesAudience(product, audienceSlug) {
        if (!audienceSlug) return true;
        const text = normalizeText(`${product.name} ${(product.categories || []).join(' ')} ${(product.tags || []).join(' ')}`);
        if (audienceSlug === 'parejas') {
            return ['pareja', 'set', 'kit'].some((k) => text.includes(k));
        }
        if (audienceSlug === 'ellas') {
            return ['ella', 'femen', 'lenceria', 'clitorial', 'vagina'].some((k) => text.includes(k));
        }
        if (audienceSlug === 'ellos') {
            return ['mascul', 'pen', 'anillo', 'hombre'].some((k) => text.includes(k));
        }
        return true;
    }

    function applyShopFilters(products) {
        if (!isShopPage) return products;
        const filtered = products.filter((product) => (
            matchesCategory(product, selectedCategory) && matchesAudience(product, selectedAudience)
        ));
        return filtered.length ? filtered : products;
    }

    function mapProductToCard(product, index = 0) {
        const productUrl = `${routeTo('product-single')}?product=${encodeURIComponent(product.id || '')}`;
        const imageUrl = product.image || 'caja-oasis.png';
        const title = product.name || 'Producto';
        const price = formatCop(product.price || 0);
        return `
            <div class="product-card stagger-item" style="animation-delay: ${index * 0.08}s">
                <a href="${productUrl}" style="text-decoration: none; color: inherit;">
                    <div class="product-img" style="background-image: url('${imageUrl}');"></div>
                </a>
                <div class="product-info">
                    <span class="category">${product.brand || 'Guia Cereza'}</span>
                    <h3>${title}</h3>
                    <p class="price">${price} COP</p>
                    <div class="product-btns">
                        <a href="${routeTo('checkout')}" class="btn-action btn-add-cart">
                            <i data-lucide="shopping-cart" style="width: 14px;"></i> AÑADIR
                        </a>
                        <a href="${productUrl}" class="btn-outline">
                            <i data-lucide="eye" style="width: 14px;"></i> DETALLE
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    async function fetchDemoProducts() {
        if (window.oasisDemoProducts && Array.isArray(window.oasisDemoProducts.products)) {
            return window.oasisDemoProducts.products;
        }
        const sources = [];
        if (window.oasisData && window.oasisData.productsUrl) sources.push(window.oasisData.productsUrl);
        sources.push('products-demo.json');

        for (const source of sources) {
            try {
                const response = await fetch(source);
                if (!response.ok) continue;
                const payload = await response.json();
                if (payload && Array.isArray(payload.products) && payload.products.length > 0) {
                    return payload.products;
                }
            } catch (_error) {}
        }
        return [];
    }

    function renderSingleProductFromDataset(products) {
        const isProductSingle = window.location.pathname.includes('product-single');
        if (!isProductSingle || !Array.isArray(products) || products.length === 0) return;

        const productId = new URLSearchParams(window.location.search).get('product');
        const selected = products.find((p) => p.id === productId) || products[0];
        if (!selected) return;

        const titleEl = document.querySelector('.product-meta h1');
        const priceEl = document.querySelector('.product-meta .price');
        const descEl = document.querySelector('.product-description p');
        const imageEl = document.querySelector('.product-gallery img');
        const subtitleEl = document.querySelector('.product-meta .subtitle');
        const buyBtn = document.querySelector('.action-area .btn-add-cart');
        const detailCards = document.querySelectorAll('.section .product-grid .product-card');

        if (titleEl) titleEl.textContent = selected.name || 'Producto';
        if (priceEl) priceEl.textContent = `${formatCop(selected.price || 0)} COP`;
        if (descEl) {
            const copy = selected.description || 'Producto seleccionado de nuestra boutique.';
            descEl.textContent = copy.length > 420 ? `${copy.slice(0, 417)}...` : copy;
        }
        if (imageEl) {
            imageEl.src = selected.image || imageEl.src;
            imageEl.alt = selected.name || imageEl.alt;
        }
        if (subtitleEl) subtitleEl.textContent = `Boutique / ${selected.brand || 'Selección Oasis'}`;
        if (buyBtn) buyBtn.setAttribute('href', routeTo('checkout'));

        if (detailCards.length > 0) {
            const related = products.filter((p) => p.id !== selected.id).slice(0, detailCards.length);
            detailCards.forEach((card, idx) => {
                const rel = related[idx];
                if (!rel) return;
                const cImg = card.querySelector('.product-img');
                const cTitle = card.querySelector('h3');
                const cPrice = card.querySelector('.price, span.price');
                if (cImg) cImg.style.backgroundImage = `url('${rel.image || ''}')`;
                if (cTitle) cTitle.textContent = rel.name || 'Producto';
                if (cPrice) cPrice.textContent = `${formatCop(rel.price || 0)} COP`;
            });
        }
    }

    function hydrateGridWithDemoProducts() {
        if (!productGrid || (!isHomePage && !isShopPage) || demoProducts.length === 0) return;
        const filteredProducts = applyShopFilters(demoProducts);
        const initialBatchSize = isHomePage ? 8 : 18;
        const batch = filteredProducts.slice(0, initialBatchSize);
        demoCursor = batch.length;
        totalLoaded = batch.length;
        demoProducts = filteredProducts;
        productGrid.innerHTML = batch.map((item, index) => mapProductToCard(item, index)).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setupClickableCards();
        setupHorizontalCardRows();
        highlightActiveFilters();
    }

    function highlightActiveFilters() {
        if (!isShopPage) return;
        const links = document.querySelectorAll('.shop-filters a[href]');
        links.forEach((link) => {
            const params = new URLSearchParams((link.getAttribute('href') || '').split('?')[1] || '');
            const c = (params.get('categoria') || '').toLowerCase();
            const d = (params.get('destino') || '').toLowerCase();
            const isActive = (c && c === selectedCategory) || (d && d === selectedAudience);
            link.classList.toggle('is-active-filter', isActive);
        });
    }

    function centerFeaturedPlanCarousel() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (!isMobile) return;
        const pricingGrid = document.querySelector('.pricing-grid');
        const featuredCard = pricingGrid?.querySelector('.pricing-card.featured');
        if (!pricingGrid || !featuredCard) return;
        const left = featuredCard.offsetLeft - ((pricingGrid.clientWidth - featuredCard.clientWidth) / 2);
        pricingGrid.scrollTo({ left: Math.max(0, left), behavior: 'auto' });
    }

    if (productGrid) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                const canLoadHome = isHomePage && loadCount < MAX_HOME_LOADS;
                const canLoadShop = !isHomePage && totalLoaded < TOTAL_PRODUCTS_AVAILABLE;

                if (canLoadHome || canLoadShop) {
                    loadMoreProducts();
                    loadCount++;
                    totalLoaded += 4; // Cargamos de a 4
                } else if (!canLoadHome && isHomePage) {
                    observer.unobserve(sentinel);
                } else if (!canLoadShop && !isHomePage) {
                    observer.unobserve(sentinel);
                    sentinel.innerHTML = "<p style='text-align:center; padding: 4rem; opacity:0.5; font-size:0.8rem; letter-spacing:2px;'>HAS VISTO TODA NUESTRA SELECCIÓN</p>";
                }
            }
        }, { threshold: 0.1 });

        observer.observe(sentinel);
    }

    function loadMoreProducts() {
        const fallbackProducts = [
            { name: 'Combo Experiencia', price: 185000, image: 'caja-oasis.png', brand: 'Oasis Demo', url: routeTo('product-single') },
            { name: 'Juguete Premium', price: 320000, image: 'juguete.png', brand: 'Oasis Demo', url: routeTo('product-single') },
            { name: 'Seda Relax', price: 85000, image: 'seda.png', brand: 'Oasis Demo', url: routeTo('product-single') },
            { name: 'Aceite Oasis', price: 55000, image: 'seda.png', brand: 'Oasis Demo', url: routeTo('product-single') }
        ];
        const source = demoProducts.length ? demoProducts : fallbackProducts;
        const batch = source.slice(demoCursor, demoCursor + 4);
        const finalBatch = batch.length ? batch : fallbackProducts;
        demoCursor += batch.length;

        finalBatch.forEach((item, index) => {
            const card = document.createElement('div');
            card.innerHTML = mapProductToCard(item, index);
            productGrid.appendChild(card.firstElementChild);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setupClickableCards();
    }

    if (productGrid && (isHomePage || isShopPage)) {
        fetchDemoProducts().then((products) => {
            demoProducts = products;
            hydrateGridWithDemoProducts();
        });
    }

    fetchDemoProducts().then((products) => {
        renderSingleProductFromDataset(products);
    });

    // La delegación de clics global arriba se encarga de esto ahora.

    // HERO SLIDER LOGIC
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');
    let currentSlideIdx = 0;
    let sliderInterval;
    let touchStartX = 0;
    let touchStartY = 0;
    const MIN_SWIPE_DISTANCE = 45;

    function showSlide(idx) {
        if (slides.length === 0) return;
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        slides[idx].classList.add('active');
        dots[idx].classList.add('active');
        currentSlideIdx = idx;
        resetInterval();
    }

    function nextSlide() {
        if (slides.length === 0) return;
        let next = (currentSlideIdx + 1) % slides.length;
        showSlide(next);
    }

    function prevSlide() {
        if (slides.length === 0) return;
        let prev = (currentSlideIdx - 1 + slides.length) % slides.length;
        showSlide(prev);
    }

    function resetInterval() {
        clearInterval(sliderInterval);
        sliderInterval = setInterval(nextSlide, 6000);
    }

    function setupClickableCards() {
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach((card) => {
            if (card.dataset.clickBound === 'true') return;
            const mainLink = card.querySelector('a[href]:not(.btn-action):not(.btn-outline):not(.btn-add-cart)');
            if (!mainLink) return;
            if (!card.classList.contains('is-clickable')) {
                card.classList.add('is-clickable');
                card.setAttribute('role', 'link');
                card.setAttribute('tabindex', '0');
            }

            card.addEventListener('click', (event) => {
                const interactiveTarget = event.target.closest('a, button, input, label, select, textarea');
                if (interactiveTarget && interactiveTarget !== mainLink) return;
                window.location.href = mainLink.getAttribute('href');
            });

            card.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    window.location.href = mainLink.getAttribute('href');
                }
            });
            card.dataset.clickBound = 'true';
        });
    }

    function setupHorizontalCardRows() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        document.querySelectorAll('.product-grid').forEach((grid) => {
            if (isMobile && grid.children.length > 1 && !isShopPage) {
                grid.classList.add('horizontal-cards');
            } else {
                grid.classList.remove('horizontal-cards');
            }
        });
    }

    function handleSliderTouchStart(event) {
        const touch = event.changedTouches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }

    function handleSliderTouchEnd(event) {
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        if (Math.abs(deltaY) > Math.abs(deltaX)) return;
        if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE) return;
        if (deltaX < 0) {
            nextSlide();
        } else {
            prevSlide();
        }
    }

    if (slides.length > 0) {
        resetInterval();
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => showSlide(index));
        });
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        slides.forEach((slide) => {
            slide.addEventListener('touchstart', handleSliderTouchStart, { passive: true });
            slide.addEventListener('touchend', handleSliderTouchEnd, { passive: true });
        });
    }

    setupClickableCards();
    setupHorizontalCardRows();
    centerFeaturedPlanCarousel();
    renderCartSidebar();
    renderCheckoutSummary();
    setupCheckoutSubmit();
    window.addEventListener('resize', () => {
        setupHorizontalCardRows();
        centerFeaturedPlanCarousel();
    });

    // Inicializar iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
