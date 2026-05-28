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
    $stmt = $db->query('SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC');
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Fetch Experience
    $stmt = $db->query('SELECT * FROM experience ORDER BY sort_order ASC, start_date DESC');
    $experience = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    $skills = [];
    $projects = [];
    $experience = [];
    $social_links = [];
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
        ['platform' => 'github', 'label' => 'GitHub Profile', 'url' => 'https://github.com', 'icon_text' => 'GH'],
        ['platform' => 'linkedin', 'label' => 'LinkedIn Profile', 'url' => 'https://linkedin.com', 'icon_text' => 'LI'],
        ['platform' => 'email', 'label' => 'Email Uplink', 'url' => 'mailto:contact@sarthakbhandari.com', 'icon_text' => 'EM'],
    ];
}

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
                    <?php foreach ($social_links as $link):
                        $url = $link['url'] ?? '#';
                        $isMail = strpos($url, 'mailto:') === 0;
                        $label = $link['icon_text'] ?? mb_strtoupper(mb_substr($link['platform'] ?? '', 0, 2));
                    ?>
                        <a href="<?= e($url) ?>" <?= $isMail ? '' : 'target="_blank" rel="noopener noreferrer"' ?> class="social-node" title="<?= e($link['label'] ?? $link['platform']) ?>"><?= e($label) ?></a>
                    <?php endforeach; ?>
                </div>

                <!-- System status -->
                <div class="hero__status" style="margin-top: 2.5rem;">
                    <span class="status-dot"></span>
                    <span>LOBBY LOADED &mdash; SECURE TRANSMISSION ESTABLISHED</span>
                </div>
            </div>

            <!-- Right Panel: Cinematic RPG HUD Dashboard -->
            <div class="hero__right">
                <div class="hero__panel">
                    <div class="hero__panel-bg"></div>
                    <div class="hero__particles" aria-hidden="true"></div>
                    <span class="card-corner card-corner--tl"></span>
                    <span class="card-corner card-corner--tr"></span>
                    <span class="card-corner card-corner--bl"></span>
                    <span class="card-corner card-corner--br"></span>
                    <div class="hero__panel-glow"></div>

                    <div class="hero__panel-frame">
                        <div class="hero__panel-ring hero__panel-ring--outer"></div>
                        <div class="hero__panel-ring hero__panel-ring--inner"></div>
                        <div class="hero__panel-ring hero__panel-ring--accent"></div>

                        <div class="hero__character-frame">
                            <div class="hero__character-backdrop"></div>
                            <div class="hero__character">
                                <svg viewBox="0 0 300 430" class="hero__character-svg" aria-hidden="true">
                                    <defs>
                                        <linearGradient id="heroHelmetGrad" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stop-color="#11131f"/>
                                            <stop offset="100%" stop-color="#090b14"/>
                                        </linearGradient>
                                        <linearGradient id="heroVisorGrad" x1="0" x2="1" y1="0" y2="0">
                                            <stop offset="0%" stop-color="#06b6d4" stop-opacity=".95"/>
                                            <stop offset="100%" stop-color="#7c3aed" stop-opacity=".92"/>
                                        </linearGradient>
                                        <linearGradient id="heroCoreGrad" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stop-color="#06b6d4" stop-opacity="1"/>
                                            <stop offset="45%" stop-color="#7c3aed" stop-opacity=".62"/>
                                            <stop offset="100%" stop-color="#060c1b" stop-opacity="0"/>
                                        </linearGradient>
                                        <linearGradient id="heroArmorGrad" x1="0" x2="1" y1="0" y2="1">
                                            <stop offset="0%" stop-color="#11131f"/>
                                            <stop offset="100%" stop-color="#16182b"/>
                                        </linearGradient>
                                        <linearGradient id="heroArmGrad" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stop-color="#161a2c"/>
                                            <stop offset="100%" stop-color="#0a0c15"/>
                                        </linearGradient>
                                        <linearGradient id="heroLegGrad" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stop-color="#0f1221"/>
                                            <stop offset="100%" stop-color="#07080f"/>
                                        </linearGradient>
                                    </defs>

                                    <g class="character-aura">
                                        <ellipse cx="150" cy="168" rx="120" ry="150" fill="rgba(6,182,212,.14)"/>
                                        <ellipse cx="150" cy="188" rx="90" ry="110" fill="rgba(124,58,237,.12)"/>
                                    </g>

                                    <g class="character-shell">
                                        <path class="helmet-shell" d="M88 32 C80 32 72 48 72 72 C72 110 92 132 118 138 C116 158 112 182 112 208 C112 236 122 250 144 268 C154 278 164 286 150 286 C136 286 146 278 156 268 C178 250 188 236 188 208 C188 182 184 158 182 138 C208 132 228 110 228 72 C228 48 220 32 212 32 C204 32 184 44 150 44 C116 44 96 32 88 32 Z"/>
                                        <path class="helmet-edge" d="M120 42 C126 46 138 46 144 42 C144 46 156 46 162 42 C154 52 140 52 120 42 Z"/>
                                        <path class="visor" d="M108 90 C108 72 152 72 152 90 C176 92 176 116 152 116 C148 116 116 116 108 108 C108 102 108 96 108 90 Z"/>
                                        <path class="visor-line" d="M112 96 L148 96"/>
                                        <path class="neck-shell" d="M118 140 L182 140 C188 176 178 186 150 196 C122 186 112 176 118 140 Z"/>

                                        <path class="shoulder-shell" d="M48 158 C34 178 34 222 70 238 L98 186 C86 172 76 164 66 160 C60 158 54 158 48 158 Z"/>
                                        <path class="shoulder-shell" d="M252 158 C266 178 266 222 230 238 L202 186 C214 172 224 164 234 160 C240 158 246 158 252 158 Z"/>

                                        <path class="arm-shell" d="M72 238 C56 256 56 292 72 310 C88 328 104 342 114 342 L122 342 C112 318 108 292 120 280 C132 268 140 264 150 264 L150 238 C118 246 94 240 72 238 Z"/>
                                        <path class="arm-shell" d="M228 238 C244 256 244 292 228 310 C212 328 196 342 186 342 L178 342 C188 318 192 292 180 280 C168 268 160 264 150 264 L150 238 C182 246 206 240 228 238 Z"/>

                                        <path class="chest-shell" d="M84 158 L216 158 C232 158 244 178 244 196 C244 220 228 234 204 246 C188 256 166 268 150 282 C134 268 112 256 96 246 C72 234 56 220 56 196 C56 178 68 158 84 158 Z"/>
                                        <circle class="core-glow" cx="150" cy="214" r="24"/>
                                        <circle class="core-inner" cx="150" cy="214" r="14"/>
                                        <path class="chest-detail" d="M104 180 L196 180"/>
                                        <path class="chest-detail" d="M132 230 L168 230"/>

                                        <path class="waist-shell" d="M102 278 C112 292 120 316 120 340 L180 340 C180 316 188 292 198 278 C214 278 226 290 226 306 L226 334 C226 344 218 352 208 352 L92 352 C82 352 74 344 74 334 L74 306 C74 290 86 278 102 278 Z"/>
                                        <path class="leg-shell" d="M112 340 L124 412 C124 418 118 424 110 424 C102 424 96 418 96 412 L108 340 Z"/>
                                        <path class="leg-shell" d="M188 340 L176 412 C176 418 182 424 190 424 C198 424 204 418 204 412 L192 340 Z"/>

                                        <path class="armor-detail" d="M98 160 L84 198"/>
                                        <path class="armor-detail" d="M202 160 L216 198"/>
                                        <path class="armor-detail" d="M150 44 L150 88"/>
                                    </g>
                                </svg>
                            </div>

                            <div class="hero__hud-mini">
                                <span class="hud__label">PROC SECURE</span>
                                <span class="hud__value">ARMOR SYSTEM | NOMINAL</span>
                            </div>
                        </div>
                    </div>

                    <div class="hero__panel-meta">
                        <span class="hero__panel-tag">ARMOR GRID</span>
                        <span class="hero__panel-status">IDLE STATE • STABILIZED</span>
                    </div>

                    <!-- RPG stats panel block -->
                    <div class="hero__panel-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-family: var(--mono); position: relative; z-index: 1;">
                        
                        <!-- Panel: Profile State -->
                        <div style="border: 1px solid rgba(34, 212, 126, 0.25); background: linear-gradient(135deg, rgba(34, 212, 126, 0.08) 0%, rgba(34, 212, 126, 0.02) 100%); backdrop-filter: blur(10px); padding: 0.6rem 0.75rem; border-radius: var(--r1); box-shadow: 0 0 15px rgba(34, 212, 126, 0.05), inset 0 1px 1px rgba(34, 212, 126, 0.1);">
                            <span style="display: block; font-size: 0.56rem; color: rgba(34, 212, 126, 0.7); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600;">● System Status</span>
                            <span style="font-size: 0.78rem; color: var(--ok); font-weight: 700; display: flex; align-items: center; gap: 0.4rem; margin-top: 0.25rem;">
                                <span style="width: 6px; height: 6px; background: var(--ok); border-radius: 50%; box-shadow: 0 0 8px var(--ok);"></span>
                                ONLINE
                            </span>
                        </div>

                        <!-- Panel: Operator Load -->
                        <div style="border: 1px solid rgba(6, 182, 212, 0.25); background: linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(6, 182, 212, 0.02) 100%); backdrop-filter: blur(10px); padding: 0.6rem 0.75rem; border-radius: var(--r1); box-shadow: 0 0 15px rgba(6, 182, 212, 0.05), inset 0 1px 1px rgba(6, 182, 212, 0.1);">
                            <span style="display: block; font-size: 0.56rem; color: rgba(6, 182, 212, 0.7); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600;">◆ Operator Load</span>
                            <span style="font-size: 0.78rem; color: var(--acc2); font-weight: 700; display: block; margin-top: 0.25rem;">STABLE (100%)</span>
                        </div>

                        <!-- Panel: Full-width Operator Class -->
                        <div style="border: 1.5px solid rgba(124, 58, 237, 0.3); background: linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(168, 85, 247, 0.06) 100%); backdrop-filter: blur(12px); padding: 0.7rem 0.85rem; border-radius: var(--r1); grid-column: span 2; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 0 20px rgba(124, 58, 237, 0.08), inset 0 1px 2px rgba(124, 58, 237, 0.15);">
                            <div>
                                <span style="display: block; font-size: 0.56rem; color: rgba(124, 58, 237, 0.75); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600;">⬡ Creator Class</span>
                                <span style="font-size: 0.8rem; color: var(--t1); font-weight: 700; display: block; margin-top: 0.2rem;">WEB BUILDER</span>
                            </div>
                            <span style="font-size: 0.65rem; color: #fff; background: linear-gradient(135deg, rgba(124, 58, 237, 0.4) 0%, rgba(168, 85, 247, 0.3) 100%); border: 1px solid rgba(124, 58, 237, 0.4); padding: 0.2rem 0.45rem; border-radius: 3px; font-weight: 700; box-shadow: 0 0 12px rgba(124, 58, 237, 0.2);">LVLØ1</span>
                        </div>

                    </div>

                </div>
            </div>

        </div>
    </div>

    <!-- Scroll cue -->
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
        <p class="section-label">Services</p>
        <h2 class="section-title">Service <span class="accent">Catalogue</span></h2>
        <p style="margin-bottom: 2.5rem; max-width: 65ch;">
            Comprehensive web services including custom websites, automation workflows, and design solutions. Each project is delivered with professional quality and attention to detail.
        </p>

        <div class="grid3">
            <!-- Business Websites -->
            <div class="card reveal">
                <span class="card-corner card-corner--tl"></span>
                <span class="card-corner card-corner--tr"></span>
                <span class="card-corner card-corner--bl"></span>
                <span class="card-corner card-corner--br"></span>

                <div class="card__header">
                    <span class="card__icon">🏢</span>
                    <span class="badge badge--ok">Service</span>
                </div>
                <h3 class="card__title">Business Websites</h3>
                <p class="card__desc">Professional, high-performing websites designed to establish your business online. Includes responsive design, fast loading, and clear calls-to-action.</p>
                <a href="#contact" style="display: inline-block; margin-top: 1rem; padding: 0.6rem 1rem; background: rgba(124, 58, 237, 0.15); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: var(--r1); color: var(--acc2); font-size: 0.8rem; text-decoration: none; transition: all 0.3s; font-family: var(--mono);">Contact →</a>
            </div>

            <!-- Portfolio Websites -->
            <div class="card reveal">
                <span class="card-corner card-corner--tl"></span>
                <span class="card-corner card-corner--tr"></span>
                <span class="card-corner card-corner--bl"></span>
                <span class="card-corner card-corner--br"></span>

                <div class="card__header">
                    <span class="card__icon">🎯</span>
                    <span class="badge badge--cyan">Service</span>
                </div>
                <h3 class="card__title">Portfolio Websites</h3>
                <p class="card__desc">Showcase your work with a custom portfolio site. Clean layout, project galleries, and professional presentation to attract clients and opportunities.</p>
                <a href="#contact" style="display: inline-block; margin-top: 1rem; padding: 0.6rem 1rem; background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: var(--r1); color: var(--acc2); font-size: 0.8rem; text-decoration: none; transition: all 0.3s; font-family: var(--mono);">Contact →</a>
            </div>

            <!-- Landing Pages -->
            <div class="card reveal">
                <span class="card-corner card-corner--tl"></span>
                <span class="card-corner card-corner--tr"></span>
                <span class="card-corner card-corner--bl"></span>
                <span class="card-corner card-corner--br"></span>

                <div class="card__header">
                    <span class="card__icon">🚀</span>
                    <span class="badge badge--ok">Service</span>
                </div>
                <h3 class="card__title">Landing Pages</h3>
                <p class="card__desc">Conversion-focused landing pages designed to drive action. Optimized headlines, compelling messaging, and strategic layout to maximize engagement.</p>
                <a href="#contact" style="display: inline-block; margin-top: 1rem; padding: 0.6rem 1rem; background: rgba(124, 58, 237, 0.15); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: var(--r1); color: var(--acc2); font-size: 0.8rem; text-decoration: none; transition: all 0.3s; font-family: var(--mono);">Contact →</a>
            </div>

            <!-- Website Redesign -->
            <div class="card reveal">
                <span class="card-corner card-corner--tl"></span>
                <span class="card-corner card-corner--tr"></span>
                <span class="card-corner card-corner--bl"></span>
                <span class="card-corner card-corner--br"></span>

                <div class="card__header">
                    <span class="card__icon">🎨</span>
                    <span class="badge badge--cyan">Service</span>
                </div>
                <h3 class="card__title">Website Redesign</h3>
                <p class="card__desc">Refresh your existing website with modern design and improved functionality. Preserve valuable content while upgrading the user experience and visual appeal.</p>
                <a href="#contact" style="display: inline-block; margin-top: 1rem; padding: 0.6rem 1rem; background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: var(--r1); color: var(--acc2); font-size: 0.8rem; text-decoration: none; transition: all 0.3s; font-family: var(--mono);">Contact →</a>
            </div>

            <!-- n8n Automation Workflows -->
            <div class="card reveal">
                <span class="card-corner card-corner--tl"></span>
                <span class="card-corner card-corner--tr"></span>
                <span class="card-corner card-corner--bl"></span>
                <span class="card-corner card-corner--br"></span>

                <div class="card__header">
                    <span class="card__icon">⚙️</span>
                    <span class="badge badge--ok">Service</span>
                </div>
                <h3 class="card__title">n8n Automation</h3>
                <p class="card__desc">Custom workflow automation using n8n to connect your tools and systems. Save time on repetitive tasks and streamline business processes efficiently.</p>
                <a href="#contact" style="display: inline-block; margin-top: 1rem; padding: 0.6rem 1rem; background: rgba(124, 58, 237, 0.15); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: var(--r1); color: var(--acc2); font-size: 0.8rem; text-decoration: none; transition: all 0.3s; font-family: var(--mono);">Contact →</a>
            </div>

            <!-- AI-Assisted Web Builds -->
            <div class="card reveal">
                <span class="card-corner card-corner--tl"></span>
                <span class="card-corner card-corner--tr"></span>
                <span class="card-corner card-corner--bl"></span>
                <span class="card-corner card-corner--br"></span>

                <div class="card__header">
                    <span class="card__icon">✨</span>
                    <span class="badge badge--cyan">Service</span>
                </div>
                <h3 class="card__title">AI-Assisted Builds</h3>
                <p class="card__desc">Leverage AI tools to accelerate website development and content creation. Combining human direction with AI efficiency for faster, intelligent project delivery.</p>
                <a href="#contact" style="display: inline-block; margin-top: 1rem; padding: 0.6rem 1rem; background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: var(--r1); color: var(--acc2); font-size: 0.8rem; text-decoration: none; transition: all 0.3s; font-family: var(--mono);">Contact →</a>
            </div>

            <!-- Thumbnail Design -->
            <div class="card reveal">
                <span class="card-corner card-corner--tl"></span>
                <span class="card-corner card-corner--tr"></span>
                <span class="card-corner card-corner--bl"></span>
                <span class="card-corner card-corner--br"></span>

                <div class="card__header">
                    <span class="card__icon">🖼️</span>
                    <span class="badge badge--ok">Service</span>
                </div>
                <h3 class="card__title">Thumbnail Design</h3>
                <p class="card__desc">Custom-designed thumbnails and graphics for your web projects, social media, and marketing. Professionally crafted visuals that capture attention and convey your message.</p>
                <a href="#contact" style="display: inline-block; margin-top: 1rem; padding: 0.6rem 1rem; background: rgba(124, 58, 237, 0.15); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: var(--r1); color: var(--acc2); font-size: 0.8rem; text-decoration: none; transition: all 0.3s; font-family: var(--mono);">Contact →</a>
            </div>

            <!-- Basic Brand/Web Presence Setup -->
            <div class="card reveal">
                <span class="card-corner card-corner--tl"></span>
                <span class="card-corner card-corner--tr"></span>
                <span class="card-corner card-corner--bl"></span>
                <span class="card-corner card-corner--br"></span>

                <div class="card__header">
                    <span class="card__icon">🌐</span>
                    <span class="badge badge--cyan">Service</span>
                </div>
                <h3 class="card__title">Brand/Web Setup</h3>
                <p class="card__desc">Essential web presence foundation for new businesses. Includes basic website, essential pages, and setup guidance to establish your online footprint.</p>
                <a href="#contact" style="display: inline-block; margin-top: 1rem; padding: 0.6rem 1rem; background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: var(--r1); color: var(--acc2); font-size: 0.8rem; text-decoration: none; transition: all 0.3s; font-family: var(--mono);">Contact →</a>
            </div>
        </div>
    </div>
</section>

<!-- ── Work Showcase Section ───────────────────────────── -->
<section class="section" id="work" aria-label="Work Showcase">
    <div class="container">
        <p class="section-label">Work Showcase</p>
        <h2 class="section-title">Featured <span class="accent">Work</span></h2>
        <p style="margin-bottom: 2.5rem; max-width: 65ch;">
            A selection of recent work that highlights websites, automation tools, and design-driven digital experiences.
        </p>

        <div class="grid3">
            <?php
            $work_items = $projects ?? [];
            $has_db_projects = !empty($work_items) && is_array($work_items);
            ?>

            <?php if ($has_db_projects): ?>
                <?php foreach ($work_items as $project):
                    $title = (string) ($project['title'] ?? '');
                    $desc  = (string) ($project['description'] ?? '');
                    $tech  = trim((string) ($project['tech_stack'] ?? ''));

                    // Prefer live URL; fall back to GitHub URL; otherwise no-op.
                    $link = trim((string) ($project['live_url'] ?? ''));
                    if ($link === '') $link = trim((string) ($project['project_url'] ?? ''));
                    if ($link === '') $link = trim((string) ($project['github_url'] ?? ''));
                    $is_valid_link = $link !== '' && preg_match('/^https?:\\/\\//i', $link) === 1;
                    $href = $is_valid_link ? $link : '#';

                    // Category / type isn't a column yet; use featured flag as a safe public label.
                    $is_featured = !empty($project['featured']);
                    $badge_label = $is_featured ? 'Featured' : 'Project';
                    $badge_class = $is_featured ? 'badge badge--ok' : 'badge badge--cyan';

                    // Thumbnail (stored as path/filename; assume it lives under uploads/projects/ unless it already includes a subpath).
                    $thumb_raw = trim((string) ($project['thumbnail'] ?? ''));
                    $thumb_src = '';
                    if ($thumb_raw !== '') {
                        $thumb_rel = (strpos($thumb_raw, '/') !== false) ? $thumb_raw : ('projects/' . $thumb_raw);
                        $thumb_src = upload_url($thumb_rel);
                    }
                ?>
                <div class="card reveal">
                    <span class="card-corner card-corner--tl"></span>
                    <span class="card-corner card-corner--tr"></span>
                    <span class="card-corner card-corner--bl"></span>
                    <span class="card-corner card-corner--br"></span>

                    <?php if ($thumb_src !== ''): ?>
                        <div style="width: 100%; height: 160px; border: 1px solid rgba(124, 58, 237, 0.2); border-radius: var(--r1); overflow:hidden; margin-bottom: 1rem; background: rgba(255,255,255,0.02);">
                            <img
                                src="<?= e($thumb_src) ?>"
                                alt="<?= e($title) ?>"
                                loading="lazy"
                                style="width:100%; height:100%; object-fit:cover; display:block;"
                            />
                        </div>
                    <?php else: ?>
                        <div style="width: 100%; height: 160px; background: linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%); border: 1px solid rgba(124, 58, 237, 0.2); border-radius: var(--r1); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; font-size: 2.5rem;">
                            📁
                        </div>
                    <?php endif; ?>

                    <div class="card__header">
                        <span class="card__icon">💼</span>
                        <span class="<?= e($badge_class) ?>"><?= e($badge_label) ?></span>
                    </div>
                    <h3 class="card__title"><?= e($title !== '' ? $title : 'Untitled Project') ?></h3>
                    <p class="card__desc"><?= e($desc !== '' ? truncate($desc, 170) : 'A portfolio project entry from the database.') ?></p>

                    <?php if ($tech !== ''): ?>
                        <p style="margin-top:0.75rem; color:var(--t2); font-family:var(--mono); font-size:0.72rem; letter-spacing:0.04em;">
                            <?= e($tech) ?>
                        </p>
                    <?php endif; ?>

                    <?php if ($href !== '#'): ?>
                        <a href="<?= e($href) ?>" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 1rem; padding: 0.6rem 1rem; background: rgba(124, 58, 237, 0.15); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: var(--r1); color: var(--acc2); font-size: 0.8rem; text-decoration: none; transition: all 0.3s; font-family: var(--mono);">View Work →</a>
                    <?php else: ?>
                        <span style="display: inline-block; margin-top: 1rem; padding: 0.6rem 1rem; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: var(--r1); color: var(--t2); font-size: 0.8rem; font-family: var(--mono);">Link unavailable</span>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
            <?php else: ?>
                <!-- Fallback cards (keeps section polished if projects table is empty) -->
                <div class="card reveal">
                    <span class="card-corner card-corner--tl"></span>
                    <span class="card-corner card-corner--tr"></span>
                    <span class="card-corner card-corner--bl"></span>
                    <span class="card-corner card-corner--br"></span>

                    <div style="width: 100%; height: 160px; background: linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%); border: 1px solid rgba(124, 58, 237, 0.2); border-radius: var(--r1); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; font-size: 2.5rem;">
                        🌐
                    </div>

                    <div class="card__header">
                        <span class="card__icon">💻</span>
                        <span class="badge badge--ok">Websites</span>
                    </div>
                    <h3 class="card__title">Websites I Built</h3>
                    <p class="card__desc">Professional websites built for brands, agencies, and founders. Focused on speed, clarity, and polished presentation.</p>
                    <a href="#contact" style="display: inline-block; margin-top: 1rem; padding: 0.6rem 1rem; background: rgba(124, 58, 237, 0.15); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: var(--r1); color: var(--acc2); font-size: 0.8rem; text-decoration: none; transition: all 0.3s; font-family: var(--mono);">Request Work →</a>
                </div>

                <div class="card reveal">
                    <span class="card-corner card-corner--tl"></span>
                    <span class="card-corner card-corner--tr"></span>
                    <span class="card-corner card-corner--bl"></span>
                    <span class="card-corner card-corner--br"></span>

                    <div style="width: 100%; height: 160px; background: linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: var(--r1); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; font-size: 2.5rem;">
                        🔄
                    </div>

                    <div class="card__header">
                        <span class="card__icon">⚙️</span>
                        <span class="badge badge--cyan">Automation</span>
                    </div>
                    <h3 class="card__title">Automation Builds</h3>
                    <p class="card__desc">Workflow automation systems that connect tools, data, and operations to reduce manual effort and improve reliability.</p>
                    <a href="#contact" style="display: inline-block; margin-top: 1rem; padding: 0.6rem 1rem; background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: var(--r1); color: var(--acc2); font-size: 0.8rem; text-decoration: none; transition: all 0.3s; font-family: var(--mono);">Request Work →</a>
                </div>

                <div class="card reveal">
                    <span class="card-corner card-corner--tl"></span>
                    <span class="card-corner card-corner--tr"></span>
                    <span class="card-corner card-corner--bl"></span>
                    <span class="card-corner card-corner--br"></span>

                    <div style="width: 100%; height: 160px; background: linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(124, 58, 237, 0.08) 100%); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: var(--r1); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; font-size: 2.5rem;">
                        🎨
                    </div>

                    <div class="card__header">
                        <span class="card__icon">🖼️</span>
                        <span class="badge badge--ok">Design</span>
                    </div>
                    <h3 class="card__title">Design & Thumbnails</h3>
                    <p class="card__desc">Graphic thumbnails and visual assets crafted for marketing, media, and digital campaigns. Clean, on-brand, and conversion-ready.</p>
                    <a href="#contact" style="display: inline-block; margin-top: 1rem; padding: 0.6rem 1rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: var(--r1); color: var(--acc2); font-size: 0.8rem; text-decoration: none; transition: all 0.3s; font-family: var(--mono);">Request Work →</a>
                </div>
            <?php endif; ?>
        </div>
    </div>
</section>

<!-- ── Journey Timeline Section ───────────────────────────── -->
<section class="section" id="journey" aria-label="Journey Chronology">
    <div class="container">
        <p class="section-label">Journey</p>
        <h2 class="section-title">Journey</h2>
        <p style="margin-bottom: 2.5rem; max-width: 65ch;">
            A timeline of the journey through tools, design learning, and digital system development.
        </p>

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
        <p class="section-label">Contact / Social</p>
        <h2 class="section-title">Contact <span class="accent">Social</span></h2>
        <p style="margin-bottom: 2.5rem; max-width: 65ch;">
            Reach out for web work, automation projects, or creative collaborations through email or social links.
        </p>

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
                            <?php foreach ($social_links as $link):
                                $url = $link['url'] ?? '#';
                                $isMail = strpos($url, 'mailto:') === 0;
                                $label = $link['icon_text'] ?? mb_strtoupper(mb_substr($link['platform'] ?? '', 0, 2));
                            ?>
                                <a href="<?= e($url) ?>" <?= $isMail ? '' : 'target="_blank" rel="noopener noreferrer"' ?> class="social-node" title="<?= e($link['label'] ?? $link['platform']) ?>"><?= e($label) ?></a>
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

