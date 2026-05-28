<?php
/**
 * Admin social links management — Portfolio AI
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

define('PAGE_TITLE', 'Social Links | Portfolio AI');
define('PAGE_DESCRIPTION', 'Manage public social and contact links for Portfolio AI.');
require_once __DIR__ . '/../includes/header.php';

$social_links = [];
$tableError = null;
$editLink = null;

function is_social_url(string $url): bool {
    return preg_match('/^(https?:\/\/|mailto:)[^\s]+$/i', $url) === 1;
}

if (is_post()) {
    if (!verify_csrf()) {
        flash('error', 'CSRF verification failed.');
        redirect(BASE_URL . '/admin/social-links.php');
    }

    $action = $_POST['action'] ?? '';
    $id = (int) ($_POST['id'] ?? 0);

    if ($action === 'save') {
        $platform = trim($_POST['platform'] ?? '');
        $url = trim($_POST['url'] ?? '');
        $label = trim($_POST['label'] ?? '');
        $icon_text = trim($_POST['icon_text'] ?? '');
        $sort_order = max(0, min(999, (int) ($_POST['sort_order'] ?? 0)));
        $is_active = isset($_POST['is_active']) ? 1 : 0;

        if ($platform === '' || $url === '' || $icon_text === '') {
            flash('error', 'Platform, URL, and icon text are required.');
            $editLink = compact('id', 'platform', 'url', 'label', 'icon_text', 'sort_order', 'is_active');
        } elseif (!is_social_url($url)) {
            flash('error', 'URL must begin with https://, http://, or mailto:.');
            $editLink = compact('id', 'platform', 'url', 'label', 'icon_text', 'sort_order', 'is_active');
        } else {
            try {
                if ($id > 0) {
                    $stmt = get_db()->prepare(
                        'UPDATE social_links SET platform = ?, url = ?, label = ?, icon_text = ?, sort_order = ?, is_active = ? WHERE id = ? LIMIT 1'
                    );
                    $stmt->execute([$platform, $url, $label, $icon_text, $sort_order, $is_active, $id]);
                    flash('success', 'Social link updated successfully.');
                } else {
                    $stmt = get_db()->prepare(
                        'INSERT INTO social_links (platform, url, label, icon_text, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)'
                    );
                    $stmt->execute([$platform, $url, $label, $icon_text, $sort_order, $is_active]);
                    flash('success', 'Social link added successfully.');
                }
                redirect(BASE_URL . '/admin/social-links.php');
            } catch (Throwable $e) {
                flash('error', 'Database error saving link.');
                $editLink = compact('id', 'platform', 'url', 'label', 'icon_text', 'sort_order', 'is_active');
            }
        }
    }

    if ($action === 'delete' && $id > 0) {
        try {
            $stmt = get_db()->prepare('DELETE FROM social_links WHERE id = ? LIMIT 1');
            $stmt->execute([$id]);
            flash('success', 'Social link removed.');
        } catch (Throwable $e) {
            flash('error', 'Unable to delete social link.');
        }
        redirect(BASE_URL . '/admin/social-links.php');
    }

    if ($action === 'toggle' && $id > 0) {
        $current = (int) ($_POST['current_status'] ?? 0);
        $newState = $current ? 0 : 1;
        try {
            $stmt = get_db()->prepare('UPDATE social_links SET is_active = ? WHERE id = ? LIMIT 1');
            $stmt->execute([$newState, $id]);
            flash('success', $newState ? 'Link activated.' : 'Link deactivated.');
        } catch (Throwable $e) {
            flash('error', 'Unable to update link status.');
        }
        redirect(BASE_URL . '/admin/social-links.php');
    }
}

try {
    $stmt = get_db()->query('SELECT * FROM social_links ORDER BY sort_order ASC, platform ASC');
    $social_links = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    $tableError = 'The social_links table is unavailable. Import the updated database schema before managing public contact links.';
}

if (isset($_GET['edit'])) {
    $editId = (int) $_GET['edit'];
    if ($editId > 0) {
        try {
            $stmt = get_db()->prepare('SELECT * FROM social_links WHERE id = ? LIMIT 1');
            $stmt->execute([$editId]);
            $editLink = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$editLink) {
                flash('error', 'Requested social link not found.');
                redirect(BASE_URL . '/admin/social-links.php');
            }
        } catch (Throwable $e) {
            flash('error', 'Unable to load social link for editing.');
            redirect(BASE_URL . '/admin/social-links.php');
        }
    }
}
?>

<section class="section" aria-label="Admin Social Links">
    <div class="container" style="max-width:1020px;">
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:1rem; align-items:flex-end; margin-bottom:2rem;">
            <div>
                <p class="section-label">Admin Controls</p>
                <h1 class="section-title">Social Links</h1>
                <p style="color:var(--t2); max-width:64ch;">Create, update, and publish the public social/contact channels used across the homepage and footer.</p>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:0.75rem; align-items:center;">
                <a href="<?= BASE_URL ?>/admin/dashboard.php" class="btn btn--outline">Back to Dashboard</a>
            </div>
        </div>

        <?php if ($tableError): ?>
            <div class="flash flash--error" style="margin-bottom:1.5rem;"><?= e($tableError) ?></div>
        <?php endif; ?>

        <div class="grid2" style="gap:2rem;">
            <div class="card" style="padding:1.5rem;">
                <h2 style="margin-bottom:1rem;"><?= $editLink ? 'Edit Link' : 'Add New Link' ?></h2>

                <form action="" method="POST" style="display:grid; gap:1rem;">
                    <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                    <input type="hidden" name="action" value="save">
                    <input type="hidden" name="id" value="<?= e((string) ($editLink['id'] ?? 0)) ?>">

                    <label style="font-family:var(--mono); font-size:.82rem; color:var(--t2);">
                        Platform
                        <input type="text" name="platform" value="<?= e((string) ($editLink['platform'] ?? '')) ?>" required style="width:100%; margin-top:.5rem; padding:.85rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,.18); background:rgba(6,6,18,.92); color:var(--t1);">
                    </label>

                    <label style="font-family:var(--mono); font-size:.82rem; color:var(--t2);">
                        URL
                        <input type="text" name="url" value="<?= e((string) ($editLink['url'] ?? '')) ?>" required placeholder="https://... or mailto:..." style="width:100%; margin-top:.5rem; padding:.85rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,.18); background:rgba(6,6,18,.92); color:var(--t1);">
                    </label>

                    <label style="font-family:var(--mono); font-size:.82rem; color:var(--t2);">
                        Label
                        <input type="text" name="label" value="<?= e((string) ($editLink['label'] ?? '')) ?>" placeholder="GitHub Profile, Email Uplink, etc." style="width:100%; margin-top:.5rem; padding:.85rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,.18); background:rgba(6,6,18,.92); color:var(--t1);">
                    </label>

                    <label style="font-family:var(--mono); font-size:.82rem; color:var(--t2);">
                        Icon Text
                        <input type="text" name="icon_text" value="<?= e((string) ($editLink['icon_text'] ?? '')) ?>" required placeholder="GH, LI, EM" style="width:100%; margin-top:.5rem; padding:.85rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,.18); background:rgba(6,6,18,.92); color:var(--t1);">
                    </label>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; align-items:center;">
                        <label style="font-family:var(--mono); font-size:.82rem; color:var(--t2);">
                            Sort Order
                            <input type="number" name="sort_order" value="<?= e((string) ($editLink['sort_order'] ?? 0)) ?>" min="0" max="999" style="width:100%; margin-top:.5rem; padding:.85rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,.18); background:rgba(6,6,18,.92); color:var(--t1);">
                        </label>
                        <label style="display:flex; align-items:center; gap:0.5rem; font-family:var(--mono); font-size:.82rem; color:var(--t2);">
                            <input type="checkbox" name="is_active" <?= !empty($editLink['is_active']) ? 'checked' : '' ?> style="accent-color:var(--acc2);">
                            Active
                        </label>
                    </div>

                    <button type="submit" class="btn btn--primary" style="justify-content:center; width:min(100%,220px);">
                        <?= $editLink ? 'Save Changes' : 'Add Link' ?>
                    </button>
                </form>
            </div>

            <div class="card" style="padding:1.5rem;">
                <h2 style="margin-bottom:1rem;">Current Social Links</h2>
                <?php if (empty($social_links)): ?>
                    <p style="color:var(--t2);">No social links are configured yet.</p>
                <?php else: ?>
                    <div style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="text-align:left; border-bottom:1px solid rgba(255,255,255,.08);">
                                    <th style="padding:.75rem 0;">Name</th>
                                    <th style="padding:.75rem 0;">URL</th>
                                    <th style="padding:.75rem 0;">Code</th>
                                    <th style="padding:.75rem 0;">Status</th>
                                    <th style="padding:.75rem 0; text-align:right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($social_links as $link): ?>
                                    <tr style="border-bottom:1px solid rgba(255,255,255,.06);">
                                        <td style="padding:.85rem 0; vertical-align:top;"><?php echo e($link['platform']); ?></td>
                                        <td style="padding:.85rem 0; vertical-align:top; color:var(--acc2); word-break:break-all;"><a href="<?= e($link['url']) ?>" <?= strpos($link['url'] ?? '', 'mailto:') === 0 ? '' : 'target="_blank" rel="noopener noreferrer"' ?>><?= e($link['url']) ?></a></td>
                                        <td style="padding:.85rem 0; vertical-align:top;"><?= e($link['icon_text'] ?? '') ?></td>
                                        <td style="padding:.85rem 0; vertical-align:top; color:<?= $link['is_active'] ? 'var(--acc2)' : 'var(--t2)' ?>;"><?= $link['is_active'] ? 'Active' : 'Inactive' ?></td>
                                        <td style="padding:.85rem 0; vertical-align:top; text-align:right; display:flex; flex-wrap:wrap; gap:.5rem; justify-content:flex-end;">
                                            <a href="?edit=<?= e((string) $link['id']) ?>" class="btn btn--outline" style="padding:.55rem .85rem;">Edit</a>
                                            <form action="" method="POST" style="display:inline-flex; gap:.5rem;">
                                                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                                                <input type="hidden" name="action" value="toggle">
                                                <input type="hidden" name="id" value="<?= e((string) $link['id']) ?>">
                                                <input type="hidden" name="current_status" value="<?= e((string) $link['is_active']) ?>">
                                                <button type="submit" class="btn btn--outline" style="padding:.55rem .85rem;"><?= $link['is_active'] ? 'Deactivate' : 'Activate' ?></button>
                                            </form>
                                            <form action="" method="POST" style="display:inline-flex; gap:.5rem;">
                                                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                                                <input type="hidden" name="action" value="delete">
                                                <input type="hidden" name="id" value="<?= e((string) $link['id']) ?>">
                                                <button type="submit" class="btn btn--danger" style="padding:.55rem .85rem;">Delete</button>
                                            </form>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</section>

<?php require_once __DIR__ . '/../includes/footer.php';
