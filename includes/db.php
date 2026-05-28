<?php
/**
 * Database Connection — Portfolio AI
 * Returns a singleton PDO instance.
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'portfolio_ai');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

function get_db(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST, DB_NAME, DB_CHARSET
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // In production, log rather than expose details.
            error_log('DB Connection failed: ' . $e->getMessage());
            http_response_code(503);
            die(json_encode(['error' => 'Database unavailable. Please try again later.']));
        }
    }

    return $pdo;
}
