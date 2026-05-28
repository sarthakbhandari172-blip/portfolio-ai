<?php
/**
 * Shared Utility Functions — Portfolio AI
 */

// ── Security ─────────────────────────────────────────────────

/**
 * Sanitise output for HTML context.
 */
function e(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Redirect and stop execution.
 */
function redirect(string $url): never {
    header('Location: ' . $url);
    exit;
}

/**
 * Return true if the current request is POST.
 */
function is_post(): bool {
    return $_SERVER['REQUEST_METHOD'] === 'POST';
}

/**
 * Verify a CSRF token from POST data.
 */
function verify_csrf(): bool {
    $token = $_POST['csrf_token'] ?? '';
    return hash_equals($_SESSION['csrf_token'] ?? '', $token);
}

/**
 * Generate (or retrieve) a session CSRF token.
 */
function csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// ── String helpers ───────────────────────────────────────────

/**
 * Convert a string to a URL-safe slug.
 */
function slugify(string $text): string {
    $text = mb_strtolower($text, 'UTF-8');
    $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
    $text = preg_replace('/[\s-]+/', '-', trim($text));
    return $text;
}

/**
 * Truncate a string to a given number of characters, appending "…".
 */
function truncate(string $text, int $limit = 160): string {
    if (mb_strlen($text) <= $limit) return $text;
    return mb_substr($text, 0, $limit) . '…';
}

// ── Date helpers ─────────────────────────────────────────────

/**
 * Format a MySQL datetime string for display.
 */
function format_date(string $date, string $format = 'M j, Y'): string {
    return date($format, strtotime($date));
}

// ── File / Upload helpers ────────────────────────────────────

/**
 * Return the public URL for an upload.
 * @param string $path  Relative path inside /uploads/
 */
function upload_url(string $path): string {
    return BASE_URL . '/uploads/' . ltrim($path, '/');
}

// ── Flash messages ───────────────────────────────────────────

/**
 * Store a flash message in the session.
 * @param string $type  'success' | 'error' | 'info' | 'warning'
 */
function flash(string $type, string $message): void {
    $_SESSION['flash'][] = ['type' => $type, 'message' => $message];
}

/**
 * Render and clear all flash messages.
 */
function render_flash(): void {
    if (empty($_SESSION['flash'])) return;
    foreach ($_SESSION['flash'] as $f) {
        $type    = e($f['type']);
        $message = e($f['message']);
        echo "<div class=\"flash flash--{$type}\">{$message}</div>\n";
    }
    unset($_SESSION['flash']);
}

// ── Settings helper ───────────────────────────────────────────

/**
 * Retrieve a site setting by key.
 */
function get_setting(string $key, string $default = ''): string {
    try {
        $pdo  = get_db();
        $stmt = $pdo->prepare('SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1');
        $stmt->execute([$key]);
        $row  = $stmt->fetch();
        return $row ? (string) $row['setting_value'] : $default;
    } catch (Throwable) {
        return $default;
    }
}

/**
 * Get configured social and contact links.
 */
function get_social_links(bool $activeOnly = true): array {
    try {
        $pdo = get_db();
        $sql = 'SELECT * FROM social_links' . ($activeOnly ? ' WHERE is_active = 1' : '') . ' ORDER BY sort_order ASC, platform ASC';
        $stmt = $pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable) {
        return [];
    }
}

/**
 * Return inline SVG icon markup for a given social platform.
 * Falls back to generic link icon if platform not recognised.
 */
function get_social_icon_svg(string $platform): string {
    $platform = mb_strtolower(trim($platform));
    
    $icons = [
        'github' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.001 12.001 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>',
        'linkedin' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.418-.103.249-.129.597-.129.946v5.441h-3.554s.05-8.824 0-9.749h3.554v1.381c-.009.015-.021.03-.033.046h.033v-.046c.431-.666 1.199-1.616 2.922-1.616 2.135 0 3.731 1.395 3.731 4.397v5.587zM5.337 8.855c-1.144 0-1.915-.758-1.915-1.708 0-.951.77-1.708 1.951-1.708 1.18 0 1.914.757 1.939 1.708 0 .95-.759 1.708-1.975 1.708zm1.582 11.597H3.635V9.558h3.284v10.894zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
        'instagram' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 9.797c.017.298.025.6.025.904 0 4.418-3.363 9.51-9.51 9.51-1.888 0-3.645-.553-5.12-1.508.261.031.527.048.796.048 1.564 0 3.002-.533 4.145-1.428-1.459-.027-2.691-.99-3.116-2.313.204.039.412.06.625.06.304 0 .599-.04.879-.114-1.526-.307-2.68-1.656-2.68-3.274v-.041c.45.25.966.4 1.519.418-.896-.6-1.486-1.625-1.486-2.789 0-.614.165-1.189.453-1.685 1.644 2.018 4.097 3.348 6.473 3.488-.057-.244-.086-.498-.086-.76 0-1.84 1.492-3.332 3.332-3.332.959 0 1.825.404 2.432 1.051.759-.149 1.473-.426 2.116-.807-.249.78-.778 1.434-1.468 1.847.675-.081 1.319-.26 1.918-.527-.447.671-1.013 1.261-1.664 1.734z"/></svg>',
        'facebook' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
        'twitter' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M23.953 4.57a10 10 0 002.856-3.915 10 10 0 01-2.836.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>',
        'x' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.195-6.791L2.306 21.75H-.012l7.644-8.746L.424 2.25h6.679l4.849 6.408 5.304-6.408zM17.474 19.424h1.828L6.97 4.076H5.06l12.414 15.348z"/></svg>',
        'youtube' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
        'tiktok' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 11-5.77-1.23V8.4a6.29 6.29 0 015.79 4.23v4.21a8.1 8.1 0 01-8.1-8.1V4.5a4.9 4.9 0 014.9 4.9v.17A6.15 6.15 0 0119.59 6.7v3.54a6.16 6.16 0 01-1.25-.15V6.69z"/></svg>',
        'website' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" opacity="0.5"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>',
        'email' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
    ];
    
    // Return specific icon or fallback to generic link icon
    if (isset($icons[$platform])) {
        return $icons[$platform];
    }
    
    // Fallback generic link/globe icon
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>';
}
