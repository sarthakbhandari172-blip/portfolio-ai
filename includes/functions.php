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

/**
 * Return true for valid HTTP or HTTPS URLs.
 */
function is_valid_external_url(string $url): bool {
    $url = trim($url);
    if ($url === '') {
        return false;
    }

    if (filter_var($url, FILTER_VALIDATE_URL) === false) {
        return false;
    }

    $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
    return in_array($scheme, ['http', 'https'], true);
}

function ensure_upload_directory(string $directory): bool {
    if (is_dir($directory)) {
        return is_writable($directory);
    }

    return mkdir($directory, 0755, true);
}

function generate_random_filename(string $extension): string {
    return bin2hex(random_bytes(16)) . '.' . $extension;
}

/**
 * Upload an image file and return a relative path inside uploads/projects.
 * Throws RuntimeException on failure.
 */
function upload_image_file(array $file, string $uploadDirectory, int $maxBytes = 3145728): string {
    if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
        throw new RuntimeException('No upload was provided.');
    }

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('File upload failed.');
    }

    if (($file['size'] ?? 0) > $maxBytes) {
        throw new RuntimeException('Image must be 3MB or smaller.');
    }

    $imageInfo = @getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        throw new RuntimeException('Uploaded file is not a valid image.');
    }

    $mime = $imageInfo['mime'] ?? '';
    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];

    if (!isset($allowed[$mime])) {
        throw new RuntimeException('Supported formats: jpg, png, webp.');
    }

    if (!ensure_upload_directory($uploadDirectory)) {
        throw new RuntimeException('Unable to create upload directory.');
    }

    $filename = generate_random_filename($allowed[$mime]);
    $destination = rtrim($uploadDirectory, '/\\') . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        throw new RuntimeException('Unable to save uploaded image.');
    }

    return 'projects/' . $filename;
}

function unique_project_slug(string $title, PDO $db, ?int $excludeId = null): string {
    $base = slugify($title) ?: 'project';
    $slug = $base;
    $count = 1;

    while (true) {
        $sql = 'SELECT COUNT(*) FROM projects WHERE slug = ?';
        $params = [$slug];

        if ($excludeId !== null) {
            $sql .= ' AND id <> ?';
            $params[] = $excludeId;
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        if ((int) $stmt->fetchColumn() === 0) {
            return $slug;
        }

        $slug = $base . '-' . $count++;
    }
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
        // All icons are monochrome (currentColor) for a premium dock look.
        'email' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.5h16c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-9c0-1.1.9-2 2-2z"/><path d="M22 9l-10 6L2 9"/></svg>',
        'github' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.7.5.7 5.7.7 12.2c0 5.2 3.3 9.6 7.9 11.1.6.1.8-.3.8-.6v-2.2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1 2.1-.8 2.6-1.2.1-.7.4-1.2.7-1.5-2.6-.3-5.3-1.3-5.3-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.6 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.2 0 4.6-2.7 5.6-5.3 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.9 7.9-11.1C23.3 5.7 18.3.5 12 .5z"/></svg>',
        'linkedin' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3h-17C2.7 3 2 3.7 2 4.5v16.9c0 .8.7 1.6 1.5 1.6h17c.8 0 1.5-.8 1.5-1.6V4.5C22 3.7 21.3 3 20.5 3z"/><path d="M7.6 10.2H9.8V20H7.6v-9.8zM8.7 6.6c.7 0 1.3.6 1.3 1.3S9.4 9.2 8.7 9.2 7.4 8.6 7.4 7.9 8 6.6 8.7 6.6zM11.2 10.2h2.1v1.3h.1c.3-.6 1.2-1.4 2.5-1.4 2.7 0 3.2 1.7 3.2 4V20h-2.2v-5.1c0-1.2 0-2.7-1.7-2.7-1.7 0-1.9 1.3-1.9 2.6V20h-2.2v-9.8z" fill="#0b0b15"/></svg>',
        'instagram' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6.5" y="6.5" width="11" height="11" rx="3"/><path d="M15.7 8.8h.01"/><circle cx="12" cy="12" r="3.1"/></svg>',
        'facebook' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13.6 21v-7h2.3l.4-2.7h-2.7V9.6c0-.8.2-1.3 1.4-1.3H16V5.9c-.6-.1-1.4-.2-2.4-.2-2.4 0-4 1.5-4 4.1V11H7.1v2.7h2.5v7H13.6z"/></svg>',
        'youtube' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2c-.2-.8-.9-1.4-1.7-1.6C18.4 5.2 12 5.2 12 5.2s-6.4 0-7.9.4c-.8.2-1.4.8-1.7 1.6C2.1 8.7 2.1 12 2.1 12s0 3.3.3 4.8c.2.8.9 1.4 1.7 1.6 1.5.4 7.9.4 7.9.4s6.4 0 7.9-.4c.8-.2 1.4-.8 1.7-1.6.3-1.5.3-4.8.3-4.8s0-3.3-.3-4.8z"/><path d="M10.3 15.3V8.7L16 12l-5.7 3.3z" fill="#0b0b15"/></svg>',
        'tiktok' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v10.2a3.6 3.6 0 11-3-3.5"/><path d="M14 6.2c.9 1.7 2.3 2.7 4 3"/></svg>',
        'x' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.3l-4.9-6.4L6.2 22H2l7.4-8.5L1.9 2h6.5l4.4 5.9L18.9 2zm-1.1 18h1.7L7.1 3.9H5.3L17.8 20z"/></svg>',
        'twitter' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.9c-.7.3-1.4.5-2.2.6.8-.5 1.3-1.2 1.6-2.1-.7.4-1.5.7-2.4.9a3.7 3.7 0 00-6.4 2.5c0 .3 0 .6.1.9-3.1-.2-5.8-1.7-7.7-4.1-.3.6-.4 1.2-.4 1.9 0 1.3.7 2.5 1.7 3.2-.6 0-1.2-.2-1.7-.5v.1c0 1.9 1.3 3.4 3.1 3.8-.3.1-.7.1-1 .1-.2 0-.5 0-.7-.1.5 1.6 2 2.8 3.8 2.8a7.5 7.5 0 01-4.6 1.6c-.3 0-.6 0-.9-.1A10.6 10.6 0 008.6 20c6.9 0 10.7-5.8 10.7-10.7v-.5c.7-.5 1.3-1.1 1.7-1.8z"/></svg>',
                'whatsapp' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.8a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.3-4.4A8.4 8.4 0 1 1 20.5 11.8Z"/><path d="M8.7 8.4c.2-.5.4-.6.8-.6h.5c.2 0 .4.1.5.4l.7 1.7c.1.3.1.5-.1.7l-.4.5c-.1.1-.2.3-.1.5.4.8 1.1 1.5 1.9 2 .2.1.4.1.5-.1l.6-.7c.2-.2.4-.3.7-.2l1.7.8c.3.1.4.3.4.6 0 .6-.2 1.1-.6 1.5-.4.4-1.1.6-1.8.5-2.9-.5-5.3-2.6-6.2-5.4-.3-.9-.1-1.8.4-2.5Z"/></svg>',
        'website' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3.2 3 14.8 0 18"/><path d="M12 3c-3 3.2-3 14.8 0 18"/></svg>',
    ];
    
    // Return specific icon or fallback to generic link icon
    if (isset($icons[$platform])) {
        return $icons[$platform];
    }
    
    // Fallback generic link/globe icon
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.1 0l1.4-1.4a5 5 0 10-7.1-7.1L10 4.9"/><path d="M14 11a5 5 0 01-7.1 0L5.5 9.6a5 5 0 017.1-7.1L14 4.9"/></svg>';
}
