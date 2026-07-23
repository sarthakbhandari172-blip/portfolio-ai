<?php
/**
 * index.php — Sarthak Bhandari Digital Portfolio
 * Author: Sarthak Bhandari
 */

session_start();

define('BASE_URL', rtrim(
    (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http')
    . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost')
    . dirname($_SERVER['SCRIPT_NAME']),
    '/.'
));

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/functions.php';

// ── Contact Form Processing ───────────────────────────────────
if (is_post()) {
    if (!verify_csrf()) {
        flash('error', 'CSRF verification failed. Transmission aborted.');
    } else {
        $name    = trim($_POST['sender_name'] ?? '');
        $email   = trim($_POST['sender_email'] ?? '');
        $message = trim($_POST['message'] ?? '');
        
        if (empty($name) || empty($email) || empty($message)) {
            flash('error', 'All transmission coordinates required.');
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            flash('error', 'Invalid email transmission vector.');
        } else {
            try {
                $db = get_db();
                $stmt = $db->prepare('INSERT INTO contact_messages (sender_name, sender_email, subject, message) VALUES (?, ?, ?, ?)');
                $stmt->execute([$name, $email, 'Secure Uplink Signal', $message]);
                flash('success', 'Transmission uplink successful! Signal active.');
            } catch (Throwable $e) {
                flash('error', 'Database write error: Transmission lost.');
            }
        }
    }
    redirect(BASE_URL . '/#contact');
}

// ── Retrieve Portfolio Data from Database ─────────────────────
try {
    $db = get_db();
    
    // Fetch Skills
    $stmt = $db->query('SELECT * FROM skills ORDER BY sort_order ASC, name ASC');
    $skills = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Fetch Projects
    $stmt = $db->query('SELECT * FROM projects WHERE is_active = 1 ORDER BY sort_order ASC, id DESC');
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Fetch Experience
    $stmt = $db->query('SELECT * FROM experience ORDER BY sort_order ASC, start_date DESC');
    $experience = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch Services
    $stmt = $db->query('SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order ASC, id ASC');
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch editable section copy
    $stmt = $db->query('SELECT * FROM section_content');
    $section_content = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $section_content[$row['section_key']] = $row;
    }

    // Fetch profile avatar for hero lobby display
    $stmt = $db->query('SELECT avatar FROM profile WHERE avatar <> "" ORDER BY updated_at DESC, id DESC LIMIT 1');
    $profileAvatarRow = $stmt->fetch(PDO::FETCH_ASSOC);
    $profileAvatarUrl = '';
    if (!empty($profileAvatarRow['avatar'])) {
        $profileAvatarUrl = upload_url($profileAvatarRow['avatar']);
    }
} catch (Throwable $e) {
    $skills = [];
    $projects = [];
    $experience = [];
    $services = [];
    $section_content = [];
    $profileAvatarUrl = '';
    $social_links = [];
}

function section_copy(array $sections, string $key, string $field, string $default = ''): string {
    return (string) ($sections[$key][$field] ?? $default);
}

function section_title_html(array $sections, string $key, string $title, string $accent = ''): string {
    $main = section_copy($sections, $key, 'title', $title);
    $accentText = section_copy($sections, $key, 'accent', $accent);
    return e($main) . ($accentText !== '' ? ' <span class="accent">' . e($accentText) . '</span>' : '');
}

// Fetch public social/contact links
try {
    if (!isset($social_links)) {
        $stmt = $db->query('SELECT * FROM social_links WHERE is_active = 1 ORDER BY sort_order ASC, platform ASC');
        $social_links = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
} catch (Throwable $e) {
    $social_links = [];
}

if (empty($social_links)) {
    $social_links = [
        ['platform' => 'github', 'label' => 'GitHub Profile', 'url' => 'https://github.com', 'icon_text' => 'GH', 'show_in_hero' => 1, 'show_in_contact' => 1, 'show_in_footer' => 1],
        ['platform' => 'linkedin', 'label' => 'LinkedIn Profile', 'url' => 'https://linkedin.com', 'icon_text' => 'LI', 'show_in_hero' => 0, 'show_in_contact' => 1, 'show_in_footer' => 1],
        ['platform' => 'email', 'label' => 'Email Uplink', 'url' => 'mailto:contact@sarthakbhandari.com', 'icon_text' => 'EM', 'show_in_hero' => 1, 'show_in_contact' => 1, 'show_in_footer' => 1],
    ];
}

// Apply per-location visibility filters (defaults to visible if columns aren't present yet)
$hero_social_links = array_values(array_filter($social_links, fn($l) => !isset($l['show_in_hero']) || (int) $l['show_in_hero'] === 1));
$contact_social_links = array_values(array_filter($social_links, fn($l) => !isset($l['show_in_contact']) || (int) $l['show_in_contact'] === 1));
$hasProfileAvatar = !empty($profileAvatarUrl);

// Fallback Skills if database is unseeded
if (empty($skills)) {
    $skills = [
        ['name' => 'PHP 8.3 & PDO',      'category' => 'Languages',   'icon' => '🐘', 'proficiency' => 85],
        ['name' => 'MySQL Relational',   'category' => 'Languages',   'icon' => '🗄️', 'proficiency' => 80],
        ['name' => 'JavaScript ES2024',  'category' => 'Languages',   'icon' => '⚡', 'proficiency' => 85],
        ['name' => 'CSS3 & Grid/Flex',   'category' => 'Languages',   'icon' => '🎨', 'proficiency' => 90],
        ['name' => 'Laravel Framework',  'category' => 'Frameworks',  'icon' => '⚙️', 'proficiency' => 60],
        ['name' => 'Node.js & Express',  'category' => 'Frameworks',  'icon' => '🟢', 'proficiency' => 70],
        ['name' => 'Docker Containers',  'category' => 'Cloud/Tools', 'icon' => '🐳', 'proficiency' => 65],
        ['name' => 'Git Configuration',  'category' => 'Cloud/Tools', 'icon' => '🌿', 'proficiency' => 80],
        ['name' => 'AI System Prompting', 'category' => 'Cloud/Tools', 'icon' => '🤖', 'proficiency' => 90],
    ];
}

// Fallback Projects if database is unseeded
if (empty($projects)) {
    $projects = [
        [
            'title'       => 'Portfolio Engine',
            'description' => 'A high-fidelity digital sandbox featuring interactive RPG HUD telemetry, canvas overlay grids, and advanced glassmorphism styles.',
            'tech_stack'  => 'PHP 8, MySQL, CSS Variables, JS',
            'github_url'  => 'https://github.com',
            'live_url'    => '#',
            'icon'        => '🎮',
            'badge'       => 'Operational'
        ],
        [
            'title'       => 'AI Command Telemetry',
            'description' => 'An intelligent automation automation script designed to interface with Claude and Gemini engines for terminal security audits.',
            'tech_stack'  => 'Python, Gemini SDK, JSON-RPC',
            'github_url'  => 'https://github.com',
            'live_url'    => '#',
            'icon'        => '🤖',
            'badge'       => 'In Testing'
        ],
        [
            'title'       => 'Cloud Sync Hub',
            'description' => 'A microservices sync tool designed in PHP for light database synchronization utilizing optimized singleton PDO layers.',
            'tech_stack'  => 'PHP 8, SQLite, PDO Sync, Cron',
            'github_url'  => 'https://github.com',
            'live_url'    => '#',
            'icon'        => '🌩️',
            'badge'       => 'Planned'
        ]
    ];
}

// Fallback Experience if database is unseeded
if (empty($experience)) {
    $experience = [
        [
            'company'     => 'Self-Directed Development',
            'role'        => 'Full-Stack Builder & Automation Explorer',
            'period'      => '2025 - PRESENT',
            'description' => 'Designing premium modular templates, securing system architectures, and implementing intelligent digital workflows.',
            'icon'        => '🧬',
            'status'      => 'Active'
        ],
        [
            'company'     => 'Systems Discovery Program',
            'role'        => 'Visual Design Learner',
            'period'      => '2024 - 2025',
            'description' => 'Developed responsive interfaces, prototype systems, and user-friendly automation tools.',
            'icon'        => '🎨',
            'status'      => 'Archived'
        ],
        [
            'company'     => 'Platform Research Initiative',
            'role'        => 'Software Systems Explorer',
            'period'      => '2023',
            'description' => 'Explored procedural and object-oriented architectures, optimization patterns, and normalized database design.',
            'icon'        => '⚙️',
            'status'      => 'Archived'
        ]
    ];
}

define('PAGE_TITLE',       'Sarthak Bhandari | Digital Portfolio');
define('PAGE_DESCRIPTION', 'Sarthak Bhandari — Web Builder • Automation Explorer • Visual Design Learner.');

require_once __DIR__ . '/includes/header.php';
?>

<!-- ── Background Canvas ───────────────────────────────────── -->
<div class="bg-canvas" aria-hidden="true">
    <canvas class="bg-canvas__field" aria-hidden="true"></canvas>
    <div class="bg-canvas__orb bg-canvas__orb--1"></div>
    <div class="bg-canvas__orb bg-canvas__orb--2"></div>
    <div class="bg-canvas__orb bg-canvas__orb--3"></div>
    <div class="bg-canvas__grid"></div>
</div>

<!-- ── Hero Section ───────────────────────────────────────── -->
<section class="hero" id="home" aria-label="Introduction">
    <!-- Embedded responsive rules for split hero section layout without editing style.css -->
    <style>
        .hero__grid {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 4rem;
            align-items: center;
            text-align: left;
            width: 100%;
        }
        .hero__panel-glow {
            position: absolute;
            width: 180px;
            height: 180px;
            background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%);
            top: -20px;
            right: -20px;
            pointer-events: none;
        }
        .social-node {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            border: 1px solid rgba(124, 58, 237, 0.25);
            background: rgba(124, 58, 237, 0.05);
            color: var(--t1);
            font-size: 0.8rem;
            font-family: var(--mono);
            transition: all 0.3s var(--ease);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.03);
            text-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
        }
        .social-node:hover {
            border-color: var(--acc2);
            background: rgba(6, 182, 212, 0.15);
            color: #fff;
            box-shadow: 0 0 18px rgba(6, 182, 212, 0.4), inset 0 1px 0 rgba(6, 182, 212, 0.2);
            transform: translateY(-3px);
        }
        @media(max-width: 960px) {
            .hero__grid {
                grid-template-columns: 1fr;
                text-align: center;
                gap: 3.5rem;
            }
            .hero__title {
                text-align: center !important;
            }
            .hero__sub {
                margin-inline: auto !important;
            }
            .hero__actions {
                justify-content: center !important;
            }
            .hero__socials {
                justify-content: center !important;
            }
            .hero__status {
                justify-content: center !important;
            }
        }
    </style>

    <div class="container">
        <div class="hero__grid">
            
            <!-- Left Panel: Text & CTAs -->
            <div class="hero__left">
                <!-- Eyebrow pill -->
                <p class="hero__eyebrow" style="margin-bottom: 1.5rem;">System Online — Digital Portfolio // 2026</p>

                <!-- Main headline -->
                <h1 class="hero__title" style="text-align: left; line-height: 1.1; margin-bottom: 1.25rem;">
                    Sarthak Bhandari<br>
                    <span class="grad">Digital Portfolio</span>
                </h1>

                <!-- Subline with role definitions -->
                <p class="hero__sub" style="margin-inline: 0; margin-bottom: 1.5rem; font-size: 1.08rem; line-height: 1.65; max-width: 54ch;">
                    Web Builder &bull; Automation Explorer &bull; Visual Design Learner.<br>
                    I build clean websites, automation-based workflows, AI-assisted digital systems, and visual assets that help ideas become usable online experiences.
                </p>

                <!-- Typed role display -->
                <div style="
                    font-family: var(--mono);
                    font-size: 1.05rem;
                    color: var(--acc2);
                    margin-bottom: 2.25rem;
                    min-height: 1.6em;
                    display: flex;
                    align-items: center;
                    gap: 0.2rem;
                ">
                    <span>&gt;&nbsp;</span><span
                        id="typedRole"
                        data-typed='["Web Builder","Automation Explorer","Visual Design Learner"]'
                        data-typed-speed="70"
                        data-typed-pause="2000"
                        data-typed-erase="45"
                    ></span><span class="cursor-blink" aria-hidden="true">▌</span>
                </div>

                <!-- CTA buttons -->
                <div class="hero__actions" style="justify-content: flex-start; margin-bottom: 2.5rem; gap: 1rem;">
                    <a href="#work" class="btn btn--primary" id="cta-projects">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="margin-right: 0.35rem;">
                            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                        </svg>
                        View Work
                    </a>
                    <a href="#work" class="btn btn--portal" id="cta-enter-portal">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="margin-right: 0.35rem;">
                            <path d="M4 12h16M12 4v16"/>
                        </svg>
                        Enter Portal
                    </a>
                    <a href="#contact" class="btn btn--outline" id="cta-contact">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="margin-right: 0.35rem;">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        Contact
                    </a>
                </div>

                <!-- Social icon area placeholders -->
                <div class="hero__socials" style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                    <span style="font-family: var(--mono); font-size: 0.68rem; color: var(--t3); letter-spacing: 0.12em; text-transform: uppercase;">Channel Uplinks:</span>
                    <?php foreach ($hero_social_links as $link):
                        $url = $link['url'] ?? '#';
                        $isMail = strpos($url, 'mailto:') === 0;
                        $a11yLabel = (string) ($link['label'] ?? $link['platform'] ?? 'Link');
                        $platformKey = mb_strtolower(trim((string) ($link['platform'] ?? '')));
                    ?>
                        <a
                            href="<?= e($url) ?>"
                            <?= $isMail ? '' : 'target="_blank" rel="noopener noreferrer"' ?>
                            class="social-node"
                            title="<?= e($a11yLabel) ?>"
                            aria-label="<?= e($a11yLabel) ?>"
                            data-platform="<?= e($platformKey) ?>"
                        ><?= get_social_icon_svg((string) ($link['platform'] ?? '')) ?></a>
                    <?php endforeach; ?>
                </div>

            </div>

            <!-- Right Panel: Cinematic RPG HUD Dashboard -->
            <div class="hero__right">
    <div class="hero__panel">
        <div class="hero__panel-bg"></div>
        <div class="hero__particles" aria-hidden="true"></div>

        <span class="hero__panel-ring hero__panel-ring--outer" aria-hidden="true"></span>
        <span class="hero__panel-ring hero__panel-ring--inner" aria-hidden="true"></span>
        <span class="hero__panel-ring hero__panel-ring--accent" aria-hidden="true"></span>

        <span class="card-corner card-corner--tl"></span>
        <span class="card-corner card-corner--tr"></span>
        <span class="card-corner card-corner--bl"></span>
        <span class="card-corner card-corner--br"></span>

        <div class="hero__panel-glow"></div>
        <div class="hero__panel-frame" aria-label="Sarthak Bhandari futuristic character">
            <div class="hero__character-frame">
                <div class="hero__character">
<?php
    $heroCharacterSrc = $hasProfileAvatar
        ? $profileAvatarUrl
        : BASE_URL . '/assets/images/hero.png';
?>
<img class="hero-character-img" src="<?= e($heroCharacterSrc) ?>" alt="Sarthak Bhandari futuristic character" />
                    <span class="hero__eye-pulse hero__eye-pulse--right"></span>
                    <span class="hero__eye-ray hero__eye-ray--left"></span>
                    <span class="hero__eye-ray hero__eye-ray--right"></span>
                </div>
            </div>
        </div>
    </div>
</div>
    <div class="hero__scroll-cue" aria-hidden="true">
        <span>scroll</span>
        <div class="scroll-arrow"></div>
    </div>
</section>

<!-- ── Services Section ───────────────────────────────────── -->
<section class="section" id="about" aria-label="Services">
    <div class="container">
        <p class="section-label">Service Portfolio</p>
        <h2 class="section-title">Services</h2>
        
        <div class="grid2">
            <!-- Left Info Panel -->
            <div class="card reveal" style="grid-column: span 2; max-width: 100%;">
                <span class="card-corner card-corner--tl"></span>
                <span class="card-corner card-corner--tr"></span>
                <span class="card-corner card-corner--bl"></span>
                <span class="card-corner card-corner--br"></span>

                <div class="card__header">
                    <span class="card__icon">👤</span>
                    <span class="badge badge--ok">Service Status: Active</span>
                </div>
                <h3 class="card__title">Sarthak Bhandari // Web Builder</h3>
                <p class="card__desc" style="font-size: 0.94rem; line-height: 1.7; margin-bottom: 0.8rem;">
                    I build clean websites, automation-based workflows, AI-assisted digital systems, and visual assets that help ideas become usable online experiences.
                </p>
                <p class="card__desc" style="font-size: 0.94rem; line-height: 1.7;">
                    Every project is designed with clarity, performance, and polished interaction in mind—delivering digital tools that feel reliable and human-centered.
                </p>
                <div class="card__status">
                    <span class="card__status-dot"></span>
                    CREATIVE FLOW ACTIVE
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ── Services Details Section ───────────────────────────── -->
<section class="section" id="services" aria-label="Services Offering">
    <div class="container">
        <p class="section-label"><?= e(section_copy($section_content, 'services', 'label', 'Services')) ?></p>
        <h2 class="section-title"><?= section_title_html($section_content, 'services', 'Service', 'Catalogue') ?></h2>
        <p style="margin-bottom: 2.5rem; max-width: 65ch;"><?= e(section_copy($section_content, 'services', 'description', 'Comprehensive web services including custom websites, automation workflows, and design solutions.')) ?></p>
        <div class="grid3">
            <?php foreach ($services as $service): ?>
            <?php $badgeStyle = (($service['badge_style'] ?? 'cyan') === 'ok') ? 'ok' : 'cyan'; ?>
            <div class="card reveal">
                <span class="card-corner card-corner--tl"></span><span class="card-corner card-corner--tr"></span><span class="card-corner card-corner--bl"></span><span class="card-corner card-corner--br"></span>
                <div class="card__header">
                    <span class="card__icon"><?= e((string) ($service['icon_text'] ?? '◆')) ?></span>
                    <span class="badge badge--<?= e($badgeStyle) ?>"><?= e((string) ($service['badge_text'] ?? 'Service')) ?></span>
                </div>
                <h3 class="card__title"><?= e((string) $service['title']) ?></h3>
                <p class="card__desc"><?= e((string) ($service['description'] ?? '')) ?></p>
                <a href="<?= e((string) ($service['cta_url'] ?? '#contact')) ?>" style="display:inline-block;margin-top:1rem;padding:.6rem 1rem;background:rgba(6,182,212,.15);border:1px solid rgba(6,182,212,.3);border-radius:var(--r1);color:var(--acc2);font-size:.8rem;text-decoration:none;font-family:var(--mono);"><?= e((string) ($service['cta_text'] ?? 'Contact ->')) ?></a>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<!-- ── Work Showcase Section ───────────────────────────── -->
        <section class="section" id="work" aria-label="Work Showcase">
            <div class="container">
                <p class="section-label"><?= e(section_copy($section_content, 'work', 'label', 'Work Showcase')) ?></p>
                <h2 class="section-title"><?= section_title_html($section_content, 'work', 'Featured', 'Work') ?></h2>
                <p style="margin-bottom: 2.5rem; max-width: 65ch;"><?= e(section_copy($section_content, 'work', 'description', 'A selection of recent work that highlights websites, automation tools, and design-driven digital experiences.')) ?></p>

                <div class="grid3">
                    <?php
                        $work_items = (isset($projects) && is_array($projects)) ? $projects : [];
                    ?>

                    <?php if (!empty($work_items)): ?>
                        <?php foreach ($work_items as $project): ?>
                            <?php
                                $title = trim((string)($project['title'] ?? ''));
                                $category = trim((string)($project['category'] ?? 'Project'));
                                $desc = trim((string)($project['description'] ?? ''));
                                $icon_text = trim((string)($project['icon_text'] ?? '📁'));
                                $thumb_fit = in_array(($project['thumbnail_fit'] ?? 'cover'), ['cover', 'contain'], true) ? $project['thumbnail_fit'] : 'cover';
                                $thumb_pos = trim((string)($project['thumbnail_position'] ?? 'center center')) ?: 'center center';

                                $thumb_src = trim((string)(
                                    $project['thumbnail_path']
                                    ?? $project['thumbnail']
                                    ?? $project['image_path']
                                    ?? ''
                                ));

                                if ($thumb_src !== '') {
                                    if (preg_match('#^https?://#i', $thumb_src)) {
                                        // Absolute URLs remain unchanged.
                                    } elseif (str_starts_with($thumb_src, '/')) {
                                        $thumb_src = BASE_URL . $thumb_src;
                                    } else {
                                        $thumb_src = upload_url($thumb_src);
                                    }
                                }

                                $link = trim((string)(
                                    $project['external_url']
                                    ?? $project['live_url']
                                    ?? $project['project_url']
                                    ?? $project['github_url']
                                    ?? ''
                                ));

                                $is_valid_link = $link !== '' && preg_match('/^https?:\/\//i', $link);
                            ?>

                            <div class="card reveal">
                                <span class="card-corner card-corner--tl"></span>
                                <span class="card-corner card-corner--tr"></span>
                                <span class="card-corner card-corner--bl"></span>
                                <span class="card-corner card-corner--br"></span>

                                <?php if ($thumb_src !== ''): ?>
                                    <div style="width: 100%; height: 160px; border: 1px solid rgba(124, 58, 237, 0.2); border-radius: var(--r1); overflow: hidden; margin-bottom: 1rem; background: rgba(255,255,255,0.02);">
                                        <?php if ($is_valid_link): ?>
                                            <a href="<?= e($link) ?>" target="_blank" rel="noopener noreferrer" aria-label="Open <?= e($title !== '' ? $title : 'project') ?>">
                                                <img
                                                    src="<?= e($thumb_src) ?>"
                                                    alt="<?= e($title !== '' ? $title : 'Project thumbnail') ?>"
                                                    loading="lazy"
                                                    style="width:100%; height:100%; object-fit:<?= e($thumb_fit) ?>; object-position:<?= e($thumb_pos) ?>; display:block;"
                                                />
                                            </a>
                                        <?php else: ?>
                                            <img
                                                src="<?= e($thumb_src) ?>"
                                                alt="<?= e($title !== '' ? $title : 'Project thumbnail') ?>"
                                                loading="lazy"
                                                style="width:100%; height:100%; object-fit:<?= e($thumb_fit) ?>; object-position:<?= e($thumb_pos) ?>; display:block;"
                                            />
                                        <?php endif; ?>
                                    </div>
                                <?php else: ?>
                                    <div style="width: 100%; height: 160px; background: linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%); border: 1px solid rgba(124, 58, 237, 0.2); border-radius: var(--r1); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; font-size: 2.5rem;">
                                        <?= e($icon_text !== '' ? $icon_text : '📁') ?>
                                    </div>
                                <?php endif; ?>

                                <div class="card__header">
                                    <span class="card__icon"><?= e($icon_text !== '' ? $icon_text : '📁') ?></span>
                                    <span class="badge badge--ok"><?= e($category !== '' ? $category : 'Project') ?></span>
                                </div>

                                <h3 class="card__title">
                                    <?php if ($is_valid_link): ?>
                                        <a href="<?= e($link) ?>" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">
                                            <?= e($title !== '' ? $title : 'Untitled Project') ?>
                                        </a>
                                    <?php else: ?>
                                        <?= e($title !== '' ? $title : 'Untitled Project') ?>
                                    <?php endif; ?>
                                </h3>

                                <p class="card__desc">
                                    <?= e($desc !== '' ? truncate($desc, 170) : 'A portfolio project entry from the admin panel.') ?>
                                </p>
                            </div>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <div class="card reveal" style="grid-column: span 3;">
                            <span class="card-corner card-corner--tl"></span>
                            <span class="card-corner card-corner--tr"></span>
                            <span class="card-corner card-corner--bl"></span>
                            <span class="card-corner card-corner--br"></span>

                            <div style="width: 100%; height: 160px; background: linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%); border: 1px solid rgba(124, 58, 237, 0.2); border-radius: var(--r1); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; font-size: 2.5rem;">
                                ✨
                            </div>

                            <div class="card__header">
                                <span class="card__icon">📁</span>
                                <span class="badge badge--cyan">Updating</span>
                            </div>

                            <h3 class="card__title">Featured work is being refreshed</h3>
                            <p class="card__desc">
                                This section is controlled through the admin panel. Activate projects from the dashboard to make them visible here.
                            </p>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </section>
<section class="section" id="journey" aria-label="Journey Chronology">
    <div class="container">
        <p class="section-label"><?= e(section_copy($section_content, 'journey', 'label', 'Journey')) ?></p>
        <h2 class="section-title"><?= section_title_html($section_content, 'journey', 'Journey') ?></h2>
        <p style="margin-bottom: 2.5rem; max-width: 65ch;"><?= e(section_copy($section_content, 'journey', 'description', 'A timeline of the journey through tools, design learning, and digital system development.')) ?></p>

        <div class="grid3">
            <?php foreach ($experience as $exp): ?>
            <div class="card reveal">
                <!-- HUD corner brackets -->
                <span class="card-corner card-corner--tl"></span>
                <span class="card-corner card-corner--tr"></span>
                <span class="card-corner card-corner--bl"></span>
                <span class="card-corner card-corner--br"></span>

                <div class="card__header">
                    <span class="card__icon"><?= e($exp['icon'] ?? '🧬') ?></span>
                    <span class="badge badge--cyan"><?= e($exp['period'] ?? 'ARCHIVE') ?></span>
                </div>
                <h3 class="card__title"><?= e($exp['role']) ?></h3>
                <h4 style="font-family: var(--mono); font-size: 0.72rem; color: var(--acc); font-weight: 500; margin-top:-0.2rem;"><?= e($exp['company']) ?></h4>
                <p class="card__desc"><?= e($exp['description']) ?></p>
                
                <div class="card__status">
                    <span class="card__status-dot <?= (($exp['status'] ?? '') === 'Active') ? '' : 'card__status-dot--planned' ?>"></span>
                    LOG STATUS: <?= strtoupper(e($exp['status'] ?? 'ARCHIVED')) ?>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<!-- ── Contact / Social Section ───────────────────────────── -->
<section class="section" id="contact" aria-label="Contact and Social">
    <div class="container">
        <p class="section-label"><?= e(section_copy($section_content, 'contact', 'label', 'Contact / Social')) ?></p>
        <h2 class="section-title"><?= section_title_html($section_content, 'contact', 'Contact', 'Social') ?></h2>
        <p style="margin-bottom: 2.5rem; max-width: 65ch;"><?= e(section_copy($section_content, 'contact', 'description', 'Reach out for web work, automation projects, or creative collaborations through email or social links.')) ?></p>

        <div class="grid2">
            <!-- Info Panel -->
            <div class="card reveal" style="display:flex; flex-direction:column; justify-content:space-between;">
                <!-- HUD corner brackets -->
                <span class="card-corner card-corner--tl"></span>
                <span class="card-corner card-corner--tr"></span>
                <span class="card-corner card-corner--bl"></span>
                <span class="card-corner card-corner--br"></span>

                <div>
                    <div class="card__header" style="margin-bottom: 1.25rem;">
                        <span class="card__icon">📡</span>
                        <span class="badge badge--ok">Status: Ready to Receive</span>
                    </div>
                    <h3 class="card__title" style="margin-bottom: 0.5rem;">Connection Coordinates</h3>
                    <p class="card__desc" style="line-height: 1.7;">
                        Send telemetry payloads directly to my digital comms buffer. My systems will process the transmitted signal and initiate feedback protocols immediately.
                    </p>
                </div>

                <?php
                    $emailAddress = 'contact@sarthakbhandari.com';
                    foreach ($social_links as $link) {
                        if (isset($link['url']) && strpos($link['url'], 'mailto:') === 0) {
                            $emailAddress = substr($link['url'], 7);
                            break;
                        }
                    }
                ?>
                <div style="margin-top: 2rem; display:flex; flex-direction:column; gap:0.75rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem; font-family:var(--mono); font-size:0.78rem; color:var(--t2);">
                        <span style="color:var(--acc2);">◆</span>
                        EMAIL: <a href="mailto:<?= e($emailAddress) ?>" style="color:var(--acc2);"><?= e($emailAddress) ?></a>
                    </div>
                    <div style="display:flex; align-items:center; gap:0.6rem; font-family:var(--mono); font-size:0.78rem; color:var(--t2);">
                        <span style="color:var(--acc2);">◆</span> REGION: Planet Earth // Grid Node
                    </div>
                    <?php if (!empty($social_links)): ?>
                        <div style="display:flex; flex-wrap:wrap; gap:0.75rem; margin-top:0.5rem;">
                            <?php foreach ($contact_social_links as $link):
                                $url = $link['url'] ?? '#';
                                $isMail = strpos($url, 'mailto:') === 0;
                                $a11yLabel = (string) ($link['label'] ?? $link['platform'] ?? 'Link');
                                $platformKey = mb_strtolower(trim((string) ($link['platform'] ?? '')));
                            ?>
                                <a
                                    href="<?= e($url) ?>"
                                    <?= $isMail ? '' : 'target="_blank" rel="noopener noreferrer"' ?>
                                    class="social-node"
                                    title="<?= e($a11yLabel) ?>"
                                    aria-label="<?= e($a11yLabel) ?>"
                                    data-platform="<?= e($platformKey) ?>"
                                ><?= get_social_icon_svg((string) ($link['platform'] ?? '')) ?></a>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>

                <div class="card__status">
                    <span class="card__status-dot"></span>
                    ALL COMMUNICATIONS VECTOR CLEAR
                </div>
            </div>

            <!-- Contact Form Card -->
            <div class="card reveal" style="max-width:100%;">
                <!-- HUD corner brackets -->
                <span class="card-corner card-corner--tl"></span>
                <span class="card-corner card-corner--tr"></span>
                <span class="card-corner card-corner--bl"></span>
                <span class="card-corner card-corner--br"></span>

                <div class="card__header" style="margin-bottom: 1.25rem;">
                    <span class="card__icon">✉️</span>
                    <span class="badge badge--cyan">Secure Input Module</span>
                </div>

                <!-- Session Flash Messages -->
                <?php render_flash(); ?>

                <form action="" method="POST" style="display:flex; flex-direction:column; gap:1.1rem;">
                    <input type="hidden" name="csrf_token" value="<?= csrf_token(); ?>">
                    
                    <div>
                        <label style="display:block; font-family:var(--mono); font-size:0.65rem; color:var(--t2); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:0.4rem;">Operator Designation (Name)</label>
                        <input type="text" name="sender_name" placeholder="Specify moniker..." required style="width:100%; padding:0.75rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,0.22); background:rgba(6,6,18,0.7); color:var(--t1); font-family:var(--body); font-size:0.85rem; outline:none; transition:all 0.3s;" onfocus="this.style.borderColor='var(--acc2)'; this.style.boxShadow='0 0 12px rgba(6,182,212,0.15)'" onblur="this.style.borderColor='rgba(124,58,237,0.22)'; this.style.boxShadow='none'">
                    </div>

                    <div>
                        <label style="display:block; font-family:var(--mono); font-size:0.65rem; color:var(--t2); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:0.4rem;">Channel Target Vector (Email)</label>
                        <input type="email" name="sender_email" placeholder="Specify transmission address..." required style="width:100%; padding:0.75rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,0.22); background:rgba(6,6,18,0.7); color:var(--t1); font-family:var(--body); font-size:0.85rem; outline:none; transition:all 0.3s;" onfocus="this.style.borderColor='var(--acc2)'; this.style.boxShadow='0 0 12px rgba(6,182,212,0.15)'" onblur="this.style.borderColor='rgba(124,58,237,0.22)'; this.style.boxShadow='none'">
                    </div>

                    <div>
                        <label style="display:block; font-family:var(--mono); font-size:0.65rem; color:var(--t2); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:0.4rem;">Payload Transmission (Message)</label>
                        <textarea name="message" placeholder="Compile signal coordinates..." rows="4" required style="width:100%; padding:0.75rem 1rem; border-radius:var(--r1); border:1px solid rgba(124,58,237,0.22); background:rgba(6,6,18,0.7); color:var(--t1); font-family:var(--body); font-size:0.85rem; outline:none; transition:all 0.3s; resize:vertical;" onfocus="this.style.borderColor='var(--acc2)'; this.style.boxShadow='0 0 12px rgba(6,182,212,0.15)'" onblur="this.style.borderColor='rgba(124,58,237,0.22)'; this.style.boxShadow='none'"></textarea>
                    </div>

                    <button type="submit" class="btn btn--primary" style="margin-top:0.5rem; justify-content:center; width:100%;">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="margin-right:0.35rem;">
                            <line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                        Transmit Signal
                    </button>
                </form>
            </div>
        </div>
    </div>
</section>

<!-- ── Tech Stack Marquee ──────────────────────────────────── -->
<div style="overflow:hidden;padding-block:2rem;border-block:1px solid var(--clr-border);background:var(--clr-bg-1);margin-bottom:0;" aria-hidden="true">
    <div style="display:flex;gap:2.5rem;width:max-content;animation:marquee 22s linear infinite;">
        <?php
        $stack = ['PHP 8.3','MySQL','HTML5','CSS3 / Vanilla','JavaScript ES2024','PDO','XAMPP','AI / LLM','REST APIs','Git'];
        // duplicate for seamless loop
        $items = array_merge($stack, $stack);
        foreach ($items as $tech):
        ?>
        <span style="
            font-family:var(--font-mono);font-size:.8rem;letter-spacing:.06em;
            color:var(--clr-text-muted);white-space:nowrap;
            display:flex;align-items:center;gap:.6rem;
        ">
            <span style="color:var(--clr-accent);font-size:.6rem;">◆</span>
            <?= e($tech) ?>
        </span>
        <?php endforeach; ?>
    </div>
</div>

<style>
@keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
}
.cursor-blink {
    display:inline-block;
    color:var(--clr-accent-2);
    animation: blink 1s step-end infinite;
}
</style>

<script>
// Wire up the typed effect to the element on this page
document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('typedRole');
    if (el) el.setAttribute('data-typed', el.dataset.typed || '[]');
});
</script>

<div class="custom-cursor" aria-hidden="true">
    <span class="cursor-dot"></span>
    <span class="cursor-ring"></span>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
