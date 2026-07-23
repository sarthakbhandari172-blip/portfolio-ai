<?php
/**
 * Admin login page for Portfolio AI.
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

if (auth_is_logged_in()) {
    redirect(BASE_URL . '/admin/dashboard.php');
}

if (is_post()) {
    if (!verify_csrf()) {
        flash('error', 'CSRF verification failed.');
    } else {
        $username = trim($_POST['username'] ?? '');
        $password = trim($_POST['password'] ?? '');

        if ($username === '' || $password === '') {
            flash('error', 'Username and password are required.');
        } elseif (auth_login($username, $password)) {
            redirect(BASE_URL . '/admin/dashboard.php');
        } else {
            flash('error', 'Invalid credentials or unauthorized access.');
        }
    }
}

define('PAGE_TITLE', 'Admin Login | Portfolio AI');
define('PAGE_DESCRIPTION', 'Admin login for Portfolio AI.');
require_once __DIR__ . '/../includes/header.php';
?>

<section class="section" aria-label="Admin Login">
    <div class="container" style="max-width:520px;">
        <h1 style="margin-bottom:1rem;">Admin Login</h1>
        <p style="margin-bottom:2rem; color:var(--t2);">Enter your administrator credentials to access the dashboard.</p>

        <div class="card" style="padding:2rem;">
            <form action="" method="POST" style="display:grid; gap:1.1rem;">
                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">

                <label style="font-family:var(--mono); font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; color:var(--t2);">
                    Username
                    <input type="text" name="username" required style="width:100%; margin-top:.5rem; padding:.85rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,.18); background:rgba(6,6,18,.85); color:var(--t1);">
                </label>

                <label style="font-family:var(--mono); font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; color:var(--t2);">
                    Password
                    <input type="password" name="password" required style="width:100%; margin-top:.5rem; padding:.85rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,.18); background:rgba(6,6,18,.85); color:var(--t1);">
                </label>

                <button type="submit" class="btn btn--primary" style="width:100%; justify-content:center;">Sign In</button>
            </form>
        </div>
    </div>
</section>

<?php require_once __DIR__ . '/../includes/footer.php';
