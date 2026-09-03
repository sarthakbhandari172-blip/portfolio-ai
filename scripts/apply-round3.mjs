// Adds Orbit One, Gham Café, Torque Theory thumbnails and 1400M street tee; full grid reorder.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const fail = (step, error) => { if (error) { console.error(`FAILED ${step}: ${error.message}`); process.exit(1); } };
const BUCKET = "site-media";

const files = ["orbit-phone", "gham-cafe", "torque-thumbs", "street-tee"];
const urls = {};
for (const f of files) {
  const body = readFileSync(new URL(`../public/media/projects/${f}.png`, import.meta.url));
  fail(`upload ${f}`, (await db.storage.from(BUCKET).upload(`projects/${f}.png`, body, { contentType: "image/png", upsert: true })).error);
  urls[f] = db.storage.from(BUCKET).getPublicUrl(`projects/${f}.png`).data.publicUrl;
}

const rows = [
  { title: "Orbit One", slug: "orbit-one", category: "Product Page — Concept",
    description: "Bold product page for a fictional minimalist phone: giant product hero, honest spec strip and a single pre-order CTA.",
    tech_stack: ["Figma", "Photoshop"], thumbnail_url: urls["orbit-phone"], icon_text: "PH", featured: true, sort_order: 4, is_active: true, live_url: "#" },
  { title: "Gham — घाम", slug: "gham-cafe", category: "Café Identity — Concept",
    description: "Identity for a fictional Patan café: sun-over-cup logomark, terracotta and gold palette, cup artwork and bilingual menu card.",
    tech_stack: ["Illustrator", "Figma"], thumbnail_url: urls["gham-cafe"], icon_text: "CF", featured: true, sort_order: 7, is_active: true, live_url: "#" },
  { title: "Torque Theory — Thumbnails", slug: "torque-thumbs", category: "Content Design — Concept",
    description: "Vehicle YouTube thumbnail system: flat car, EV and bike silhouettes, three-word headlines, one accent per thumb.",
    tech_stack: ["Photoshop", "Figma"], thumbnail_url: urls["torque-thumbs"], icon_text: "VT", featured: true, sort_order: 8, is_active: true, live_url: "#" },
  { title: "1400M — Street Tee", slug: "street-tee", category: "Apparel — Concept",
    description: "Kathmandu streetwear front print: temple-skyline linework and bilingual type, two screens on off-black.",
    tech_stack: ["Illustrator"], thumbnail_url: urls["street-tee"], icon_text: "ST", featured: true, sort_order: 13, is_active: true, live_url: "#" },
];
fail("projects", (await db.from("projects").upsert(rows, { onConflict: "slug" })).error);

const order = [
  ["lekh-trail-gear", 1], ["loopwise", 2], ["arc-and-oak", 3], ["orbit-one", 4],
  ["saath-campaign", 5], ["nepse-pulse", 6], ["gham-cafe", 7], ["torque-thumbs", 8],
  ["stride-ads", 9], ["trail-nepal-thumbnails", 10], ["lekh-app", 11], ["paila-editorial", 12],
  ["street-tee", 13], ["logofolio-01", 14], ["himali-chiya", 15], ["patan-sessions", 16],
  ["portfolio-engine", 17], ["interface-experiments", 18],
];
for (const [slug, sort_order] of order)
  fail(`sort ${slug}`, (await db.from("projects").update({ sort_order }).eq("slug", slug)).error);

const { count } = await db.from("projects").select("*", { count: "exact", head: true }).eq("is_active", true);
console.log(`done — ${count} projects live`);
