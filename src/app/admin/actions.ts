"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function integer(formData: FormData, key: string, fallback = 0) {
  const value = Number.parseInt(text(formData, key), 10);
  return Number.isFinite(value) ? value : fallback;
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uploadMedia(
  file: File | null,
  folder: "profile" | "projects" | "services",
) {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
    throw new Error("Images must be under 8 MB.");
  }

  const { supabase } = await requireAdmin();
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const buffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from("portfolio-media")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) throw error;

  return supabase.storage.from("portfolio-media").getPublicUrl(path).data.publicUrl;
}

export async function login(formData: FormData) {
  const email = text(formData, "email");
  const password = text(formData, "password");
  const supabase = await createSupabaseServerClient();

  if (!supabase) redirect("/admin/login?error=configuration");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=credentials");

  redirect("/admin");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function saveProfile(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = integer(formData, "id");
  const uploadedAvatar = await uploadMedia(
    formData.get("avatar") as File | null,
    "profile",
  );
  const payload = {
    full_name: text(formData, "full_name"),
    tagline: text(formData, "tagline") || null,
    bio: text(formData, "bio") || null,
    avatar_url: uploadedAvatar || text(formData, "existing_avatar") || null,
    email: text(formData, "email") || null,
    phone: text(formData, "phone") || null,
    location: text(formData, "location") || null,
    resume_url: text(formData, "resume_url") || null,
    hero_label: text(formData, "hero_label") || null,
    hero_display_title: text(formData, "hero_display_title") || null,
    hero_accent_title: text(formData, "hero_accent_title") || null,
    hero_roles: text(formData, "hero_roles")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    hero_primary_cta_text: text(formData, "hero_primary_cta_text") || null,
    hero_primary_cta_url: text(formData, "hero_primary_cta_url") || null,
    hero_secondary_cta_text: text(formData, "hero_secondary_cta_text") || null,
    hero_secondary_cta_url: text(formData, "hero_secondary_cta_url") || null,
    status_text: text(formData, "status_text") || null,
  };

  if (id) {
    await supabase.from("profile").update(payload).eq("id", id);
  } else {
    await supabase.from("profile").insert(payload);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveProject(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = integer(formData, "id");
  const title = text(formData, "title");
  if (!title) return;

  const uploadedThumbnail = await uploadMedia(
    formData.get("thumbnail") as File | null,
    "projects",
  );
  const payload = {
    title,
    slug: text(formData, "slug") || slugify(title),
    category: text(formData, "category") || null,
    description: text(formData, "description") || null,
    tech_stack: text(formData, "tech_stack")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    thumbnail_url:
      uploadedThumbnail || text(formData, "existing_thumbnail") || null,
    external_url: text(formData, "external_url") || null,
    live_url: text(formData, "live_url") || null,
    github_url: text(formData, "github_url") || null,
    icon_text: text(formData, "icon_text") || "WEB",
    featured: checkbox(formData, "featured"),
    sort_order: integer(formData, "sort_order"),
    is_active: checkbox(formData, "is_active"),
    thumbnail_fit: text(formData, "thumbnail_fit") === "contain" ? "contain" : "cover",
    thumbnail_position: text(formData, "thumbnail_position") || "center center",
  };

  if (id) {
    await supabase.from("projects").update(payload).eq("id", id);
  } else {
    await supabase.from("projects").insert(payload);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteProject(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = integer(formData, "id");
  if (id) await supabase.from("projects").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveService(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = integer(formData, "id");
  const uploadedThumbnail = await uploadMedia(
    formData.get("thumbnail") as File | null,
    "services",
  );
  const payload = {
    title: text(formData, "title"),
    description: text(formData, "description") || null,
    icon_text: text(formData, "icon_text") || null,
    badge_text: text(formData, "badge_text") || null,
    badge_style: text(formData, "badge_style") || null,
    cta_text: text(formData, "cta_text") || null,
    cta_url: text(formData, "cta_url") || null,
    sort_order: integer(formData, "sort_order"),
    is_active: checkbox(formData, "is_active"),
    thumbnail_url:
      uploadedThumbnail || text(formData, "existing_thumbnail") || null,
    thumbnail_fit: text(formData, "thumbnail_fit") === "contain" ? "contain" : "cover",
    thumbnail_position: text(formData, "thumbnail_position") || "center center",
  };

  if (id) {
    await supabase.from("services").update(payload).eq("id", id);
  } else {
    await supabase.from("services").insert(payload);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteService(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = integer(formData, "id");
  if (id) await supabase.from("services").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveSkill(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = integer(formData, "id");
  const payload = {
    name: text(formData, "name"),
    category: text(formData, "category") || null,
    proficiency: Math.min(100, Math.max(0, integer(formData, "proficiency", 50))),
    icon: text(formData, "icon") || null,
    description: text(formData, "description") || null,
    link_url: text(formData, "link_url") || null,
    sort_order: integer(formData, "sort_order"),
    is_active: checkbox(formData, "is_active"),
  };
  if (!payload.name) return;

  if (id) {
    await supabase.from("skills").update(payload).eq("id", id);
  } else {
    await supabase.from("skills").insert(payload);
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteSkill(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = integer(formData, "id");
  if (id) await supabase.from("skills").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveExperience(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = integer(formData, "id");
  const payload = {
    company: text(formData, "company"),
    role: text(formData, "role"),
    period: text(formData, "period") || null,
    description: text(formData, "description") || null,
    icon: text(formData, "icon") || null,
    status: text(formData, "status") || null,
    link_url: text(formData, "link_url") || null,
    sort_order: integer(formData, "sort_order"),
    is_active: checkbox(formData, "is_active"),
  };
  if (!payload.company || !payload.role) return;

  if (id) {
    await supabase.from("experience").update(payload).eq("id", id);
  } else {
    await supabase.from("experience").insert(payload);
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteExperience(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = integer(formData, "id");
  if (id) await supabase.from("experience").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveSection(formData: FormData) {
  const { supabase } = await requireAdmin();
  const sectionKey = text(formData, "section_key");
  if (!sectionKey) return;

  await supabase.from("section_content").upsert({
    section_key: sectionKey,
    label: text(formData, "label") || null,
    title: text(formData, "title") || null,
    accent: text(formData, "accent") || null,
    description: text(formData, "description") || null,
    cta_text: text(formData, "cta_text") || null,
    cta_url: text(formData, "cta_url") || null,
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveSetting(formData: FormData) {
  const { supabase } = await requireAdmin();
  const settingKey = text(formData, "setting_key");
  if (!settingKey) return;
  await supabase.from("settings").upsert({
    setting_key: settingKey,
    setting_value: text(formData, "setting_value"),
  });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveSocialLink(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = integer(formData, "id");
  const payload = {
    platform: text(formData, "platform"),
    label: text(formData, "label"),
    url: text(formData, "url"),
    icon_text: text(formData, "icon_text") || "LK",
    sort_order: integer(formData, "sort_order"),
    is_active: checkbox(formData, "is_active"),
    show_in_hero: checkbox(formData, "show_in_hero"),
    show_in_contact: checkbox(formData, "show_in_contact"),
    show_in_footer: checkbox(formData, "show_in_footer"),
  };

  if (id) {
    await supabase.from("social_links").update(payload).eq("id", id);
  } else {
    await supabase.from("social_links").insert(payload);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteSocialLink(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = integer(formData, "id");
  if (id) await supabase.from("social_links").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function markMessageRead(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = integer(formData, "id");
  if (id) {
    await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
  }
  revalidatePath("/admin");
}
