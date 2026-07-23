insert into public.profile
  (full_name, tagline, bio, avatar_url, email, location)
values
  (
    'Sarthak Bhandari',
    'Software · Hardware · Interfaces',
    'Tech enthusiast and vibe coder exploring the space between ideas and execution.',
    '/media/profile/avatar.png',
    'sarthakbhandari172@gmail.com',
    'Nepal'
  )
on conflict do nothing;

insert into public.skills (name, category, proficiency, icon, sort_order) values
  ('PHP & PDO', 'Languages', 85, 'PHP', 1),
  ('MySQL / PostgreSQL', 'Data', 80, 'DB', 2),
  ('JavaScript / TypeScript', 'Languages', 85, 'JS', 3),
  ('CSS & Interface Design', 'Frontend', 90, 'UI', 4),
  ('Next.js', 'Frameworks', 70, 'NX', 5),
  ('Supabase', 'Cloud', 70, 'SB', 6),
  ('Git & GitHub', 'Tools', 80, 'GT', 7),
  ('Hardware Prototyping', 'Hardware', 60, 'HW', 8)
on conflict do nothing;

insert into public.projects
  (title, slug, category, description, tech_stack, thumbnail_url, github_url, live_url, icon_text, featured, sort_order, is_active)
values
  (
    'Portfolio Engine',
    'portfolio-engine',
    'Web Platform',
    'A dynamic portfolio with an authenticated content dashboard, structured data and responsive interface.',
    array['Next.js', 'Supabase', 'TypeScript'],
    '/media/projects/project-1.jpg',
    'https://github.com/sarthakbhandari172-blip',
    '#',
    'WEB',
    true,
    1,
    true
  ),
  (
    'Interface Experiments',
    'interface-experiments',
    'UI Systems',
    'A collection of interface studies focused on motion, hierarchy and clear technical presentation.',
    array['CSS', 'JavaScript', 'Figma'],
    '/media/projects/project-2.jpg',
    'https://github.com/sarthakbhandari172-blip',
    '#',
    'UI',
    true,
    2,
    true
  )
on conflict (slug) do nothing;

insert into public.experience
  (company, role, period, description, icon, status, sort_order)
values
  (
    'Independent Projects',
    'Software and Interface Development',
    '2025 — Present',
    'Building web interfaces, automation experiments and database-backed applications.',
    '01',
    'Current',
    1
  ),
  (
    'Hardware Exploration',
    'Prototyping and Systems Learning',
    '2024 — Present',
    'Exploring electronics, physical computing and the connection between hardware and software.',
    '02',
    'Ongoing',
    2
  )
on conflict do nothing;

insert into public.section_content (section_key, label, title, accent, description) values
  ('contact', 'Contact', 'Start a', 'Conversation', 'Reach out for a project, collaboration or technical discussion.'),
  ('journey', 'Journey', 'Experience', '', 'A concise view of practical work and ongoing technical exploration.'),
  ('services', 'Capabilities', 'What I', 'Build', 'Focused digital work across software, interfaces and automation.'),
  ('work', 'Selected Work', 'Featured', 'Projects', 'Projects that connect ideas, implementation and clear interface design.')
on conflict (section_key) do update set
  label = excluded.label,
  title = excluded.title,
  accent = excluded.accent,
  description = excluded.description;

insert into public.services
  (title, description, icon_text, badge_text, badge_style, cta_text, cta_url, sort_order, is_active)
values
  ('Business Websites', 'Responsive websites structured around clear content, performance and usability.', 'WEB', 'Service', 'ok', 'Discuss project', '#contact', 1, true),
  ('Portfolio Websites', 'Focused portfolio systems for presenting work, experience and technical identity.', 'PF', 'Service', 'cyan', 'Discuss project', '#contact', 2, true),
  ('Landing Pages', 'Single-purpose pages designed around one message and one clear action.', 'LP', 'Service', 'ok', 'Discuss project', '#contact', 3, true),
  ('Website Redesign', 'Interface and structure improvements for existing websites.', 'UI', 'Service', 'cyan', 'Discuss project', '#contact', 4, true),
  ('Workflow Automation', 'Practical automation connecting forms, data and external services.', 'AU', 'Service', 'ok', 'Discuss project', '#contact', 5, true),
  ('AI-Assisted Builds', 'Human-directed development accelerated by modern AI tools.', 'AI', 'Service', 'cyan', 'Discuss project', '#contact', 6, true),
  ('Visual Assets', 'Project thumbnails and supporting graphics for digital products.', 'VA', 'Service', 'ok', 'Discuss project', '#contact', 7, true),
  ('Web Setup', 'Essential deployment, domain and platform setup for a new web presence.', 'WS', 'Service', 'cyan', 'Discuss project', '#contact', 8, true)
on conflict do nothing;

insert into public.settings (setting_key, setting_value) values
  ('ai_enabled', '1'),
  ('maintenance_mode', '0'),
  ('site_tagline', 'Software · Hardware · Interfaces'),
  ('site_title', 'Sarthak Bhandari | Portfolio')
on conflict (setting_key) do update set setting_value = excluded.setting_value;

insert into public.social_links
  (platform, label, url, icon_text, sort_order, is_active, show_in_hero, show_in_contact, show_in_footer)
values
  ('email', 'Email', 'mailto:sarthakbhandari172@gmail.com', 'EM', 1, true, false, true, true),
  ('github', 'GitHub', 'https://github.com/sarthakbhandari172-blip', 'GH', 2, true, true, true, true),
  ('linkedin', 'LinkedIn', 'https://www.linkedin.com/in/sarthak-bhandari-1303b0365/', 'LI', 3, true, false, true, true),
  ('instagram', 'Instagram', 'https://www.instagram.com/_hell.spawn', 'IG', 4, true, false, true, true),
  ('whatsapp', 'WhatsApp', 'https://wa.me/9779769291674', 'WA', 5, true, false, true, true)
on conflict do nothing;

-- After creating your Supabase Auth account, run this once in the SQL Editor:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'YOUR_ADMIN_EMAIL';
