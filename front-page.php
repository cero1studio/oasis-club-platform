<?php
if (!defined('ABSPATH')) {
    exit;
}
get_header();

if (have_posts()) {
    while (have_posts()) {
        the_post();
        $content = trim(wp_strip_all_tags(get_the_content()));
        if (!empty($content)) {
            the_content();
        } else {
            echo oasis_get_static_body_content('index.html');
        }
    }
} else {
    echo oasis_get_static_body_content('index.html');
}

get_footer();
