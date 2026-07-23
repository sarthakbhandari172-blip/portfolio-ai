import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/admin/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/admin");
  }

  const error = typeof params.error === "string" ? params.error : "";
  const message =
    error === "configuration"
      ? "Supabase environment variables are not configured."
      : error === "unauthorized"
        ? "This account is not registered as an administrator."
        : error === "credentials"
          ? "Email or password is incorrect."
          : "";

  return (
    <main className="admin-login">
      <section>
        <Link href="/" className="admin-back">
          ← Portfolio
        </Link>
        <p className="eyebrow">Secure administration</p>
        <h1>Content dashboard</h1>
        <p>Sign in with the administrator account configured in Supabase.</p>
        {message ? <div className="admin-alert">{message}</div> : null}
        <form action={login} className="admin-form">
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="button button-primary" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}

