<?php
/**
 * Global Header — Portfolio AI
 * Included at the top of every public-facing page.
 *
 * Expects the following constants to be defined before inclusion:
 *   PAGE_TITLE       string  — <title> tag content
 *   PAGE_DESCRIPTION string  — meta description (optional)
 */

if (!defined('BASE_URL')) {
    define('BASE_URL', rtrim(
        (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http')
        . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost')
        . dirname($_SERVER['SCRIPT_NAME']),
        '/.'
    ));
}

$page_title       = defined('PAGE_TITLE')       ? PAGE_TITLE       : 'Sarthak Bhandari | Digital Portfolio';
$page_description = defined('PAGE_DESCRIPTION') ? PAGE_DESCRIPTION : 'Sarthak Bhandari — Full-stack developer, AI enthusiast, and future tech entrepreneur.';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="<?= e($page_description) ?>" />
    <meta name="theme-color" content="#0d0d14" />

    <!-- Open Graph -->
    <meta property="og:title"       content="<?= e($page_title) ?>" />
    <meta property="og:description" content="<?= e($page_description) ?>" />
    <meta property="og:type"        content="website" />

    <title><?= e($page_title) ?></title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

    <!-- Global stylesheet -->
    <link rel="stylesheet" href="<?= BASE_URL ?>/assets/css/style.css" />
</head>
<body>

<!-- ── Navigation ─────────────────────────────────────────── -->
<header class="site-header" id="site-header">
    <nav class="nav container" aria-label="Main navigation">
        <a href="<?= BASE_URL ?>/" class="nav__logo" aria-label="Home">
            <span class="nav__logo-icon" aria-hidden="true">⬡</span>
            <span class="nav__logo-text">Sarthak<span class="accent"> Bhandari</span></span>
        </a>

        <ul class="nav__links" role="list">
            <li><a href="<?= BASE_URL ?>/#home"      class="nav__link">Home</a></li>
            <li><a href="<?= BASE_URL ?>/#about"     class="nav__link">About</a></li>
            <li><a href="<?= BASE_URL ?>/#work"      class="nav__link">Work</a></li>
            <li><a href="<?= BASE_URL ?>/#services"  class="nav__link">Services</a></li>
            <li><a href="<?= BASE_URL ?>/#journey"   class="nav__link">Journey</a></li>
            <li><a href="<?= BASE_URL ?>/#skills"    class="nav__link">Skills</a></li>
            <li><a href="<?= BASE_URL ?>/#contact"   class="nav__link">Contact</a></li>
        </ul>

        <button class="nav__toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false">
            <span></span><span></span><span></span>
        </button>
    </nav>
</header>

<!-- ── Main content wrapper ───────────────────────────────── -->
<main id="main-content">
<?php render_flash(); ?>
