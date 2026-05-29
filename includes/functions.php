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
    $key = strtolower(trim($platform));
    $key = str_replace([' ', '_'], ['', ''], $key);

    $icons = [
        'email' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="2.4"/><path d="M4.5 8.2 12 13l7.5-4.8"/></svg>',

        'mail' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="2.4"/><path d="M4.5 8.2 12 13l7.5-4.8"/></svg>',

        'github' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff"><path d="M12 .8C5.8.8.8 5.9.8 12.2c0 5 3.2 9.3 7.7 10.8.6.1.8-.25.8-.56v-2.02c-3.1.7-3.8-1.34-3.8-1.34-.5-1.25-1.22-1.58-1.22-1.58-1-.68.08-.67.08-.67 1.1.08 1.68 1.15 1.68 1.15.98 1.72 2.58 1.22 3.2.93.1-.72.38-1.22.7-1.5-2.5-.29-5.14-1.28-5.14-5.68 0-1.25.43-2.27 1.14-3.07-.12-.29-.5-1.45.1-3.03 0 0 .94-.31 3.08 1.17a10.35 10.35 0 0 1 5.62 0c2.14-1.48 3.08-1.17 3.08-1.17.6 1.58.22 2.74.1 3.03.72.8 1.14 1.82 1.14 3.07 0 4.42-2.64 5.38-5.16 5.66.4.36.76 1.06.76 2.14v3.17c0 .31.2.67.8.56 4.5-1.5 7.72-5.8 7.72-10.8C23.2 5.9 18.2.8 12 .8Z"/></svg>',

        'linkedin' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="#0A66C2"/><path d="M7.2 10.2h2.45V17H7.2v-6.8Zm1.22-3.38c.78 0 1.4.62 1.4 1.38s-.62 1.38-1.4 1.38S7.02 8.96 7.02 8.2s.62-1.38 1.4-1.38ZM11 10.2h2.35v.92c.34-.54 1.1-1.08 2.28-1.08 2.44 0 2.9 1.6 2.9 3.68V17h-2.45v-2.9c0-.7-.01-1.6-.98-1.6-.98 0-1.13.76-1.13 1.54V17H11v-6.8Z" fill="#fff"/></svg>',

        'instagram' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="5" y="5" width="14" height="14" rx="4.2" stroke="#E1306C" stroke-width="1.9"/><circle cx="12" cy="12" r="3.25" stroke="#F77737" stroke-width="1.9"/><circle cx="16.25" cy="7.75" r="1" fill="#FCAF45"/></svg>',

        'facebook' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1877F2"/><path fill="#fff" d="M13.3 21v-7h2.35l.36-2.73H13.3V9.52c0-.79.22-1.33 1.35-1.33h1.45V5.75c-.25-.03-1.11-.11-2.11-.11-2.1 0-3.54 1.28-3.54 3.63v2H8.08V14h2.37v7h2.85Z"/></svg>',

        'whatsapp' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#25D366" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.8a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.3-4.4A8.4 8.4 0 1 1 20.5 11.8Z"/><path d="M8.7 8.4c.2-.5.4-.6.8-.6h.5c.2 0 .4.1.5.4l.7 1.7c.1.3.1.5-.1.7l-.4.5c-.1.1-.2.3-.1.5.4.8 1.1 1.5 1.9 2 .2.1.4.1.5-.1l.6-.7c.2-.2.4-.3.7-.2l1.7.8c.3.1.4.3.4.6 0 .6-.2 1.1-.6 1.5-.4.4-1.1.6-1.8.5-2.9-.5-5.3-2.6-6.2-5.4-.3-.9-.1-1.8.4-2.5Z"/></svg>',

        'youtube' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="6.5" width="18" height="11" rx="3" fill="#FF0000"/><path d="M10.2 9.2v5.6l5-2.8-5-2.8Z" fill="#fff"/></svg>',

        'tiktok' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M15.5 4c.35 2.35 1.75 3.75 4 4v2.55c-1.65-.05-3.05-.55-4-1.35v5.9c0 3.1-2.15 5.05-5.05 5.05-2.75 0-4.95-1.8-4.95-4.45 0-2.75 2.25-4.55 5.2-4.2v2.75c-1.25-.25-2.2.35-2.2 1.45 0 .95.8 1.55 1.78 1.55 1.22 0 2.05-.7 2.05-2.2V4h3.17Z" fill="#fff"/><path d="M15.5 4c.35 2.35 1.75 3.75 4 4" stroke="#25F4EE" stroke-width="1.4"/><path d="M8.4 15.8c0-.95.85-1.55 2.05-1.35" stroke="#FE2C55" stroke-width="1.4"/></svg>',

        'x' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff"><path d="M14.4 10.55 21.2 3h-1.62l-5.9 6.56L8.96 3H3.5l7.13 9.94L3.5 21h1.62l6.23-7.05L16.33 21h5.46l-7.39-10.45Zm-2.2 2.48-.72-1L5.74 4.2h2.44l4.64 6.36.72 1 6.04 8.3h-2.44l-4.94-6.83Z"/></svg>',

        'twitter' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M21.8 6.1c-.7.3-1.4.5-2.2.6.8-.5 1.4-1.2 1.7-2.1-.7.4-1.6.8-2.4.9A3.78 3.78 0 0 0 12.4 9c0 .3 0 .6.1.9-3.1-.2-5.9-1.7-7.8-4-.3.6-.5 1.2-.5 1.9 0 1.3.7 2.5 1.7 3.2-.6 0-1.2-.2-1.7-.5v.1c0 1.9 1.3 3.4 3.1 3.8-.3.1-.7.1-1 .1-.25 0-.5 0-.75-.06.5 1.6 2 2.75 3.8 2.78A7.6 7.6 0 0 1 4.6 19c-.3 0-.6 0-.9-.05A10.78 10.78 0 0 0 9.5 20.6c7 0 10.8-5.8 10.8-10.8v-.5c.75-.55 1.35-1.2 1.85-2Z"/></svg>',

        'website' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3.6 12h16.8"/><path d="M12 3c2.25 2.45 3.35 5.45 3.35 9S14.25 18.55 12 21c-2.25-2.45-3.35-5.45-3.35-9S9.75 5.45 12 3Z"/></svg>',

        'link' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13.5a4 4 0 0 0 5.7 0l2.2-2.2a4 4 0 0 0-5.7-5.7l-1.25 1.25"/><path d="M14 10.5a4 4 0 0 0-5.7 0l-2.2 2.2a4 4 0 0 0 5.7 5.7l1.25-1.25"/></svg>',
    ];

    return $icons[$key] ?? $icons['website'];
}
    
    // Fallback generic link/globe icon
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.1 0l1.4-1.4a5 5 0 10-7.1-7.1L10 4.9"/><path d="M14 11a5 5 0 01-7.1 0L5.5 9.6a5 5 0 017.1-7.1L14 4.9"/></svg>';

