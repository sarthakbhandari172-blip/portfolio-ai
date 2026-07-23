<?php
/**
 * Admin dashboard for Portfolio AI.
 */

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$rootPath = dirname(dirname($_SERVER['SCRIPT_NAME']));
define('BASE_URL', rtrim(
    (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http')
    . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost')
    . ($rootPath === '/' ? '' : $rootPath),
    '/.'
));

require_once __DIR__ . '/../includes/auth.php';

auth_require_admin();

define('PAGE_TITLE', 'Admin Dashboard | Portfolio AI');
define('PAGE_DESCRIPTION', 'Administrator dashboard for Portfolio AI.');
require_once __DIR__ . '/../includes/header.php';

$stats = [
    'users' => 0,
    'messages' => 0,
    'active_projects' => 0,
];

try {
    $db = get_db();

    $stmt = $db->query('SELECT COUNT(*) AS total FROM users');
    $stats['users'] = (int) $stmt->fetchColumn();

    $stmt = $db->query('SELECT COUNT(*) AS total FROM contact_messages');
    $stats['messages'] = (int) $stmt->fetchColumn();

    $stmt = $db->query('SELECT COUNT(*) AS total FROM projects WHERE is_active = 1');
    $stats['active_projects'] = (int) $stmt->fetchColumn();
} catch (Throwable $e) {
    // Keep counts at zero if the query fails.
}
?>

<section class="section" aria-label="Admin Dashboard">
    <div class="container" style="max-width:900px;">
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:1rem; align-items:flex-end; margin-bottom:2rem;">
            <div>
                <p class="section-label">Admin Console</p>
                <h1 class="section-title">Welcome, <?= e(auth_get_username()) ?></h1>
                <p style="color:var(--t2); max-width:68ch;">This is the admin foundation. Use the logout action when you are finished managing portfolio data.</p>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:0.75rem; align-items:center;">
                <a href="<?= BASE_URL ?>/admin/projects.php" class="btn btn--primary">Work / Projects</a>
                <a href="<?= BASE_URL ?>/admin/content.php" class="btn btn--primary">Content</a>
                <a href="<?= BASE_URL ?>/admin/profile.php" class="btn btn--primary">Profile Photo</a>
                <a href="<?= BASE_URL ?>/admin/social-links.php" class="btn btn--primary">Social Links</a>
                <a href="<?= BASE_URL ?>/admin/logout.php" class="btn btn--outline">Logout</a>
            </div>
        </div>

        <div class="grid2">
            <div class="card">
                <h3 style="margin-bottom:.75rem;">User Accounts</h3>
                <p style="font-size:3rem; margin:0;"><?= e((string) $stats['users']) ?></p>
                <p style="color:var(--t2); margin-top:.75rem;">Registered user accounts in the database.</p>
            </div>
            <div class="card">
                <h3 style="margin-bottom:.75rem;">Active Projects</h3>
                <p style="font-size:3rem; margin:0;"><?= e((string) $stats['active_projects']) ?></p>
                <p style="color:var(--t2); margin-top:.75rem;">Featured work cards currently visible on the public site.</p>
            </div>
            <div class="card">
                <h3 style="margin-bottom:.75rem;">Contact Messages</h3>
                <p style="font-size:3rem; margin:0;"><?= e((string) $stats['messages']) ?></p>
                <p style="color:var(--t2); margin-top:.75rem;">Messages submitted through the contact form.</p>
            </div>
        </div>

        <div class="card" style="margin-top:2rem;">
            <h2 style="margin-bottom:1rem;">Admin System Foundation</h2>
            <p style="color:var(--t2); line-height:1.8; margin-bottom:1rem;">The dashboard is protected by session authentication. Only users with the <code style="background:rgba(255,255,255,.05); padding:.15rem .35rem; border-radius:4px;">admin</code> role may access this area.</p>
            <p style="color:var(--t2);">Next steps: add CRUD pages for projects, skills, experience, profile settings, and message review as needed.</p>
        </div>
    </div>
</section>

<?php require_once __DIR__ . '/../includes/footer.php';
