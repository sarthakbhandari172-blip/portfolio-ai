import { fallbackData } from "@/lib/fallback-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PortfolioData,
  SectionContent,
} from "@/lib/types";

export async function getPortfolioData(): Promise<PortfolioData> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fallbackData;

  try {
    const [profile, skills, projects, experience, services, sections, socialLinks] =
      await Promise.all([
        supabase.from("profile").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("skills").select("*").order("sort_order"),
        supabase.from("projects").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("experience").select("*").order("sort_order"),
        supabase.from("services").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("section_content").select("*"),
        supabase.from("social_links").select("*").eq("is_active", true).order("sort_order"),
      ]);

    const hasError = [profile, skills, projects, experience, services, sections, socialLinks]
      .some((result) => result.error);
    if (hasError) return fallbackData;

    const sectionMap = Object.fromEntries(
      ((sections.data ?? []) as SectionContent[]).map((section) => [
        section.section_key,
        section,
      ]),
    );

    return {
      profile: profile.data ?? fallbackData.profile,
      skills: skills.data?.length ? skills.data : fallbackData.skills,
      projects: projects.data?.length ? projects.data : fallbackData.projects,
      experience: experience.data?.length ? experience.data : fallbackData.experience,
      services: services.data?.length ? services.data : fallbackData.services,
      sections: Object.keys(sectionMap).length ? sectionMap : fallbackData.sections,
      socialLinks: socialLinks.data?.length ? socialLinks.data : fallbackData.socialLinks,
    } as PortfolioData;
  } catch {
    return fallbackData;
  }
}

