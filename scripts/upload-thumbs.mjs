// Uploads thumbnails + avatar to Supabase Storage and points the DB at the public URLs.
// Fixes blank images on the currently-deployed build (which lacks the new /public files).
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
const { data: buckets, error: bErr } = await db.storage.listBuckets();
fail("listBuckets", bErr);
if (!buckets.some((b) => b.name === BUCKET)) {
  const { error } = await db.storage.createBucket(BUCKET, { public: true });
  fail("createBucket", error);
  console.log(`created public bucket ${BUCKET}`);
}

const files = [
  ["lekh-brand", "lekh-trail-gear"],
  ["saath-campaign", "saath-campaign"],
  ["yt-thumbs", "trail-nepal-thumbnails"],
  ["nepse-dash", "nepse-pulse"],
  ["lekh-app", "lekh-app"],
  ["paila-editorial", "paila-editorial"],
  ["logofolio", "logofolio-01"],
  ["chiya-packaging", "himali-chiya"],
  ["gig-poster", "patan-sessions"],
  ["portfolio-engine", "portfolio-engine"],
  ["interface-experiments", "interface-experiments"],
];

for (const [name, slug] of files) {
  const body = readFileSync(new URL(`../public/media/projects/${name}.png`, import.meta.url));
  const path = `projects/${name}.png`;
  const { error: upErr } = await db.storage.from(BUCKET).upload(path, body, { contentType: "image/png", upsert: true });
  fail(`upload ${name}`, upErr);
  const url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error: rowErr } = await db.from("projects").update({ thumbnail_url: url }).eq("slug", slug);
  fail(`row ${slug}`, rowErr);
  console.log(`ok ${slug} -> ${url}`);
}

const avatarBody = readFileSync(new URL("../public/media/profile/sb-mark.png", import.meta.url));
const { error: avErr } = await db.storage.from(BUCKET).upload("profile/sb-mark.png", avatarBody, { contentType: "image/png", upsert: true });
fail("upload avatar", avErr);
const avatarUrl = db.storage.from(BUCKET).getPublicUrl("profile/sb-mark.png").data.publicUrl;
const { data: prof } = await db.from("profile").select("id").limit(1);
fail("profile avatar", (await db.from("profile").update({ avatar_url: avatarUrl }).eq("id", prof[0].id)).error);
console.log(`ok avatar -> ${avatarUrl}`);
