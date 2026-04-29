<?php
if (!defined('ABSPATH')) {
    exit;
}

function oasis_theme_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
}
add_action('after_setup_theme', 'oasis_theme_setup');

function oasis_enqueue_assets() {
    $theme_uri = get_template_directory_uri();
    $theme_dir = get_template_directory();
    $style_ver = file_exists($theme_dir . '/style.css') ? filemtime($theme_dir . '/style.css') : null;
    $script_ver = file_exists($theme_dir . '/main.js') ? filemtime($theme_dir . '/main.js') : null;

    wp_enqueue_style('oasis-google-fonts', 'https://fonts.googleapis.com/css2?family=Marcellus&family=Inter:wght@300;400;500;700&display=swap', array(), null);
    wp_enqueue_style('oasis-style', $theme_uri . '/style.css', array('oasis-google-fonts'), $style_ver);
    wp_enqueue_script('oasis-lucide', 'https://unpkg.com/lucide@latest', array(), null, true);
    wp_enqueue_script('oasis-demo-products', $theme_uri . '/products-demo.js', array(), null, true);
    wp_enqueue_script('oasis-main', $theme_uri . '/main.js', array('oasis-lucide', 'oasis-demo-products'), $script_ver, true);
    wp_localize_script(
        'oasis-main',
        'oasisData',
        array(
            'productsUrl' => $theme_uri . '/products-demo.json',
        )
    );
}
add_action('wp_enqueue_scripts', 'oasis_enqueue_assets');

function oasis_register_menus() {
    register_nav_menus(
        array(
            'primary' => __('Menu principal', 'oasis-club'),
            'footer' => __('Menu footer', 'oasis-club'),
        )
    );
}
add_action('after_setup_theme', 'oasis_register_menus');

function oasis_elementor_support() {
    if (did_action('elementor/loaded')) {
        add_post_type_support('page', 'elementor');
    }
}
add_action('init', 'oasis_elementor_support');

function oasis_register_elementor_locations($elementor_theme_manager) {
    $elementor_theme_manager->register_all_core_location();
}
add_action('elementor/theme/register_locations', 'oasis_register_elementor_locations');

function oasis_slug_to_static_file($slug) {
    $map = array(
        '' => 'index.html',
        'shop' => 'shop.html',
        'membership' => 'membership.html',
        'product-single' => 'product-single.html',
        'checkout' => 'checkout.html',
        'auth' => 'auth.html',
        'account' => 'account.html',
        'terminos' => 'terminos.html',
        'privacidad' => 'privacidad.html',
        'envios-devoluciones' => 'envios-devoluciones.html',
        'contacto' => 'contacto.html',
    );

    return isset($map[$slug]) ? $map[$slug] : null;
}

function oasis_replace_static_links($html) {
    $replacements = array(
        'href="index.html"' => 'href="' . esc_url(home_url('/')) . '"',
        'href="shop.html"' => 'href="' . esc_url(home_url('/shop/')) . '"',
        'href="membership.html"' => 'href="' . esc_url(home_url('/membership/')) . '"',
        'href="product-single.html"' => 'href="' . esc_url(home_url('/product-single/')) . '"',
        'href="checkout.html"' => 'href="' . esc_url(home_url('/checkout/')) . '"',
        'href="auth.html"' => 'href="' . esc_url(home_url('/auth/')) . '"',
        'href="account.html"' => 'href="' . esc_url(home_url('/account/')) . '"',
        'href="terminos.html"' => 'href="' . esc_url(home_url('/terminos/')) . '"',
        'href="privacidad.html"' => 'href="' . esc_url(home_url('/privacidad/')) . '"',
        'href="envios-devoluciones.html"' => 'href="' . esc_url(home_url('/envios-devoluciones/')) . '"',
        'href="contacto.html"' => 'href="' . esc_url(home_url('/contacto/')) . '"',
        'src="main.js"' => 'src="' . esc_url(get_template_directory_uri() . '/main.js') . '"',
        'href="style.css"' => 'href="' . esc_url(get_template_directory_uri() . '/style.css') . '"',
        'src="caja-oasis.png"' => 'src="' . esc_url(get_template_directory_uri() . '/caja-oasis.png') . '"',
        'src="juguete.png"' => 'src="' . esc_url(get_template_directory_uri() . '/juguete.png') . '"',
        'src="seda.png"' => 'src="' . esc_url(get_template_directory_uri() . '/seda.png') . '"',
        "url('caja-oasis.png')" => "url('" . esc_url(get_template_directory_uri() . '/caja-oasis.png') . "')",
        "url('juguete.png')" => "url('" . esc_url(get_template_directory_uri() . '/juguete.png') . "')",
        "url('seda.png')" => "url('" . esc_url(get_template_directory_uri() . '/seda.png') . "')",
    );

    return strtr($html, $replacements);
}

function oasis_render_static_page($file_name) {
    $file_path = get_template_directory() . '/' . $file_name;
    if (!file_exists($file_path)) {
        return '<main class="section"><div class="container"><h1>Página no encontrada</h1></div></main>';
    }

    $content = file_get_contents($file_path);
    if ($content === false) {
        return '<main class="section"><div class="container"><h1>Error cargando contenido</h1></div></main>';
    }

    if (preg_match('/<body[^>]*>(.*)<\/body>/is', $content, $matches)) {
        $content = $matches[1];
    }

    $content = preg_replace('/<script[^>]*src="https?:\/\/unpkg\.com\/lucide@latest"[^>]*><\/script>/i', '', $content);
    $content = preg_replace('/<script[^>]*src="main\.js"[^>]*><\/script>/i', '', $content);
    $content = oasis_replace_static_links($content);

    return $content;
}

function oasis_get_static_body_content($file_name) {
    $file_path = get_template_directory() . '/' . $file_name;
    if (!file_exists($file_path)) {
        return '';
    }

    $content = file_get_contents($file_path);
    if ($content === false) {
        return '';
    }

    if (preg_match('/<body[^>]*>(.*)<\/body>/is', $content, $matches)) {
        $content = $matches[1];
    }

    $content = preg_replace('/<script[^>]*src="https?:\/\/unpkg\.com\/lucide@latest"[^>]*><\/script>/i', '', $content);
    $content = preg_replace('/<script[^>]*src="main\.js"[^>]*><\/script>/i', '', $content);
    $content = oasis_replace_static_links($content);

    return $content;
}

function oasis_seed_demo_pages() {
    $pages = array(
        '' => 'index.html',
        'shop' => 'shop.html',
        'membership' => 'membership.html',
        'product-single' => 'product-single.html',
        'checkout' => 'checkout.html',
        'auth' => 'auth.html',
        'account' => 'account.html',
        'terminos' => 'terminos.html',
        'privacidad' => 'privacidad.html',
        'envios-devoluciones' => 'envios-devoluciones.html',
        'contacto' => 'contacto.html',
    );

    foreach ($pages as $slug => $file_name) {
        $content = oasis_get_static_body_content($file_name);
        if (empty($content)) {
            continue;
        }

        if ($slug === '') {
            $existing_home = get_page_by_path('inicio');
            if (!$existing_home) {
                $home_id = wp_insert_post(
                    array(
                        'post_title' => 'Inicio',
                        'post_name' => 'inicio',
                        'post_status' => 'publish',
                        'post_type' => 'page',
                        'post_content' => $content,
                    )
                );
                if (!is_wp_error($home_id)) {
                    update_option('show_on_front', 'page');
                    update_option('page_on_front', $home_id);
                }
            }
            continue;
        }

        $existing = get_page_by_path($slug);
        if ($existing) {
            continue;
        }

        wp_insert_post(
            array(
                'post_title' => ucwords(str_replace('-', ' ', $slug)),
                'post_name' => $slug,
                'post_status' => 'publish',
                'post_type' => 'page',
                'post_content' => $content,
            )
        );
    }
}
add_action('after_switch_theme', 'oasis_seed_demo_pages');
