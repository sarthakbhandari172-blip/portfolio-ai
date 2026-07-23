import Link from "next/link";
import {
  deleteProject,
  logout,
  markMessageRead,
  saveProfile,
  saveProject,
  saveSection,
  saveService,
  saveSocialLink,
} from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";

export default async function AdminDashboard() {
  const { supabase, user } = await requireAdmin();
  const [profile, projects, services, sections, socialLinks, messages] =
    await Promise.all([
      supabase.from("profile").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("projects").select("*").order("sort_order"),
      supabase.from("services").select("*").order("sort_order"),
      supabase.from("section_content").select("*").order("section_key"),
      supabase.from("social_links").select("*").order("sort_order"),
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(30),
    ]);

  const projectRows = projects.data ?? [];
  const serviceRows = services.data ?? [];
  const sectionRows = sections.data ?? [];
  const linkRows = socialLinks.data ?? [];
  const messageRows = messages.data ?? [];
  const profileRow = profile.data;

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Portfolio administration</p>
          <h1>Content dashboard</h1>
          <p>{user.email}</p>
        </div>
        <div className="admin-header-actions">
          <Link className="button button-secondary" href="/">
            View website
          </Link>
          <form action={logout}>
            <button className="button button-secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Dashboard sections">
        <a href="#profile">Profile</a>
        <a href="#projects">Projects</a>
        <a href="#sections">Copy</a>
        <a href="#services">Services</a>
        <a href="#links">Links</a>
        <a href="#messages">Messages</a>
      </nav>

      <section className="admin-section" id="profile">
        <header>
          <p className="eyebrow">Identity</p>
          <h2>Profile</h2>
        </header>
        <form action={saveProfile} className="admin-form admin-form-grid">
          <input type="hidden" name="id" value={profileRow?.id ?? ""} />
          <input
            type="hidden"
            name="existing_avatar"
            value={profileRow?.avatar_url ?? ""}
          />
          <label>
            Full name
            <input name="full_name" defaultValue={profileRow?.full_name ?? ""} required />
          </label>
          <label>
            Location
            <input name="location" defaultValue={profileRow?.location ?? ""} />
          </label>
          <label className="wide">
            Tagline
            <input name="tagline" defaultValue={profileRow?.tagline ?? ""} />
          </label>
          <label className="wide">
            Bio
            <textarea name="bio" rows={4} defaultValue={profileRow?.bio ?? ""} />
          </label>
          <label>
            Email
            <input name="email" type="email" defaultValue={profileRow?.email ?? ""} />
          </label>
          <label>
            Phone
            <input name="phone" defaultValue={profileRow?.phone ?? ""} />
          </label>
          <label>
            Resume URL
            <input name="resume_url" type="url" defaultValue={profileRow?.resume_url ?? ""} />
          </label>
          <label>
            Avatar
            <input name="avatar" type="file" accept="image/*" />
          </label>
          <button className="button button-primary" type="submit">
            Save profile
          </button>
        </form>
      </section>

      <section className="admin-section" id="projects">
        <header>
          <p className="eyebrow">Portfolio</p>
          <h2>Projects</h2>
        </header>
        <div className="admin-records">
          {[...projectRows, null].map((project, index) => (
            <form
              action={saveProject}
              className="admin-form admin-record"
              key={project?.id ?? "new-project"}
            >
              <div className="admin-record-title">
                <h3>{project?.title ?? "Add project"}</h3>
                <span>{project ? `#${project.id}` : "New"}</span>
              </div>
              <input type="hidden" name="id" value={project?.id ?? ""} />
              <input
                type="hidden"
                name="existing_thumbnail"
                value={project?.thumbnail_url ?? ""}
              />
              <div className="admin-form-grid">
                <label>
                  Title
                  <input name="title" defaultValue={project?.title ?? ""} required />
                </label>
                <label>
                  Slug
                  <input name="slug" defaultValue={project?.slug ?? ""} />
                </label>
                <label>
                  Category
                  <input name="category" defaultValue={project?.category ?? ""} />
                </label>
                <label>
                  Icon text
                  <input name="icon_text" defaultValue={project?.icon_text ?? "WEB"} />
                </label>
                <label className="wide">
                  Description
                  <textarea name="description" rows={3} defaultValue={project?.description ?? ""} />
                </label>
                <label className="wide">
                  Technology stack
                  <input
                    name="tech_stack"
                    defaultValue={project?.tech_stack?.join(", ") ?? ""}
                    placeholder="Next.js, Supabase, TypeScript"
                  />
                </label>
                <label>
                  GitHub URL
                  <input name="github_url" type="url" defaultValue={project?.github_url ?? ""} />
                </label>
                <label>
                  Live URL
                  <input name="live_url" defaultValue={project?.live_url ?? ""} />
                </label>
                <label>
                  External URL
                  <input name="external_url" defaultValue={project?.external_url ?? ""} />
                </label>
                <label>
                  Sort order
                  <input name="sort_order" type="number" defaultValue={project?.sort_order ?? index + 1} />
                </label>
                <label>
                  Thumbnail
                  <input name="thumbnail" type="file" accept="image/*" />
                </label>
                <label>
                  Image fit
                  <select name="thumbnail_fit" defaultValue={project?.thumbnail_fit ?? "cover"}>
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                  </select>
                </label>
                <label>
                  Image position
                  <input
                    name="thumbnail_position"
                    defaultValue={project?.thumbnail_position ?? "center center"}
                  />
                </label>
                <div className="admin-checks">
                  <label>
                    <input name="featured" type="checkbox" defaultChecked={project?.featured ?? false} />
                    Featured
                  </label>
                  <label>
                    <input name="is_active" type="checkbox" defaultChecked={project?.is_active ?? true} />
                    Active
                  </label>
                </div>
              </div>
              <div className="admin-record-actions">
                <button className="button button-primary" type="submit">
                  {project ? "Update project" : "Create project"}
                </button>
                {project ? (
                  <button
                    className="button admin-danger"
                    formAction={deleteProject}
                    name="id"
                    value={project.id}
                    type="submit"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </form>
          ))}
        </div>
      </section>

      <section className="admin-section" id="sections">
        <header>
          <p className="eyebrow">Public copy</p>
          <h2>Section headings</h2>
        </header>
        <div className="admin-records compact">
          {sectionRows.map((section) => (
            <form action={saveSection} className="admin-form admin-record" key={section.section_key}>
              <input type="hidden" name="section_key" value={section.section_key} />
              <div className="admin-record-title">
                <h3>{section.section_key}</h3>
              </div>
              <div className="admin-form-grid">
                <label>
                  Label
                  <input name="label" defaultValue={section.label ?? ""} />
                </label>
                <label>
                  Title
                  <input name="title" defaultValue={section.title ?? ""} />
                </label>
                <label>
                  Accent
                  <input name="accent" defaultValue={section.accent ?? ""} />
                </label>
                <label className="wide">
                  Description
                  <textarea name="description" rows={2} defaultValue={section.description ?? ""} />
                </label>
              </div>
              <button className="button button-primary" type="submit">
                Save copy
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="admin-section" id="services">
        <header>
          <p className="eyebrow">Capabilities</p>
          <h2>Services</h2>
        </header>
        <div className="admin-records compact">
          {[...serviceRows, null].map((service, index) => (
            <form action={saveService} className="admin-form admin-record" key={service?.id ?? "new-service"}>
              <input type="hidden" name="id" value={service?.id ?? ""} />
              <div className="admin-record-title">
                <h3>{service?.title ?? "Add service"}</h3>
              </div>
              <div className="admin-form-grid">
                <label>
                  Title
                  <input name="title" defaultValue={service?.title ?? ""} required />
                </label>
                <label>
                  Icon text
                  <input name="icon_text" defaultValue={service?.icon_text ?? ""} />
                </label>
                <label className="wide">
                  Description
                  <textarea name="description" rows={3} defaultValue={service?.description ?? ""} />
                </label>
                <label>
                  CTA text
                  <input name="cta_text" defaultValue={service?.cta_text ?? "Discuss project"} />
                </label>
                <label>
                  CTA URL
                  <input name="cta_url" defaultValue={service?.cta_url ?? "#contact"} />
                </label>
                <label>
                  Sort order
                  <input name="sort_order" type="number" defaultValue={service?.sort_order ?? index + 1} />
                </label>
                <label className="admin-inline-check">
                  <input name="is_active" type="checkbox" defaultChecked={service?.is_active ?? true} />
                  Active
                </label>
              </div>
              <button className="button button-primary" type="submit">
                {service ? "Update service" : "Create service"}
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="admin-section" id="links">
        <header>
          <p className="eyebrow">Contact</p>
          <h2>Social links</h2>
        </header>
        <div className="admin-records compact">
          {[...linkRows, null].map((link, index) => (
            <form action={saveSocialLink} className="admin-form admin-record" key={link?.id ?? "new-link"}>
              <input type="hidden" name="id" value={link?.id ?? ""} />
              <div className="admin-form-grid">
                <label>
                  Platform
                  <input name="platform" defaultValue={link?.platform ?? ""} required />
                </label>
                <label>
                  Label
                  <input name="label" defaultValue={link?.label ?? ""} required />
                </label>
                <label className="wide">
                  URL
                  <input name="url" defaultValue={link?.url ?? ""} required />
                </label>
                <label>
                  Icon
                  <input name="icon_text" defaultValue={link?.icon_text ?? "LK"} />
                </label>
                <label>
                  Sort order
                  <input name="sort_order" type="number" defaultValue={link?.sort_order ?? index + 1} />
                </label>
                <div className="admin-checks">
                  <label><input name="is_active" type="checkbox" defaultChecked={link?.is_active ?? true} />Active</label>
                  <label><input name="show_in_hero" type="checkbox" defaultChecked={link?.show_in_hero ?? false} />Hero</label>
                  <label><input name="show_in_contact" type="checkbox" defaultChecked={link?.show_in_contact ?? true} />Contact</label>
                  <label><input name="show_in_footer" type="checkbox" defaultChecked={link?.show_in_footer ?? true} />Footer</label>
                </div>
              </div>
              <button className="button button-primary" type="submit">
                {link ? "Update link" : "Create link"}
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="admin-section" id="messages">
        <header>
          <p className="eyebrow">Inbox</p>
          <h2>Contact messages</h2>
        </header>
        <div className="admin-messages">
          {messageRows.length ? (
            messageRows.map((message) => (
              <article className={message.is_read ? "" : "unread"} key={message.id}>
                <header>
                  <div>
                    <h3>{message.sender_name}</h3>
                    <a href={`mailto:${message.sender_email}`}>{message.sender_email}</a>
                  </div>
                  <time>{new Date(message.created_at).toLocaleString()}</time>
                </header>
                <p>{message.message}</p>
                {!message.is_read ? (
                  <form action={markMessageRead}>
                    <input type="hidden" name="id" value={message.id} />
                    <button className="button button-secondary" type="submit">
                      Mark read
                    </button>
                  </form>
                ) : null}
              </article>
            ))
          ) : (
            <p className="admin-empty">No contact messages yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}

