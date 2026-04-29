<?php
if (!defined('ABSPATH')) {
    exit;
}

get_header();
echo oasis_render_static_page('index.html');
get_footer();
