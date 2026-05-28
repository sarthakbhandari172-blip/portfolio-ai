<?php
/**
 * Admin logout for Portfolio AI.
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

auth_logout();
redirect(BASE_URL . '/admin/login.php');
