// One-shot content sync: repositions the live portfolio design-first.
// A JSON backup of the previous state is in supabase/backups/backup-2026-09-03.json.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const fail = (step, error) => { if (error) { console.error(`FAILED at ${step}:`, error.message); process.exit(1); } };

// ---- profile ----
const { data: profRows, error: profErr } = await db.from("profile").select("id").limit(1);
fail("profile select", profErr);
const { error: e1 } = await db.from("profile").update({
  tagline: "Design · Content · Code",
  bio: "Graphic and digital designer with a developer's toolkit — creating brand, social and campaign visuals, then building them for the web.",
  avatar_url: "/media/profile/sb-mark.png",
  location: "Kathmandu, Nepal",
  hero_label: "Sarthak Bhandari — Portfolio",
  hero_accent_title: "Graphic & Digital Designer",
  hero_roles: ["Graphic & Digital Design", "Brand & Social Assets", "Design to Code, End to End"],
  hero_primary_cta_text: "View Work",
  hero_primary_cta_url: "#work",
  hero_secondary_cta_text: "What I Do",
  hero_secondary_cta_url: "#services",
  status_text: "Open to junior roles & freelance",
}).eq("id", profRows[0].id);
fail("profile", e1);

// ---- settings ----
const settings = {
  site_title: "Sarthak Bhandari | Graphic & Digital Designer",
  site_tagline: "Design · Content · Code",
  about_approach: "Explore → prototype → refine",
  about_mode: "Learning by shipping real projects",
  about_tools: "Figma, Adobe Creative Cloud and the modern web",
  hero_class: "Graphic & digital designer",
  hero_region: "Kathmandu, Nepal",
  hero_system_state: "Open to junior roles & freelance",
  footer_signature: "Built across design, code and curiosity",
};
const { error: e2 } = await db.from("settings").upsert(
  Object.entries(settings).map(([setting_key, setting_value]) => ({ setting_key, setting_value })),
  { onConflict: "setting_key" }
);
fail("settings", e2);

// ---- skills ----
fail("skills clear", (await db.from("skills").delete().gte("id", 0)).error);
const { error: e3 } = await db.from("skills").insert([
  { name: "Adobe Photoshop", category: "Design", proficiency: 75, icon: "PS", sort_order: 1 },
  { name: "Adobe Illustrator", category: "Design", proficiency: 70, icon: "AI", sort_order: 2 },
  { name: "Adobe Lightroom", category: "Design", proficiency: 70, icon: "LR", sort_order: 3 },
  { name: "Figma", category: "Design", proficiency: 70, icon: "FG", sort_order: 4 },
  { name: "Canva", category: "Design", proficiency: 90, icon: "CN", sort_order: 5 },
  { name: "Premiere Pro & After Effects", category: "Motion", proficiency: 60, icon: "MO", sort_order: 6 },
  { name: "CSS & Interface Design", category: "Code", proficiency: 90, icon: "UI", sort_order: 7 },
  { name: "JavaScript / TypeScript", category: "Code", proficiency: 85, icon: "JS", sort_order: 8 },
  { name: "Next.js & Supabase", category: "Code", proficiency: 70, icon: "NX", sort_order: 9 },
  { name: "Git & GitHub", category: "Code", proficiency: 80, icon: "GT", sort_order: 10 },
]);
fail("skills", e3);

// ---- experience ----
fail("experience clear", (await db.from("experience").delete().gte("id", 0)).error);
const { error: e4 } = await db.from("experience").insert([
  { company: "Freelance & self-initiated briefs", role: "Independent Visual Designer", period: "2025 — Present", description: "Brand identity concepts, social media and campaign-style assets, presentation decks, photo retouching and print-ready artwork — delivered organised and on time.", icon: "01", status: "Current", sort_order: 1 },
  { company: "Independent Projects", role: "Software & Interface Development", period: "2025 — Present", description: "Building web interfaces and database-backed applications, end to end.", icon: "02", status: "Current", sort_order: 2 },
  { company: "Hardware Exploration", role: "Prototyping & Systems Learning", period: "2024 — Present", description: "Electronics and physical computing — the connection between hardware and software.", icon: "03", status: "Ongoing", sort_order: 3 },
]);
fail("experience", e4);

// ---- services ----
fail("services clear", (await db.from("services").delete().gte("id", 0)).error);
const services = [
  ["Brand & Social Graphics", "Logo concepts, identity elements and social assets that stay consistent across every format.", "BR"],
  ["Campaign & Poster Design", "Posters, banners and campaign visuals for events, causes and products — digital or print-ready.", "CP"],
  ["Photo Editing & Retouching", "Colour, composition and clean-up in Photoshop and Lightroom.", "RT"],
  ["Presentation Design", "Clear, on-brand decks that make information easy to follow.", "PD"],
  ["Landing Pages", "Single-purpose pages designed around one message and one clear action.", "LP"],
  ["Business & Portfolio Websites", "Responsive sites structured around clear content and usability — designed and built.", "WB"],
  ["Website Redesign", "Interface and structure improvements for existing websites.", "UI"],
  ["AI-Assisted Workflows", "Ideation with Midjourney, Firefly and Canva AI — always selected, composited and finished by hand.", "AW"],
];
const { error: e5 } = await db.from("services").insert(services.map(([title, description, icon_text], i) => ({
  title, description, icon_text, badge_text: "Service", badge_style: i % 2 ? "cyan" : "ok",
  cta_text: "Discuss project", cta_url: "#contact", sort_order: i + 1, is_active: true,
})));
fail("services", e5);

// ---- section copy ----
const sections = [
  { section_key: "about", label: "About", title: "About", accent: "Sarthak", description: "Graphic and digital designer from Kathmandu who combines visual craft with the ability to build for the web." },
  { section_key: "skills", label: "Toolkit", title: "Tools &", accent: "Skills", description: "Design tools first, backed by real front-end development." },
  { section_key: "work", label: "Selected Work", title: "Featured", accent: "Projects", description: "Eleven projects across brand, campaign, editorial, packaging, content and UI — concept briefs clearly labelled." },
  { section_key: "services", label: "What I Do", title: "What I", accent: "Do", description: "Design and digital services for brands, causes and small teams." },
  { section_key: "journey", label: "Journey", title: "Experience", accent: "", description: "Freelance design work, independent builds and ongoing learning." },
  { section_key: "contact", label: "Contact", title: "Start a", accent: "Conversation", description: "Reach out about a role, a project or a collaboration." },
];
const { error: e6 } = await db.from("section_content").upsert(sections, { onConflict: "section_key" });
fail("sections", e6);

// ---- projects (upsert by slug) ----
const P = (title, slug, category, description, tech_stack, thumb, icon_text, sort_order, github_url = null) => ({
  title, slug, category, description, tech_stack, thumbnail_url: thumb, icon_text,
  featured: true, sort_order, is_active: true, github_url, live_url: "#",
});
const projects = [
  P("LEKH Trail Gear", "lekh-trail-gear", "Brand Identity — Concept", "Self-initiated brand for a fictional Kathmandu trekking gear label: logomark, palette, type system, social set and merch print.", ["Illustrator", "Figma", "Photoshop"], "/media/projects/lekh-brand.png", "BR", 1),
  P("Saath — साथ", "saath-campaign", "Awareness Campaign — Concept", "Dementia-awareness concept campaign: two poster directions and a social adaptation, designed to accessible contrast standards.", ["Figma", "Photoshop"], "/media/projects/saath-campaign.png", "CP", 2),
  P("Trail Nepal — Thumbnail System", "trail-nepal-thumbnails", "Content Design — Concept", "Click-through YouTube thumbnail system for a fictional trekking channel — one type stack, one accent, readable at 168 px.", ["Photoshop", "Figma"], "/media/projects/yt-thumbs.png", "YT", 3),
  P("Nepse Pulse", "nepse-pulse", "Dashboard UI — Concept", "Dark fintech dashboard for Nepal's stock market: index overview, watchlist and one-week chart — sample data throughout.", ["Figma"], "/media/projects/nepse-dash.png", "DB", 4),
  P("Lekh App", "lekh-app", "Mobile UI — Concept", "Trail-companion app for the LEKH brand: wireframes to hi-fi screens — home, trail detail, packing checklist.", ["Figma"], "/media/projects/lekh-app.png", "UI", 5),
  P("PAILA Quarterly", "paila-editorial", "Editorial — Concept", "Cover and feature spread for a fictional Kathmandu design magazine: hand-painted street signboards vs the vinyl-print flood.", ["Figma", "InDesign"], "/media/projects/paila-editorial.png", "ED", 6),
  P("Logofolio Vol. 01", "logofolio-01", "Brand Marks — Concept", "Six marks for six fictional clients — one line weight, positive and reversed, built to survive at favicon size.", ["Illustrator"], "/media/projects/logofolio.png", "LG", 7),
  P("Himali Chiya", "himali-chiya", "Packaging — Concept", "Tea packaging for a fictional Ilam estate: teal and gold pouch, bilingual label system, three-flavour line extension.", ["Illustrator", "Photoshop"], "/media/projects/chiya-packaging.png", "PK", 8),
  P("Patan Sessions Vol. 03", "patan-sessions", "Poster — Concept", "Two-colour risograph gig poster for a fictional courtyard concert series — deliberate misregistration, bilingual type.", ["Illustrator"], "/media/projects/gig-poster.png", "PO", 9),
  P("Portfolio Engine", "portfolio-engine", "Design + Build", "Designed and built end to end — visual system, responsive interface and an authenticated content dashboard.", ["Figma", "Next.js", "Supabase", "TypeScript"], "/media/projects/portfolio-engine.png", "WEB", 10, "https://github.com/sarthakbhandari172-blip"),
  P("Interface Experiments", "interface-experiments", "UI Systems", "Interface studies focused on motion, hierarchy and clear technical presentation.", ["CSS", "JavaScript", "Figma"], "/media/projects/interface-experiments.png", "UI", 11, "https://github.com/sarthakbhandari172-blip"),
];
const { error: e7 } = await db.from("projects").upsert(projects, { onConflict: "slug" });
fail("projects", e7);

const { count } = await db.from("projects").select("*", { count: "exact", head: true }).eq("is_active", true);
console.log(`done — profile, ${Object.keys(settings).length} settings, 10 skills, 3 experience, 8 services, 6 sections, ${projects.length} projects upserted (${count} active in DB)`);
