<?php
/**
 * Authentication helpers for Portfolio AI admin.
 */

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/functions.php';

/**
 * Authenticate an admin user by username and password.
 */
function auth_login(string $username, string $password): bool {
    try {
        $pdo = get_db();
        $stmt = $pdo->prepare('SELECT id, username, password_hash, role FROM users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            return false;
        }

        if (!password_verify($password, $user['password_hash'])) {
            return false;
        }

        if (($user['role'] ?? '') !== 'admin') {
            return false;
        }

        $_SESSION['user_id']   = (int) $user['id'];
        $_SESSION['username']  = (string) $user['username'];
        $_SESSION['user_role'] = (string) $user['role'];

        return true;
    } catch (Throwable $e) {
        error_log('Auth login failed: ' . $e->getMessage());
        return false;
    }
}

/**
 * Check if an admin session is active.
 */
function auth_is_logged_in(): bool {
    return session_status() === PHP_SESSION_ACTIVE
        && !empty($_SESSION['user_id'])
        && ($_SESSION['user_role'] ?? '') === 'admin';
}

/**
 * Get the current admin username.
 */
function auth_get_username(): string {
    return (string) ($_SESSION['username'] ?? '');
}

/**
 * Require an authenticated admin session, otherwise redirect to login.
 */
function auth_require_admin(): void {
    if (!auth_is_logged_in()) {
        flash('error', 'Please log in to access the admin dashboard.');
        redirect(BASE_URL . '/admin/login.php');
    }
}

/**
 * Destroy the current session and log the user out.
 */
function auth_logout(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();
}
