<?php
/**
 * Admin profile avatar upload page — Portfolio AI
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

define('PAGE_TITLE', 'Profile Photo | Portfolio AI');
define('PAGE_DESCRIPTION', 'Upload and manage the hero profile avatar.');
require_once __DIR__ . '/../includes/header.php';

$profile = null;
$tableError = null;
$currentAvatar = '';

try {
    $db = get_db();
    $stmt = $db->query('SELECT * FROM profile ORDER BY updated_at DESC, id DESC LIMIT 1');
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!empty($profile['avatar'])) {
        $currentAvatar = upload_url($profile['avatar']);
    }
} catch (Throwable $e) {
    $tableError = 'The profile table is unavailable. Ensure the database schema is installed correctly.';
}

if (is_post()) {
    if (!verify_csrf()) {
        flash('error', 'CSRF verification failed. Please try again.');
        redirect(BASE_URL . '/admin/profile.php');
    }

    $file = $_FILES['avatar'] ?? null;
    if (!is_array($file) || $file['error'] !== UPLOAD_ERR_OK) {
        flash('error', 'Please select a valid image file.');
        redirect(BASE_URL . '/admin/profile.php');
    }

    if ($file['size'] > 3 * 1024 * 1024) {
        flash('error', 'Image exceeds the 3MB upload limit.');
        redirect(BASE_URL . '/admin/profile.php');
    }

    $tmpPath = $file['tmp_name'] ?? '';
    if (!is_uploaded_file($tmpPath)) {
        flash('error', 'Invalid upload request.');
        redirect(BASE_URL . '/admin/profile.php');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($tmpPath) ?: '';
    $allowedMime = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];

    if (!isset($allowedMime[$mime]) || getimagesize($tmpPath) === false) {
        flash('error', 'Only JPG, PNG, and WEBP images are accepted.');
        redirect(BASE_URL . '/admin/profile.php');
    }

    $extension = $allowedMime[$mime];
    $filename = bin2hex(random_bytes(16)) . '.' . $extension;
    $uploadDir = __DIR__ . '/../uploads/profile';
    $relativePath = 'profile/' . $filename;
    $destination = $uploadDir . '/' . $filename;

    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
        flash('error', 'Unable to create storage directory for uploads.');
        redirect(BASE_URL . '/admin/profile.php');
    }

    if (!move_uploaded_file($tmpPath, $destination)) {
        flash('error', 'Failed to move uploaded image to persistent storage.');
        redirect(BASE_URL . '/admin/profile.php');
    }

    try {
        if ($profile && !empty($profile['id'])) {
            $stmt = $db->prepare('UPDATE profile SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? LIMIT 1');
            $stmt->execute([$relativePath, $profile['id']]);
        } else {
            $stmt = $db->prepare('INSERT INTO profile (full_name, avatar) VALUES (?, ?)');
            $stmt->execute(['Portfolio Owner', $relativePath]);
        }

        if (!empty($profile['avatar']) && str_starts_with($profile['avatar'], 'profile/')) {
            $oldPath = __DIR__ . '/../uploads/' . $profile['avatar'];
            if (file_exists($oldPath) && is_file($oldPath)) {
                @unlink($oldPath);
            }
        }

        flash('success', 'Profile photo uploaded successfully.');
    } catch (Throwable $e) {
        if (file_exists($destination)) {
            @unlink($destination);
        }
        flash('error', 'Database error while saving the avatar.');
    }

    redirect(BASE_URL . '/admin/profile.php');
}
?>

<section class="section" aria-label="Admin Profile Photo Management">
    <div class="container" style="max-width:1020px;">
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:1rem; align-items:flex-end; margin-bottom:2rem;">
            <div>
                <p class="section-label">Admin Controls</p>
                <h1 class="section-title">Hero Profile Photo</h1>
                <p style="color:var(--t2); max-width:64ch;">Upload or replace the hero avatar used in the homepage lobby panel. The latest image is displayed automatically in the public hero section.</p>
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
                <h2 style="margin-bottom:1rem;">Current Profile Photo</h2>

                <?php if ($currentAvatar): ?>
                    <div style="display:flex; justify-content:center; margin-top:1rem;">
                        <img src="<?= e($currentAvatar) ?>" alt="Current lobby profile photo" style="width:240px; height:240px; object-fit:cover; border-radius:28px; border:1px solid rgba(124,58,237,.22); box-shadow:0 0 26px rgba(6,182,212,.16);">
                    </div>
                <?php else: ?>
                    <div style="margin-top:1rem; width:240px; height:240px; border-radius:28px; display:flex; align-items:center; justify-content:center; text-align:center; background:rgba(255,255,255,.02); border:1px dashed rgba(124,58,237,.32); color:var(--t2); font-family:var(--mono); letter-spacing:.08em; font-size:.9rem;">
                        No profile photo uploaded yet.
                    </div>
                <?php endif; ?>

                <p style="margin-top:1rem; color:var(--t2);">The avatar appears in the public hero lobby as a premium profile reveal inside the existing sci-fi display. Keep image dimensions near 800×800 for best results.</p>
            </div>

            <div class="card" style="padding:1.5rem;">
                <h2 style="margin-bottom:1rem;">Upload New Photo</h2>
                <form action="" method="POST" enctype="multipart/form-data" style="display:grid; gap:1rem; margin-top:1rem;">
                    <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">

                    <label style="font-family:var(--mono); font-size:.85rem; color:var(--t2);">
                        Select image
                        <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" required style="width:100%; margin-top:.75rem;">
                    </label>

                    <div style="display:grid; gap:.75rem; font-size:.88rem; color:var(--t2);">
                        <span>Allowed formats: JPG, PNG, WEBP.</span>
                        <span>Maximum file size: 3MB.</span>
                        <span>Uploads are stored in <code style="background:rgba(255,255,255,.05); padding:.15rem .35rem; border-radius:4px;">uploads/profile/</code>.</span>
                    </div>

                    <button type="submit" class="btn btn--primary" style="justify-content:center; width:min(100%,220px);">Upload Photo</button>
                </form>
            </div>
        </div>
    </div>
</section>

<?php require_once __DIR__ . '/../includes/footer.php';
