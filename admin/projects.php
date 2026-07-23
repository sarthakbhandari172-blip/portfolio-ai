<?php
/**
 * Admin Work / Projects management.
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
require_once __DIR__ . '/../includes/functions.php';

auth_require_admin();

$db = get_db();
$errors = [];
$editMode = false;
$projectId = null;
$form = [
    'title' => '',
    'category' => '',
    'description' => '',
    'external_url' => '',
    'icon_text' => '',
    'sort_order' => '0',
    'is_active' => '1',
    'thumbnail_path' => '',
    'thumbnail_fit' => 'cover',
    'thumbnail_position' => 'center center',
];

function resolve_admin_thumbnail_url(string $path): string {
    if ($path === '') {
        return '';
    }
    if (preg_match('#^https?://#i', $path)) {
        return $path;
    }
    if (str_starts_with($path, '/')) {
        return BASE_URL . $path;
    }
    return upload_url($path);
}

function normalize_uploaded_path(string $path): string {
    return trim($path, "\n\r\t \0\x0B");
}

if (is_post()) {
    if (!verify_csrf()) {
        flash('error', 'CSRF verification failed.');
        redirect(BASE_URL . '/admin/projects.php');
    }

    $action = trim($_POST['action'] ?? '');
    $projectId = isset($_POST['project_id']) && ctype_digit((string) $_POST['project_id']) ? (int) $_POST['project_id'] : null;

    if ($action === 'delete' && $projectId !== null) {
        try {
            $stmt = $db->prepare('SELECT thumbnail_path, thumbnail FROM projects WHERE id = ? LIMIT 1');
            $stmt->execute([$projectId]);
            $project = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($project) {
                $stmt = $db->prepare('DELETE FROM projects WHERE id = ?');
                $stmt->execute([$projectId]);

                $oldPath = $project['thumbnail_path'] ?: $project['thumbnail'] ?: '';
                if ($oldPath !== '') {
                    $candidate = __DIR__ . '/../uploads/' . ltrim($oldPath, '/');
                    if (is_file($candidate)) {
                        @unlink($candidate);
                    }
                }

                flash('success', 'Project has been removed successfully.');
            } else {
                flash('error', 'Project not found.');
            }
        } catch (Throwable $e) {
            flash('error', 'Unable to delete project.');
        }

        redirect(BASE_URL . '/admin/projects.php');
    }

    if ($action === 'toggle' && $projectId !== null) {
        try {
            $stmt = $db->prepare('UPDATE projects SET is_active = 1 - is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
            $stmt->execute([$projectId]);
            flash('success', 'Project visibility updated.');
        } catch (Throwable $e) {
            flash('error', 'Unable to update project status.');
        }

        redirect(BASE_URL . '/admin/projects.php');
    }

    $form['title'] = trim((string) ($_POST['title'] ?? ''));
    $form['category'] = trim((string) ($_POST['category'] ?? ''));
    $form['description'] = trim((string) ($_POST['description'] ?? ''));
    $form['external_url'] = trim((string) ($_POST['external_url'] ?? ''));
    $form['icon_text'] = trim((string) ($_POST['icon_text'] ?? ''));
    $form['sort_order'] = trim((string) ($_POST['sort_order'] ?? '0'));
    $form['is_active'] = isset($_POST['is_active']) ? '1' : '0';
    $form['thumbnail_path'] = normalize_uploaded_path((string) ($_POST['existing_thumbnail'] ?? ''));
    $form['thumbnail_fit'] = in_array(($_POST['thumbnail_fit'] ?? 'cover'), ['cover', 'contain'], true) ? $_POST['thumbnail_fit'] : 'cover';
    $form['thumbnail_position'] = trim((string) ($_POST['thumbnail_position'] ?? 'center center')) ?: 'center center';

    if ($form['title'] === '') {
        $errors[] = 'A project title is required.';
    }

    if ($form['external_url'] !== '' && !is_valid_external_url($form['external_url'])) {
        $errors[] = 'External URL must be a valid http or https address.';
    }

    if ($form['sort_order'] === '' || !preg_match('/^-?\d+$/', $form['sort_order'])) {
        $errors[] = 'Sort order must be a whole number.';
    }

    if ($form['icon_text'] === '') {
        $form['icon_text'] = '📁';
    }

    if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] !== UPLOAD_ERR_NO_FILE) {
        try {
            $newThumbnailPath = upload_image_file($_FILES['thumbnail'], __DIR__ . '/../uploads/projects');
            if ($newThumbnailPath !== '') {
                if ($form['thumbnail_path'] !== '' && $form['thumbnail_path'] !== $newThumbnailPath) {
                    $oldCandidate = __DIR__ . '/../uploads/' . ltrim($form['thumbnail_path'], '/');
                    if (is_file($oldCandidate)) {
                        @unlink($oldCandidate);
                    }
                }
                $form['thumbnail_path'] = $newThumbnailPath;
            }
        } catch (Throwable $e) {
            $errors[] = $e->getMessage();
        }
    }

    if (empty($errors)) {
        try {
            $slug = unique_project_slug($form['title'], $db, $projectId);
            $params = [
                $form['title'],
                $slug,
                $form['category'] !== '' ? $form['category'] : null,
                $form['description'] !== '' ? $form['description'] : null,
                $form['thumbnail_path'] !== '' ? $form['thumbnail_path'] : null,
                $form['external_url'] !== '' ? $form['external_url'] : null,
                $form['icon_text'] !== '' ? $form['icon_text'] : null,
                (int) $form['sort_order'],
                (int) $form['is_active'],
                $form['thumbnail_fit'],
                $form['thumbnail_position'],
            ];

            if ($projectId !== null) {
                $existingStatement = $db->prepare('SELECT thumbnail_path, thumbnail FROM projects WHERE id = ? LIMIT 1');
                $existingStatement->execute([$projectId]);
                $existingProject = $existingStatement->fetch(PDO::FETCH_ASSOC);

                $stmt = $db->prepare(
                    'UPDATE projects SET title = ?, slug = ?, category = ?, description = ?, thumbnail_path = ?, external_url = ?, icon_text = ?, sort_order = ?, is_active = ?, thumbnail_fit = ?, thumbnail_position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
                );
                $params[] = $projectId;
                $stmt->execute($params);
                flash('success', 'Project updated successfully.');
            } else {
                $stmt = $db->prepare(
                    'INSERT INTO projects (title, slug, category, description, thumbnail_path, external_url, icon_text, sort_order, is_active, thumbnail_fit, thumbnail_position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
                );
                $stmt->execute($params);
                flash('success', 'Project created successfully.');
            }

            redirect(BASE_URL . '/admin/projects.php');
        } catch (Throwable $e) {
            $errors[] = 'Unable to save project at this time.';
        }
    }

    $editMode = $projectId !== null;
}

if (!$form['title'] && isset($_GET['edit']) && ctype_digit((string) $_GET['edit'])) {
    $projectId = (int) $_GET['edit'];
    $stmt = $db->prepare('SELECT * FROM projects WHERE id = ? LIMIT 1');
    $stmt->execute([$projectId]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($project) {
        $editMode = true;
        $form = [
            'title' => $project['title'] ?? '',
            'category' => $project['category'] ?? '',
            'description' => $project['description'] ?? '',
            'external_url' => $project['external_url'] ?? '',
            'icon_text' => $project['icon_text'] ?? '',
            'sort_order' => (string) ($project['sort_order'] ?? '0'),
            'is_active' => (isset($project['is_active']) && (int) $project['is_active'] === 1) ? '1' : '0',
            'thumbnail_path' => $project['thumbnail_path'] ?? $project['thumbnail'] ?? '',
            'thumbnail_fit' => $project['thumbnail_fit'] ?? 'cover',
            'thumbnail_position' => $project['thumbnail_position'] ?? 'center center',
        ];
    } else {
        flash('error', 'Requested project not found.');
        redirect(BASE_URL . '/admin/projects.php');
    }
}

$projects = [];
$summary = [
    'total' => 0,
    'active' => 0,
];

try {
    $stmt = $db->query('SELECT * FROM projects ORDER BY sort_order ASC, id DESC');
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $db->query('SELECT COUNT(*) FROM projects');
    $summary['total'] = (int) $stmt->fetchColumn();

    $stmt = $db->query('SELECT COUNT(*) FROM projects WHERE is_active = 1');
    $summary['active'] = (int) $stmt->fetchColumn();
} catch (Throwable $e) {
    flash('error', 'Unable to load project records.');
}

define('PAGE_TITLE', 'Admin Projects | Portfolio AI');
define('PAGE_DESCRIPTION', 'Manage featured projects for Portfolio AI.');
require_once __DIR__ . '/../includes/header.php';
?>

<section class="section" aria-label="Admin Projects">
    <div class="container" style="max-width:1100px;">
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:1rem; align-items:flex-end; margin-bottom:2rem;">
            <div>
                <p class="section-label">Admin Control</p>
                <h1 class="section-title">Work / Projects</h1>
                <p style="color:var(--t2); max-width:68ch;">Create and manage Featured Work cards for the public website. Use activation to toggle visibility.</p>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:0.75rem; align-items:center;">
                <a href="<?= BASE_URL ?>/admin/dashboard.php" class="btn btn--outline">Dashboard</a>
                <a href="<?= BASE_URL ?>/admin/logout.php" class="btn btn--primary">Logout</a>
            </div>
        </div>

        <div class="grid2" style="margin-bottom:2rem;">
            <div class="card">
                <h3 style="margin-bottom:.75rem;">Total Projects</h3>
                <p style="font-size:3rem; margin:0;"><?= e((string) $summary['total']) ?></p>
                <p style="color:var(--t2); margin-top:.75rem;">All stored project cards, active and inactive.</p>
            </div>
            <div class="card">
                <h3 style="margin-bottom:.75rem;">Active Projects</h3>
                <p style="font-size:3rem; margin:0;"><?= e((string) $summary['active']) ?></p>
                <p style="color:var(--t2); margin-top:.75rem;">Cards currently visible in the public featured work section.</p>
            </div>
        </div>

        <?php if (!empty($errors)): ?>
            <div class="flash flash--error" style="margin-bottom:1.5rem;">
                <strong>Fix these issues:</strong>
                <ul style="margin:.75rem 0 0 1.4rem;">
                    <?php foreach ($errors as $error): ?>
                        <li><?= e($error) ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>

        <div class="grid2">
                        <div class="card" style="padding:1.5rem;">
                <h2 style="margin-top:0; margin-bottom:1.2rem;">Project Records</h2>

                <?php if (empty($projects)): ?>
                    <div style="padding:1.5rem; border:1px solid rgba(255,255,255,.08); border-radius:var(--r1); background:rgba(255,255,255,.025); color:var(--t2);">
                        No project records are available yet. Add your first demo or real project from the form.
                    </div>
                <?php else: ?>
                    <div style="display:grid; gap:1rem;">
                        <?php foreach ($projects as $project): ?>
                            <?php
                                $thumb = trim((string) ($project['thumbnail_path'] ?? $project['thumbnail'] ?? ''));
                                if ($thumb !== '') {
                                    if (!preg_match('#^https?://#i', $thumb) && !str_starts_with($thumb, '/')) {
                                        $thumb = upload_url($thumb);
                                    } elseif (str_starts_with($thumb, '/')) {
                                        $thumb = BASE_URL . $thumb;
                                    }
                                }

                                $projectTitle = trim((string) ($project['title'] ?? 'Untitled Project'));
                                $projectCategory = trim((string) ($project['category'] ?? 'Project'));
                                $projectLink = trim((string) ($project['external_url'] ?? $project['live_url'] ?? ''));
                                $projectIcon = trim((string) ($project['icon_text'] ?? '📁')) ?: '📁';
                                $projectActive = isset($project['is_active']) && (int) $project['is_active'] === 1;
                            ?>

                            <div style="display:grid; grid-template-columns:92px 1fr; gap:1rem; padding:1rem; border:1px solid rgba(6,182,212,.18); border-radius:var(--r1); background:linear-gradient(135deg, rgba(124,58,237,.08), rgba(6,182,212,.035));">
                                <div style="width:92px; height:68px; border-radius:var(--r1); overflow:hidden; background:rgba(255,255,255,.035); display:flex; align-items:center; justify-content:center; border:1px solid rgba(124,58,237,.18);">
                                    <?php if ($thumb !== ''): ?>
                                        <img src="<?= e($thumb) ?>" alt="<?= e($projectTitle) ?>" style="width:100%; height:100%; object-fit:cover; display:block;" loading="lazy">
                                    <?php else: ?>
                                        <span style="font-size:1.8rem;"><?= e($projectIcon) ?></span>
                                    <?php endif; ?>
                                </div>

                                <div style="min-width:0;">
                                    <div style="display:flex; flex-wrap:wrap; gap:.5rem; align-items:center; margin-bottom:.45rem;">
                                        <strong style="font-size:1rem; color:var(--t1);"><?= e($projectTitle) ?></strong>
                                        <span class="badge badge--cyan"><?= e($projectCategory !== '' ? $projectCategory : 'Project') ?></span>
                                        <span class="<?= $projectActive ? 'badge badge--ok' : 'badge badge--muted' ?>">
                                            <?= $projectActive ? 'Active' : 'Hidden' ?>
                                        </span>
                                        <span style="font-family:var(--mono); color:var(--t2); font-size:.72rem;">Order: <?= e((string) ($project['sort_order'] ?? '0')) ?></span>
                                    </div>

                                    <?php if ($projectLink !== ''): ?>
                                        <div style="color:var(--t2); font-size:.78rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:.8rem;">
                                            <?= e($projectLink) ?>
                                        </div>
                                    <?php else: ?>
                                        <div style="color:var(--t2); font-size:.78rem; margin-bottom:.8rem;">
                                            No external link added yet.
                                        </div>
                                    <?php endif; ?>

                                    <div style="display:flex; flex-wrap:wrap; gap:.55rem;">
                                        <a href="<?= BASE_URL ?>/admin/projects.php?edit=<?= e((string) $project['id']) ?>" class="btn btn--outline" style="font-size:.78rem; padding:.48rem .75rem;">Edit</a>

                                        <form action="" method="POST" style="display:inline-block;">
                                            <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                                            <input type="hidden" name="action" value="toggle">
                                            <input type="hidden" name="project_id" value="<?= e((string) $project['id']) ?>">
                                            <button type="submit" class="btn btn--outline" style="font-size:.78rem; padding:.48rem .75rem;">
                                                <?= $projectActive ? 'Deactivate' : 'Activate' ?>
                                            </button>
                                        </form>

                                        <form action="" method="POST" style="display:inline-block;" onsubmit="return confirm('Delete this project? This cannot be undone.');">
                                            <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                                            <input type="hidden" name="action" value="delete">
                                            <input type="hidden" name="project_id" value="<?= e((string) $project['id']) ?>">
                                            <button type="submit" class="btn btn--outline" style="font-size:.78rem; padding:.48rem .75rem; color:#ffb3b3; border-color:rgba(255,179,179,.35);">Delete</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>

            <div class="card" style="padding:2rem;">
                <h2 style="margin-top:0; margin-bottom:1rem;"><?= $editMode ? 'Edit Project' : 'Add New Project' ?></h2>
                <form action="" method="POST" enctype="multipart/form-data" style="display:grid; gap:1rem;">
                    <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                    <input type="hidden" name="action" value="save">
                    <?php if ($editMode && $projectId !== null): ?>
                        <input type="hidden" name="project_id" value="<?= e((string) $projectId) ?>">
                    <?php endif; ?>
                    <input type="hidden" name="existing_thumbnail" value="<?= e($form['thumbnail_path']) ?>">

                    <label style="display:block; font-family:var(--mono); font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; color:var(--t2);">
                        Title
                        <input type="text" name="title" value="<?= e($form['title']) ?>" required style="width:100%; margin-top:.5rem; padding:.85rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,.18); background:rgba(6,6,18,.85); color:var(--t1);">
                    </label>

                    <label style="display:block; font-family:var(--mono); font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; color:var(--t2);">
                        Category
                        <input type="text" name="category" value="<?= e($form['category']) ?>" placeholder="E.g. Web App, Automation, Design" style="width:100%; margin-top:.5rem; padding:.85rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,.18); background:rgba(6,6,18,.85); color:var(--t1);">
                    </label>

                    <label style="display:block; font-family:var(--mono); font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; color:var(--t2);">
                        Description
                        <textarea name="description" rows="5" style="width:100%; margin-top:.5rem; padding:.85rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,.18); background:rgba(6,6,18,.85); color:var(--t1);"><?= e($form['description']) ?></textarea>
                    </label>

                    <label style="display:block; font-family:var(--mono); font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; color:var(--t2);">
                        External Link URL
                        <input type="url" name="external_url" value="<?= e($form['external_url']) ?>" placeholder="https://example.com" style="width:100%; margin-top:.5rem; padding:.85rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,.18); background:rgba(6,6,18,.85); color:var(--t1);">
                    </label>

                    <label style="display:block; font-family:var(--mono); font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; color:var(--t2);">
                        Icon Text / Emoji
                        <input type="text" name="icon_text" value="<?= e($form['icon_text']) ?>" placeholder="📁" maxlength="10" style="width:100%; margin-top:.5rem; padding:.85rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,.18); background:rgba(6,6,18,.85); color:var(--t1);">
                    </label>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; align-items:end;">
                        <label style="display:block; font-family:var(--mono); font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; color:var(--t2);">
                            Sort Order
                            <input type="number" name="sort_order" value="<?= e($form['sort_order']) ?>" style="width:100%; margin-top:.5rem; padding:.85rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,.18); background:rgba(6,6,18,.85); color:var(--t1);">
                        </label>
                        <label style="display:flex; gap:.75rem; align-items:center; font-family:var(--mono); font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; color:var(--t2);">
                            <input type="checkbox" name="is_active" value="1" <?= $form['is_active'] === '1' ? 'checked' : '' ?>> Active
                        </label>
                    </div>

                    <label style="display:block; font-family:var(--mono); font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; color:var(--t2);">
                        Thumbnail Upload
                        <input type="file" name="thumbnail" accept="image/jpeg,image/png,image/webp" style="width:100%; margin-top:.5rem; color:var(--t1);">
                    </label>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                        <label style="display:block; font-family:var(--mono); font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; color:var(--t2);">
                            Thumbnail Fit
                            <select name="thumbnail_fit" style="width:100%; margin-top:.5rem; padding:.85rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,.18); background:rgba(6,6,18,.85); color:var(--t1);">
                                <option value="cover" <?= $form['thumbnail_fit'] === 'cover' ? 'selected' : '' ?>>Cover / crop</option>
                                <option value="contain" <?= $form['thumbnail_fit'] === 'contain' ? 'selected' : '' ?>>Contain / full image</option>
                            </select>
                        </label>
                        <label style="display:block; font-family:var(--mono); font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; color:var(--t2);">
                            Focus Position
                            <select name="thumbnail_position" style="width:100%; margin-top:.5rem; padding:.85rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,.18); background:rgba(6,6,18,.85); color:var(--t1);">
                                <?php foreach (['center center','top center','bottom center','center left','center right'] as $pos): ?>
                                    <option value="<?= e($pos) ?>" <?= $form['thumbnail_position'] === $pos ? 'selected' : '' ?>><?= e($pos) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </label>
                    </div>

                    <?php if ($form['thumbnail_path'] !== ''): ?>
                        <div style="display:flex; align-items:center; gap:1rem; margin-top:-0.5rem; margin-bottom:1rem;">
                            <img src="<?= e(resolve_admin_thumbnail_url($form['thumbnail_path'])) ?>" alt="Current thumbnail" style="width:84px; height:64px; object-fit:cover; border-radius:var(--r1); border:1px solid rgba(124,58,237,.15);">
                            <span style="color:var(--t2); font-size:.9rem;">Current thumbnail will be replaced if a new file is selected.</span>
                        </div>
                    <?php endif; ?>

                    <div style="display:flex; flex-wrap:wrap; gap:.75rem; justify-content:flex-start; align-items:center;">
                        <button type="submit" class="btn btn--primary" style="min-width:160px;"><?= $editMode ? 'Save Changes' : 'Add Project' ?></button>
                        <?php if ($editMode): ?>
                            <a href="<?= BASE_URL ?>/admin/projects.php" class="btn btn--outline" style="min-width:160px;">Cancel Edit</a>
                        <?php endif; ?>
                    </div>
                </form>
            </div>
        </div>
    </div>
</section>

<?php require_once __DIR__ . '/../includes/footer.php';
