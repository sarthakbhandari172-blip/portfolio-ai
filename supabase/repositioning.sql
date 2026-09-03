-- Repositioning: developer-portfolio -> design-first portfolio
-- Run in Supabase Dashboard > SQL Editor (runs as postgres, bypasses RLS).
-- Step 1 makes timestamped backups of every table it touches, so this is reversible.

-- ============ 1. BACKUPS ============
create table if not exists backup_20260903_profile        as select * from public.profile;
create table if not exists backup_20260903_skills         as select * from public.skills;
create table if not exists backup_20260903_experience     as select * from public.experience;
create table if not exists backup_20260903_services       as select * from public.services;
create table if not exists backup_20260903_section_content as select * from public.section_content;
create table if not exists backup_20260903_settings       as select * from public.settings;
create table if not exists backup_20260903_projects       as select * from public.projects;

-- ============ 2. PROFILE / HERO ============
update public.profile set
  tagline            = 'Design · Content · Code',
  bio                = 'Graphic and digital designer with a developer''s toolkit — creating brand, social and campaign visuals, then building them for the web.',
  location           = 'Kathmandu, Nepal',
  hero_label         = 'Sarthak Bhandari — Portfolio',
  hero_accent_title  = 'Graphic & Digital Designer',
  hero_roles         = array['Graphic & Digital Design', 'Brand & Social Assets', 'Design to Code, End to End'],
  hero_primary_cta_text   = 'View Work',
  hero_primary_cta_url    = '#work',
  hero_secondary_cta_text = 'What I Do',
  hero_secondary_cta_url  = '#services',
  status_text        = 'Open to junior roles & freelance';

-- ============ 3. SKILLS (design-first) ============
delete from public.skills;
insert into public.skills (name, category, proficiency, icon, sort_order) values
  ('Adobe Photoshop',              'Design', 75, 'PS', 1),
  ('Adobe Illustrator',            'Design', 70, 'AI', 2),
  ('Adobe Lightroom',              'Design', 70, 'LR', 3),
  ('Figma',                        'Design', 70, 'FG', 4),
  ('Canva',                        'Design', 90, 'CN', 5),
  ('Premiere Pro & After Effects', 'Motion', 60, 'MO', 6),
  ('CSS & Interface Design',       'Code',   90, 'UI', 7),
  ('JavaScript / TypeScript',      'Code',   85, 'JS', 8),
  ('Next.js & Supabase',           'Code',   70, 'NX', 9),
  ('Git & GitHub',                 'Code',   80, 'GT', 10);

-- ============ 4. EXPERIENCE (design work leads) ============
delete from public.experience;
insert into public.experience (company, role, period, description, icon, status, sort_order) values
  ('Freelance & self-initiated briefs', 'Independent Visual Designer', '2025 — Present',
   'Brand identity concepts, social media and campaign-style assets, presentation decks, photo retouching and print-ready artwork — delivered organised and on time.',
   '01', 'Current', 1),
  ('Independent Projects', 'Software & Interface Development', '2025 — Present',
   'Building web interfaces and database-backed applications, end to end.',
   '02', 'Current', 2),
  ('Hardware Exploration', 'Prototyping & Systems Learning', '2024 — Present',
   'Electronics and physical computing — the connection between hardware and software.',
   '03', 'Ongoing', 3);

-- ============ 5. SERVICES (design-first) ============
delete from public.services;
insert into public.services (title, description, icon_text, badge_text, badge_style, cta_text, cta_url, sort_order, is_active) values
  ('Brand & Social Graphics',      'Logo concepts, identity elements and social assets that stay consistent across every format.', 'BR', 'Service', 'ok',   'Discuss project', '#contact', 1, true),
  ('Campaign & Poster Design',     'Posters, banners and campaign visuals for events, causes and products — digital or print-ready.', 'CP', 'Service', 'cyan', 'Discuss project', '#contact', 2, true),
  ('Photo Editing & Retouching',   'Colour, composition and clean-up in Photoshop and Lightroom.', 'RT', 'Service', 'ok',   'Discuss project', '#contact', 3, true),
  ('Presentation Design',          'Clear, on-brand decks that make information easy to follow.', 'PD', 'Service', 'cyan', 'Discuss project', '#contact', 4, true),
  ('Landing Pages',                'Single-purpose pages designed around one message and one clear action.', 'LP', 'Service', 'ok',   'Discuss project', '#contact', 5, true),
  ('Business & Portfolio Websites','Responsive sites structured around clear content and usability — designed and built.', 'WB', 'Service', 'cyan', 'Discuss project', '#contact', 6, true),
  ('Website Redesign',             'Interface and structure improvements for existing websites.', 'UI', 'Service', 'ok',   'Discuss project', '#contact', 7, true),
  ('AI-Assisted Workflows',        'Ideation with Midjourney, Firefly and Canva AI — always selected, composited and finished by hand.', 'AW', 'Service', 'cyan', 'Discuss project', '#contact', 8, true);

-- ============ 6. SECTION COPY ============
insert into public.section_content (section_key, label, title, accent, description) values
  ('about',    'About',         'About',      'Sarthak',       'Graphic and digital designer from Kathmandu who combines visual craft with the ability to build for the web.'),
  ('skills',   'Toolkit',       'Tools &',    'Skills',        'Design tools first, backed by real front-end development.'),
  ('work',     'Selected Work', 'Featured',   'Projects',      'Selected projects across design and code — new visual work being added.'),
  ('services', 'What I Do',     'What I',     'Do',            'Design and digital services for brands, causes and small teams.'),
  ('journey',  'Journey',       'Experience', '',              'Freelance design work, independent builds and ongoing learning.'),
  ('contact',  'Contact',       'Start a',    'Conversation',  'Reach out about a role, a project or a collaboration.')
on conflict (section_key) do update set
  label = excluded.label, title = excluded.title, accent = excluded.accent, description = excluded.description;

-- ============ 7. SETTINGS ============
insert into public.settings (setting_key, setting_value) values
  ('about_approach',    'Explore → prototype → refine'),
  ('about_mode',        'Learning by shipping real projects'),
  ('about_tools',       'Figma, Adobe Creative Cloud and the modern web'),
  ('hero_class',        'Graphic & digital designer'),
  ('hero_region',       'Kathmandu, Nepal'),
  ('hero_system_state', 'Open to junior roles & freelance'),
  ('footer_signature',  'Built across design, code and curiosity')
on conflict (setting_key) do update set setting_value = excluded.setting_value;

-- ============ 8. PROJECTS (adds 4 concept design projects; keeps + reframes the dev ones) ============
update public.projects set
  category    = 'Design + Build',
  description = 'Designed and built end to end — visual system, responsive interface and an authenticated content dashboard.',
  tech_stack  = array['Figma', 'Next.js', 'Supabase', 'TypeScript'],
  sort_order  = 5
where slug = 'portfolio-engine';

update public.projects set sort_order = 6 where slug = 'interface-experiments';

insert into public.projects
  (title, slug, category, description, tech_stack, thumbnail_url, icon_text, featured, sort_order, is_active)
values
  ('LEKH Trail Gear', 'lekh-trail-gear', 'Brand Identity — Concept',
   'Self-initiated brand for a fictional Kathmandu trekking gear label: logomark, palette, type system, social set and merch print.',
   array['Illustrator', 'Figma', 'Photoshop'], '/media/projects/lekh-brand.png', 'BR', true, 1, true),
  ('Saath — साथ', 'saath-campaign', 'Awareness Campaign — Concept',
   'Dementia-awareness concept campaign: two poster directions and a social adaptation, designed to accessible contrast standards.',
   array['Figma', 'Photoshop'], '/media/projects/saath-campaign.png', 'CP', true, 2, true),
  ('Lekh App', 'lekh-app', 'UI Concept',
   'Trail-companion app for the LEKH brand: wireframes to hi-fi screens — home, trail detail, packing checklist.',
   array['Figma'], '/media/projects/lekh-app.png', 'UI', true, 3, true),
  ('PAILA Quarterly', 'paila-editorial', 'Editorial — Concept',
   'Cover and feature spread for a fictional Kathmandu design magazine: hand-painted street signboards vs the vinyl-print flood.',
   array['Figma', 'InDesign'], '/media/projects/paila-editorial.png', 'ED', true, 4, true)
on conflict (slug) do update set
  title = excluded.title, category = excluded.category, description = excluded.description,
  tech_stack = excluded.tech_stack, thumbnail_url = excluded.thumbnail_url,
  icon_text = excluded.icon_text, featured = excluded.featured,
  sort_order = excluded.sort_order, is_active = excluded.is_active;
