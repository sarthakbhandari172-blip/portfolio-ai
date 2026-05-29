-- ============================================================
--  Portfolio AI — Database Schema
--  Author : Sarthak Bhandari
--  Created: 2026-05-09
-- ============================================================

CREATE DATABASE IF NOT EXISTS portfolio_ai
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE portfolio_ai;

-- ── Admin / User ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    username      VARCHAR(60)     NOT NULL UNIQUE,
    email         VARCHAR(120)    NOT NULL UNIQUE,
    password_hash VARCHAR(255)    NOT NULL,
    role          ENUM('admin','editor') NOT NULL DEFAULT 'admin',
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ── Profile / About ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    full_name     VARCHAR(120)    NOT NULL,
    tagline       VARCHAR(255)    DEFAULT NULL,
    bio           TEXT            DEFAULT NULL,
    avatar        VARCHAR(255)    DEFAULT NULL,
    email         VARCHAR(120)    DEFAULT NULL,
    phone         VARCHAR(30)     DEFAULT NULL,
    location      VARCHAR(120)    DEFAULT NULL,
    resume_url    VARCHAR(255)    DEFAULT NULL,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ── Skills ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skills (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name          VARCHAR(80)     NOT NULL,
    category      VARCHAR(80)     DEFAULT NULL,
    proficiency   TINYINT UNSIGNED NOT NULL DEFAULT 50 COMMENT '0-100',
    icon          VARCHAR(120)    DEFAULT NULL,
    sort_order    SMALLINT        NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ── Projects ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    title         VARCHAR(150)    NOT NULL,
    slug          VARCHAR(160)    NOT NULL UNIQUE,
    description   TEXT            DEFAULT NULL,
    tech_stack    VARCHAR(255)    DEFAULT NULL  COMMENT 'comma-separated',
    thumbnail     VARCHAR(255)    DEFAULT NULL,
    live_url      VARCHAR(255)    DEFAULT NULL,
    github_url    VARCHAR(255)    DEFAULT NULL,
    featured      TINYINT(1)      NOT NULL DEFAULT 0,
    sort_order    SMALLINT        NOT NULL DEFAULT 0,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ── Experience ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    company       VARCHAR(120)    NOT NULL,
    role          VARCHAR(120)    NOT NULL,
    start_date    DATE            NOT NULL,
    end_date      DATE            DEFAULT NULL COMMENT 'NULL = present',
    description   TEXT            DEFAULT NULL,
    sort_order    SMALLINT        NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ── Contact messages ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    sender_name   VARCHAR(120)    NOT NULL,
    sender_email  VARCHAR(120)    NOT NULL,
    subject       VARCHAR(200)    DEFAULT NULL,
    message       TEXT            NOT NULL,
    is_read       TINYINT(1)      NOT NULL DEFAULT 0,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ── Site settings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
    setting_key   VARCHAR(80)     NOT NULL,
    setting_value TEXT            DEFAULT NULL,
    PRIMARY KEY (setting_key)
) ENGINE=InnoDB;

-- ── Social / Contact Links ──────────────────────────────────
CREATE TABLE IF NOT EXISTS social_links (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    platform      VARCHAR(100)    NOT NULL,
    label         VARCHAR(100)    NOT NULL,
    url           VARCHAR(500)    NOT NULL,
    icon_text     VARCHAR(20)     NOT NULL,
    sort_order    INT             NOT NULL DEFAULT 0,
    is_active     TINYINT(1)      NOT NULL DEFAULT 1,
    show_in_hero   TINYINT(1)      NOT NULL DEFAULT 1,
    show_in_contact TINYINT(1)     NOT NULL DEFAULT 1,
    show_in_footer TINYINT(1)      NOT NULL DEFAULT 1,
    created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Add visibility controls (safe on updated MySQL versions)
ALTER TABLE social_links
    ADD COLUMN IF NOT EXISTS show_in_hero TINYINT(1) NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS show_in_contact TINYINT(1) NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS show_in_footer TINYINT(1) NOT NULL DEFAULT 1;

INSERT INTO social_links (platform, label, url, icon_text, sort_order, is_active)
SELECT 'email', 'Email', 'mailto:sarthakbhandari172@gmail.com', 'EM', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM social_links WHERE platform = 'email');

INSERT INTO social_links (platform, label, url, icon_text, sort_order, is_active)
SELECT 'github', 'GitHub', '#', 'GH', 2, 1
WHERE NOT EXISTS (SELECT 1 FROM social_links WHERE platform = 'github');

INSERT INTO social_links (platform, label, url, icon_text, sort_order, is_active)
SELECT 'linkedin', 'LinkedIn', '#', 'LI', 3, 1
WHERE NOT EXISTS (SELECT 1 FROM social_links WHERE platform = 'linkedin');

INSERT INTO social_links (platform, label, url, icon_text, sort_order, is_active)
SELECT 'instagram', 'Instagram', '#', 'IG', 4, 1
WHERE NOT EXISTS (SELECT 1 FROM social_links WHERE platform = 'instagram');

INSERT INTO social_links (platform, label, url, icon_text, sort_order, is_active)
SELECT 'facebook', 'Facebook', '#', 'FB', 5, 0
WHERE NOT EXISTS (SELECT 1 FROM social_links WHERE platform = 'facebook');

-- Defaults / updates for visibility flags
UPDATE social_links SET show_in_hero = 1, show_in_contact = 1, show_in_footer = 1
WHERE platform IN ('email', 'github', 'instagram');

UPDATE social_links SET show_in_hero = 0, show_in_contact = 1, show_in_footer = 1
WHERE platform = 'linkedin';

-- Keep facebook inactive unless already active; visibility defaults stay on.

-- Default settings seed
INSERT INTO settings (setting_key, setting_value) VALUES
    ('site_title',       'Sarthak Bhandari | Portfolio AI'),
    ('site_tagline',     'Developer · Designer · AI Enthusiast'),
    ('maintenance_mode', '0'),
    ('ai_enabled',       '1');
