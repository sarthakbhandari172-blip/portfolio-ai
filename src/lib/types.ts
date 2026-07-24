export type Profile = {
  id?: number;
  full_name: string;
  tagline: string | null;
  bio: string | null;
  avatar_url: string | null;
  email: string | null;
  phone?: string | null;
  location: string | null;
  resume_url?: string | null;
  hero_label?: string | null;
  hero_display_title?: string | null;
  hero_accent_title?: string | null;
  hero_roles?: string[];
  hero_primary_cta_text?: string | null;
  hero_primary_cta_url?: string | null;
  hero_secondary_cta_text?: string | null;
  hero_secondary_cta_url?: string | null;
  status_text?: string | null;
};

export type Skill = {
  id: number;
  name: string;
  category: string | null;
  proficiency: number;
  icon: string | null;
  sort_order: number;
  description?: string | null;
  link_url?: string | null;
  is_active?: boolean;
};

export type Project = {
  id: number;
  title: string;
  slug: string;
  category: string | null;
  description: string | null;
  tech_stack: string[];
  thumbnail_url: string | null;
  external_url: string | null;
  live_url: string | null;
  github_url: string | null;
  icon_text: string | null;
  featured: boolean;
  sort_order: number;
  is_active: boolean;
  thumbnail_fit: "cover" | "contain";
  thumbnail_position: string;
};

export type Experience = {
  id: number;
  company: string;
  role: string;
  period: string | null;
  description: string | null;
  icon: string | null;
  status: string | null;
  sort_order: number;
  link_url?: string | null;
  is_active?: boolean;
};

export type Service = {
  id: number;
  title: string;
  description: string | null;
  icon_text: string | null;
  badge_text: string | null;
  badge_style: string | null;
  cta_text: string | null;
  cta_url: string | null;
  sort_order: number;
  is_active: boolean;
  thumbnail_url?: string | null;
  thumbnail_fit?: "cover" | "contain";
  thumbnail_position?: string;
};

export type SectionContent = {
  section_key: string;
  label: string | null;
  title: string | null;
  accent: string | null;
  description: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
};

export type SocialLink = {
  id: number;
  platform: string;
  label: string;
  url: string;
  icon_text: string;
  sort_order: number;
  is_active: boolean;
  show_in_hero: boolean;
  show_in_contact: boolean;
  show_in_footer: boolean;
};

export type PortfolioData = {
  profile: Profile;
  skills: Skill[];
  projects: Project[];
  experience: Experience[];
  services: Service[];
  sections: Record<string, SectionContent>;
  socialLinks: SocialLink[];
  settings: Record<string, string>;
};
