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
  folder: "profile" | "projects",
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
  };

  if (id) {
    await supabase.from("services").update(payload).eq("id", id);
  } else {
    await supabase.from("services").insert(payload);
  }

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

export async function markMessageRead(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = integer(formData, "id");
  if (id) {
    await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
  }
  revalidatePath("/admin");
}

