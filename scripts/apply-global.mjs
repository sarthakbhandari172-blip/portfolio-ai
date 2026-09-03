// Adds 3 global concept projects, reorders the grid, and adds the Canva certificate to Journey.
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

// upload thumbnails
const thumbs = [
  ["loopwise-saas", "loopwise"],
  ["arcoak-ecom", "arc-and-oak"],
  ["stride-ads", "stride-ads"],
];
const urls = {};
for (const [file] of thumbs) {
  const body = readFileSync(new URL(`../public/media/projects/${file}.png`, import.meta.url));
  const path = `projects/${file}.png`;
  fail(`upload ${file}`, (await db.storage.from(BUCKET).upload(path, body, { contentType: "image/png", upsert: true })).error);
  urls[file] = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// upload certificate PDF
const certBody = readFileSync("/Users/sarthakbhandari/Downloads/sarthak-bhandari-graphic-design-essentials-certificate.pdf");
fail("upload cert", (await db.storage.from(BUCKET).upload("docs/canva-graphic-design-essentials.pdf", certBody, { contentType: "application/pdf", upsert: true })).error);
const certUrl = db.storage.from(BUCKET).getPublicUrl("docs/canva-graphic-design-essentials.pdf").data.publicUrl;

// insert the 3 global projects
const rows = [
  { title: "Loopwise", slug: "loopwise", category: "Web Design — Concept",
    description: "SaaS landing page for a fictional team-time product: honest hero copy, product shot, proof strip and one CTA repeated.",
    tech_stack: ["Figma", "HTML & CSS"], thumbnail_url: urls["loopwise-saas"], icon_text: "LP", featured: true, sort_order: 2, is_active: true, live_url: "#" },
  { title: "Arc & Oak", slug: "arc-and-oak", category: "E-commerce UI — Concept",
    description: "Product page for a fictional furniture store: serif brand voice, full purchase-flow anatomy, finish swatches and reviews.",
    tech_stack: ["Figma"], thumbnail_url: urls["arcoak-ecom"], icon_text: "EC", featured: true, sort_order: 3, is_active: true, live_url: "#" },
  { title: "Stride — Ad Set", slug: "stride-ads", category: "Ad Creative — Concept",
    description: "Paid-social set for a fictional running app: one message adapted across feed, story and display placements.",
    tech_stack: ["Photoshop", "Figma"], thumbnail_url: urls["stride-ads"], icon_text: "AD", featured: true, sort_order: 6, is_active: true, live_url: "#" },
];
fail("projects", (await db.from("projects").upsert(rows, { onConflict: "slug" })).error);

// reorder the rest: Nepal + global alternating
const order = [["lekh-trail-gear", 1], ["saath-campaign", 4], ["nepse-pulse", 5], ["trail-nepal-thumbnails", 7], ["lekh-app", 8], ["paila-editorial", 9], ["logofolio-01", 10], ["himali-chiya", 11], ["patan-sessions", 12], ["portfolio-engine", 13], ["interface-experiments", 14]];
for (const [slug, sort_order] of order)
  fail(`sort ${slug}`, (await db.from("projects").update({ sort_order }).eq("slug", slug)).error);

// certificate in Journey (linked to the verifiable PDF)
const { data: existing } = await db.from("experience").select("id").eq("company", "Canva Design School");
if (!existing?.length) {
  fail("experience cert", (await db.from("experience").insert({
    company: "Canva Design School",
    role: "Certified — Graphic Design Essentials",
    period: "Sept 2026",
    description: "Canva certification in graphic design foundations. Credential ID 505afa — click to verify.",
    icon: "04", status: "Certified", sort_order: 4, link_url: certUrl,
  })).error);
}

const { count } = await db.from("projects").select("*", { count: "exact", head: true }).eq("is_active", true);
console.log(`done — ${count} projects live, certificate added: ${certUrl}`);
