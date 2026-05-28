<?php
/**
 * Global Footer — Portfolio AI
 * Included at the bottom of every public-facing page.
 */
$current_year = date('Y');
?>

</main><!-- /#main-content -->

<!-- ── Footer ─────────────────────────────────────────────── -->
<footer class="site-footer">
    <div class="container site-footer__inner">

        <div class="site-footer__brand">
            <span class="nav__logo-icon" aria-hidden="true">⬡</span>
            <span class="nav__logo-text">Sarthak<span class="accent"> Bhandari</span></span>
            <span style="font-size:.7rem;font-family:var(--font-mono);color:var(--clr-text-muted);letter-spacing:.08em;margin-left:.5rem;">// Digital Portfolio</span>
        </div>
        <?php
        if (!function_exists('e')) {
            require_once __DIR__ . '/functions.php';
        }
        if (!isset($social_links)) {
            if (!function_exists('get_db')) {
                require_once __DIR__ . '/db.php';
            }
            try {
                $stmt = get_db()->query('SELECT * FROM social_links WHERE is_active = 1 ORDER BY sort_order ASC');
                $social_links = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Throwable) {
                $social_links = [];
            }
        }
        ?>
        <?php if (!empty($social_links)): ?>
        <div class="site-footer__socials" style="display:flex; gap:.75rem; align-items:center; flex-wrap:wrap;">
            <?php foreach ($social_links as $link):
                $url = $link['url'] ?? '#';
                $isMail = strpos($url, 'mailto:') === 0;
                $label = $link['icon_text'] ?? mb_strtoupper(mb_substr($link['platform'] ?? '', 0, 2));
            ?>
                <a href="<?= e($url) ?>" <?= $isMail ? '' : 'target="_blank" rel="noopener noreferrer"' ?> class="social-node" title="<?= e($link['label'] ?? $link['platform']) ?>"><?= e($label) ?></a>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>

        <p class="site-footer__copy">
            &copy; <?= $current_year ?> Sarthak Bhandari. Crafted with code &amp; curiosity.
        </p>

        <nav class="site-footer__nav" aria-label="Footer navigation">
            <a href="<?= BASE_URL ?>/#about"    class="footer-link">About</a>
            <a href="<?= BASE_URL ?>/#projects" class="footer-link">Projects</a>
            <a href="<?= BASE_URL ?>/#contact"  class="footer-link">Contact</a>
        </nav>

    </div><!-- /.site-footer__inner -->

    <!-- Decorative gradient line -->
    <div class="footer-glow" aria-hidden="true"></div>
</footer>

<!-- ── Scripts ─────────────────────────────────────────────── -->
<script src="<?= BASE_URL ?>/assets/js/main.js" defer></script>
</body>
</html>
