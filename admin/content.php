<?php
if (session_status() !== PHP_SESSION_ACTIVE) session_start();

$rootPath = dirname(dirname($_SERVER['SCRIPT_NAME']));
define('BASE_URL', rtrim((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . ($rootPath === '/' ? '' : $rootPath), '/.'));

require_once __DIR__ . '/../includes/auth.php';
auth_require_admin();

$db = get_db();

if (is_post()) {
    if (!verify_csrf()) {
        flash('error', 'CSRF verification failed.');
        redirect(BASE_URL . '/admin/content.php');
    }

    $type = $_POST['type'] ?? '';
    $id = (int) ($_POST['id'] ?? 0);

    try {
        if ($type === 'section') {
            $stmt = $db->prepare('UPDATE section_content SET label=?, title=?, accent=?, description=? WHERE section_key=?');
            $stmt->execute([
                trim((string) ($_POST['label'] ?? '')),
                trim((string) ($_POST['title'] ?? '')),
                trim((string) ($_POST['accent'] ?? '')),
                trim((string) ($_POST['description'] ?? '')),
                trim((string) ($_POST['section_key'] ?? '')),
            ]);
            flash('success', 'Section text saved.');
        }

        if ($type === 'service') {
            $data = [
                trim((string) ($_POST['title'] ?? '')),
                trim((string) ($_POST['description'] ?? '')),
                trim((string) ($_POST['icon_text'] ?? '◆')),
                trim((string) ($_POST['badge_text'] ?? 'Service')),
                ($_POST['badge_style'] ?? 'cyan') === 'ok' ? 'ok' : 'cyan',
                trim((string) ($_POST['cta_text'] ?? 'Contact ->')),
                trim((string) ($_POST['cta_url'] ?? '#contact')),
                max(0, min(999, (int) ($_POST['sort_order'] ?? 0))),
                isset($_POST['is_active']) ? 1 : 0,
            ];
            if ($id > 0) {
                $stmt = $db->prepare('UPDATE services SET title=?, description=?, icon_text=?, badge_text=?, badge_style=?, cta_text=?, cta_url=?, sort_order=?, is_active=? WHERE id=?');
                $stmt->execute([...$data, $id]);
            } else {
                $stmt = $db->prepare('INSERT INTO services (title, description, icon_text, badge_text, badge_style, cta_text, cta_url, sort_order, is_active) VALUES (?,?,?,?,?,?,?,?,?)');
                $stmt->execute($data);
            }
            flash('success', 'Service saved.');
        }

        if ($type === 'journey') {
            $data = [
                trim((string) ($_POST['company'] ?? '')),
                trim((string) ($_POST['role'] ?? '')),
                $_POST['start_date'] ?: date('Y-m-d'),
                $_POST['end_date'] ?: null,
                trim((string) ($_POST['description'] ?? '')),
                max(0, min(999, (int) ($_POST['sort_order'] ?? 0))),
                trim((string) ($_POST['period'] ?? '')),
                trim((string) ($_POST['icon'] ?? '◆')),
                trim((string) ($_POST['status'] ?? 'Archived')),
            ];
            if ($id > 0) {
                $stmt = $db->prepare('UPDATE experience SET company=?, role=?, start_date=?, end_date=?, description=?, sort_order=?, period=?, icon=?, status=? WHERE id=?');
                $stmt->execute([...$data, $id]);
            } else {
                $stmt = $db->prepare('INSERT INTO experience (company, role, start_date, end_date, description, sort_order, period, icon, status) VALUES (?,?,?,?,?,?,?,?,?)');
                $stmt->execute($data);
            }
            flash('success', 'Journey item saved.');
        }
    } catch (Throwable $e) {
        flash('error', 'Save failed: ' . $e->getMessage());
    }
    redirect(BASE_URL . '/admin/content.php');
}

$sections = $db->query('SELECT * FROM section_content ORDER BY section_key')->fetchAll(PDO::FETCH_ASSOC);
$services = $db->query('SELECT * FROM services ORDER BY sort_order,id')->fetchAll(PDO::FETCH_ASSOC);
$journey = $db->query('SELECT * FROM experience ORDER BY sort_order,start_date DESC')->fetchAll(PDO::FETCH_ASSOC);

define('PAGE_TITLE', 'Content Manager | Portfolio AI');
require_once __DIR__ . '/../includes/header.php';
?>
<section class="section">
  <div class="container" style="max-width:1100px;">
    <p class="section-label">Admin Controls</p>
    <h1 class="section-title">Content Manager</h1>
    <p style="color:var(--t2);margin-bottom:1.5rem;">Edit section headers, service cards, and journey cards.</p>
    <a href="<?= BASE_URL ?>/admin/dashboard.php" class="btn btn--outline" style="margin-bottom:1.5rem;">Back to Dashboard</a>

    <h2>Section Text</h2>
    <div class="grid2" style="margin:1rem 0 2rem;">
      <?php foreach ($sections as $s): ?>
      <form class="card" method="POST" style="display:grid;gap:.75rem;">
        <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
        <input type="hidden" name="type" value="section">
        <input type="hidden" name="section_key" value="<?= e($s['section_key']) ?>">
        <strong><?= e($s['section_key']) ?></strong>
        <input name="label" value="<?= e((string)$s['label']) ?>" placeholder="Label">
        <input name="title" value="<?= e((string)$s['title']) ?>" placeholder="Title">
        <input name="accent" value="<?= e((string)$s['accent']) ?>" placeholder="Accent word">
        <textarea name="description" rows="3" placeholder="Description"><?= e((string)$s['description']) ?></textarea>
        <button class="btn btn--primary" type="submit">Save Section</button>
      </form>
      <?php endforeach; ?>
    </div>

    <h2>Services</h2>
    <div class="grid2" style="margin:1rem 0 2rem;">
      <?php foreach ([['id'=>0,'title'=>'','description'=>'','icon_text'=>'◆','badge_text'=>'Service','badge_style'=>'cyan','cta_text'=>'Contact ->','cta_url'=>'#contact','sort_order'=>0,'is_active'=>1], ...$services] as $s): ?>
      <form class="card" method="POST" style="display:grid;gap:.75rem;">
        <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
        <input type="hidden" name="type" value="service">
        <input type="hidden" name="id" value="<?= e((string)$s['id']) ?>">
        <input name="title" value="<?= e((string)$s['title']) ?>" placeholder="Service title" required>
        <textarea name="description" rows="4" placeholder="Description"><?= e((string)$s['description']) ?></textarea>
        <input name="icon_text" value="<?= e((string)$s['icon_text']) ?>" placeholder="Icon text">
        <input name="badge_text" value="<?= e((string)$s['badge_text']) ?>" placeholder="Badge">
        <select name="badge_style"><option value="cyan" <?= ($s['badge_style']??'')==='cyan'?'selected':'' ?>>Cyan</option><option value="ok" <?= ($s['badge_style']??'')==='ok'?'selected':'' ?>>Green</option></select>
        <input name="cta_text" value="<?= e((string)$s['cta_text']) ?>" placeholder="CTA text">
        <input name="cta_url" value="<?= e((string)$s['cta_url']) ?>" placeholder="#contact">
        <input type="number" name="sort_order" value="<?= e((string)$s['sort_order']) ?>" placeholder="Sort">
        <label><input type="checkbox" name="is_active" <?= !empty($s['is_active'])?'checked':'' ?>> Active</label>
        <button class="btn btn--primary" type="submit"><?= $s['id'] ? 'Save Service' : 'Add Service' ?></button>
      </form>
      <?php endforeach; ?>
    </div>

    <h2>Journey</h2>
    <div class="grid2" style="margin-top:1rem;">
      <?php foreach ([['id'=>0,'company'=>'','role'=>'','start_date'=>date('Y-m-d'),'end_date'=>'','description'=>'','sort_order'=>0,'period'=>'','icon'=>'◆','status'=>'Active'], ...$journey] as $j): ?>
      <form class="card" method="POST" style="display:grid;gap:.75rem;">
        <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
        <input type="hidden" name="type" value="journey">
        <input type="hidden" name="id" value="<?= e((string)$j['id']) ?>">
        <input name="role" value="<?= e((string)$j['role']) ?>" placeholder="Role/title" required>
        <input name="company" value="<?= e((string)$j['company']) ?>" placeholder="Company/program" required>
        <input name="period" value="<?= e((string)($j['period'] ?? '')) ?>" placeholder="2025 - PRESENT">
        <input name="icon" value="<?= e((string)($j['icon'] ?? '◆')) ?>" placeholder="Icon">
        <input name="status" value="<?= e((string)($j['status'] ?? 'Archived')) ?>" placeholder="Status">
        <input type="date" name="start_date" value="<?= e((string)$j['start_date']) ?>">
        <input type="date" name="end_date" value="<?= e((string)($j['end_date'] ?? '')) ?>">
        <textarea name="description" rows="4" placeholder="Description"><?= e((string)$j['description']) ?></textarea>
        <input type="number" name="sort_order" value="<?= e((string)$j['sort_order']) ?>">
        <button class="btn btn--primary" type="submit"><?= $j['id'] ? 'Save Journey' : 'Add Journey' ?></button>
      </form>
      <?php endforeach; ?>
    </div>
  </div>
</section>
<?php require_once __DIR__ . '/../includes/footer.php';
