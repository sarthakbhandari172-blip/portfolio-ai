alter table public.profile
  add column if not exists hero_label text,
  add column if not exists hero_display_title text,
  add column if not exists hero_accent_title text,
  add column if not exists hero_roles text[] not null default '{}',
  add column if not exists hero_primary_cta_text text,
  add column if not exists hero_primary_cta_url text,
  add column if not exists hero_secondary_cta_text text,
  add column if not exists hero_secondary_cta_url text,
  add column if not exists status_text text;

alter table public.skills
  add column if not exists description text,
  add column if not exists link_url text,
  add column if not exists is_active boolean not null default true;

alter table public.experience
  add column if not exists link_url text,
  add column if not exists is_active boolean not null default true;

alter table public.services
  add column if not exists thumbnail_url text,
  add column if not exists thumbnail_fit text not null default 'cover',
  add column if not exists thumbnail_position text not null default 'center center';

alter table public.services
  drop constraint if exists services_thumbnail_fit_check;

alter table public.services
  add constraint services_thumbnail_fit_check
  check (thumbnail_fit in ('cover', 'contain'));

alter table public.section_content
  add column if not exists cta_text text,
  add column if not exists cta_url text;

update public.profile
set
  hero_label = coalesce(hero_label, 'System Online — Digital Portfolio'),
  hero_display_title = coalesce(hero_display_title, full_name),
  hero_accent_title = coalesce(hero_accent_title, 'Digital Portfolio'),
  hero_roles = case
    when cardinality(hero_roles) = 0
      then array['Web Builder', 'Automation Explorer', 'Visual Design Learner']
    else hero_roles
  end,
  hero_primary_cta_text = coalesce(hero_primary_cta_text, 'View Work'),
  hero_primary_cta_url = coalesce(hero_primary_cta_url, '#work'),
  hero_secondary_cta_text = coalesce(hero_secondary_cta_text, 'Enter Portal'),
  hero_secondary_cta_url = coalesce(hero_secondary_cta_url, '#services'),
  status_text = coalesce(status_text, 'Available for selected projects');

insert into public.section_content
  (section_key, label, title, accent, description)
values
  (
    'about',
    'Identity File',
    'About',
    'Sarthak',
    'A multidisciplinary builder exploring visual design, software, automation and the interfaces connecting them.'
  ),
  (
    'skills',
    'System Modules',
    'Skills',
    'Inventory',
    'Tools and technologies currently used across design, development and experimentation.'
  )
on conflict (section_key) do nothing;

insert into public.settings (setting_key, setting_value)
values
  ('about_approach', 'Explore → prototype → refine'),
  ('about_mode', 'Learning through practical projects'),
  ('about_tools', 'Design, web, automation and physical computing'),
  ('hero_class', 'Digital creative'),
  ('hero_region', 'Kathmandu, Nepal'),
  ('hero_system_state', 'Portfolio system online'),
  ('footer_signature', 'Built across design, code and curiosity')
on conflict (setting_key) do nothing;

