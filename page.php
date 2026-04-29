<?php
if (!defined('ABSPATH')) {
    exit;
}

get_header();

if (have_posts()) {
    while (have_posts()) {
        the_post();
        $slug = get_post_field('post_name', get_the_ID());
        $file = oasis_slug_to_static_file($slug);
        $content = trim(wp_strip_all_tags(get_the_content()));
        if (!empty($content)) {
            the_content();
        } elseif ($file) {
            echo oasis_get_static_body_content($file);
        } else {
            echo '<main class="section"><div class="container">';
            the_title('<h1>', '</h1>');
            the_content();
            echo '</div></main>';
        }
    }
}

get_footer();
