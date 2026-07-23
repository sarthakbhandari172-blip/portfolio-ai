# Sarthak Bhandari — Portfolio

A professional portfolio built with Next.js, TypeScript, Supabase, and Vercel.
It replaces the original XAMPP/PHP application while preserving that version in
[`legacy-php`](./legacy-php) for reference.

## Stack

- Next.js App Router and TypeScript
- Supabase Postgres, Auth, Storage, and Row Level Security
- Vercel hosting
- Local fallback content so the public site still renders before Supabase is connected

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The admin interface is at
`http://localhost:3000/admin`.

## Connect Supabase

1. Create a Supabase project.
2. Open its SQL editor and run
   [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql).
3. Run [`supabase/seed.sql`](./supabase/seed.sql).
4. In **Authentication → Users**, create the account that should manage the portfolio.
5. Replace `YOUR_ADMIN_EMAIL` in the final statement of `supabase/seed.sql` with
   that account's email and run only that statement.
6. Copy the project values into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

The service-role key is server-only. Never expose it in browser code or commit
`.env.local`.

The schema creates a public `portfolio-media` Storage bucket. Content editors can
upload the profile image and project images from the admin interface.

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import it in Vercel as a Next.js project.
3. Add the three environment variables above to Production, Preview, and Development.
4. Deploy.
5. Open `/admin/login` on the deployed domain and sign in with the Supabase user.

## Data migration

- The raw MySQL export is intentionally kept outside this repository because it
  contains legacy account and contact data.
- Existing site images are in [`public/media`](./public/media).
- Supabase seed data has been normalized for PostgreSQL and excludes the legacy
  PHP password hash.

## Checks

```bash
npm run lint
npm run build
```
