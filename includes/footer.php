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
            <span style="font-size:.7rem;font-family:var(--mono);color:var(--t3);letter-spacing:.08em;margin-left:.5rem;">// Void Lobby</span>
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
                $stmt = get_db()->query('SELECT * FROM social_links WHERE is_active = 1 AND (show_in_footer = 1 OR show_in_footer IS NULL) ORDER BY sort_order ASC');
                $social_links = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Throwable) {
                $social_links = [];
            }
        }
        ?>
        <?php
        $footer_social_links = array_values(array_filter($social_links, static function ($link) {
            $url = trim((string) ($link['url'] ?? ''));
            if ($url === '' || $url === '#') {
                return false;
            }
            return !isset($link['show_in_footer']) || (int) $link['show_in_footer'] === 1;
        }));
        ?>
        <?php if (!empty($footer_social_links)): ?>
        <div class="site-footer__socials" style="display:flex; gap:.75rem; align-items:center; flex-wrap:wrap;">
            <?php foreach ($footer_social_links as $link):
                $url = $link['url'] ?? '#';
                $isMail = strpos($url, 'mailto:') === 0;
                $a11yLabel = (string) ($link['label'] ?? $link['platform'] ?? 'Link');
                $platformKey = mb_strtolower(trim((string) ($link['platform'] ?? '')));
            ?>
                <a
                    href="<?= e($url) ?>"
                    <?= $isMail ? '' : 'target="_blank" rel="noopener noreferrer"' ?>
                    class="social-node"
                    title="<?= e($a11yLabel) ?>"
                    aria-label="<?= e($a11yLabel) ?>"
                    data-platform="<?= e($platformKey) ?>"
                ><?= get_social_icon_svg((string) ($link['platform'] ?? '')) ?></a>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>

        <p class="site-footer__copy">
            &copy; <?= $current_year ?> Sarthak Bhandari. Crafted with code &amp; curiosity.
        </p>

        <nav class="site-footer__nav" aria-label="Footer navigation">
            <a href="<?= BASE_URL ?>/#about"    class="footer-link">About</a>
            <a href="<?= BASE_URL ?>/#work" class="footer-link">Work</a>
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
