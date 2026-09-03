import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const tables = ["profile", "skills", "projects", "experience", "services", "section_content", "settings", "social_links"];
const dump = {};
for (const t of tables) {
  const { data, error } = await db.from(t).select("*");
  if (error) { console.log(`${t}: ERROR ${error.message}`); continue; }
  dump[t] = data;
}
mkdirSync(new URL("../supabase/backups", import.meta.url), { recursive: true });
writeFileSync(new URL("../supabase/backups/backup-2026-09-03.json", import.meta.url), JSON.stringify(dump, null, 2));

const p = dump.profile?.[0] ?? {};
console.log("PROFILE:", JSON.stringify({ tagline: p.tagline, avatar_url: p.avatar_url, hero_roles: p.hero_roles, hero_accent_title: p.hero_accent_title, status_text: p.status_text }));
console.log("SETTINGS:", JSON.stringify(dump.settings));
for (const row of dump.projects ?? [])
  console.log("PROJECT:", JSON.stringify({ id: row.id, slug: row.slug, title: row.title, category: row.category, thumb: row.thumbnail_url, active: row.is_active, sort: row.sort_order }));
for (const row of dump.experience ?? [])
  console.log("EXP:", JSON.stringify({ id: row.id, company: row.company, role: row.role }));
console.log("SKILLS:", (dump.skills ?? []).map((s) => s.name).join(" | "));
console.log("SERVICES:", (dump.services ?? []).map((s) => s.title).join(" | "));
console.log("SECTIONS:", (dump.section_content ?? []).map((s) => `${s.section_key}:${s.label}`).join(" | "));
console.log("backup written: supabase/backups/backup-2026-09-03.json");
