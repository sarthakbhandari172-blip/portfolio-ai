import Link from "next/link";
import {
  deleteExperience,
  deleteProject,
  deleteService,
  deleteSkill,
  deleteSocialLink,
  logout,
  markMessageRead,
  saveExperience,
  saveProfile,
  saveProject,
  saveSection,
  saveService,
  saveSetting,
  saveSkill,
  saveSocialLink,
} from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";

export default async function AdminDashboard() {
  const { supabase, user } = await requireAdmin();
  const [
    profile,
    projects,
    services,
    sections,
    socialLinks,
    messages,
    skills,
    experience,
    settings,
  ] = await Promise.all([
    supabase.from("profile").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("projects").select("*").order("sort_order"),
    supabase.from("services").select("*").order("sort_order"),
    supabase.from("section_content").select("*").order("section_key"),
    supabase.from("social_links").select("*").order("sort_order"),
    supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(30),
    supabase.from("skills").select("*").order("sort_order"),
    supabase.from("experience").select("*").order("sort_order"),
    supabase.from("settings").select("*").order("setting_key"),
  ]);

  const profileRow = profile.data;
  const projectRows = projects.data ?? [];
  const serviceRows = services.data ?? [];
  const sectionRows = sections.data ?? [];
  const linkRows = socialLinks.data ?? [];
  const messageRows = messages.data ?? [];
  const skillRows = skills.data ?? [];
  const experienceRows = experience.data ?? [];
  const settingRows = settings.data ?? [];

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">SB // Content control</p>
          <h1>Portfolio command centre</h1>
          <p>{user.email}</p>
        </div>
        <div className="admin-header-actions">
          <Link className="button button-secondary" href="/">View website</Link>
          <form action={logout}>
            <button className="button button-secondary" type="submit">Sign out</button>
          </form>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Dashboard sections">
        <a href="#profile">Character deck</a>
        <a href="#sections">Sections</a>
        <a href="#projects">Projects</a>
        <a href="#services">Services</a>
        <a href="#skills">Skills</a>
        <a href="#journey">Journey</a>
        <a href="#settings">Settings</a>
        <a href="#links">Links</a>
        <a href="#messages">Inbox</a>
      </nav>

      <section className="admin-section" id="profile">
        <header>
          <p className="eyebrow">Primary identity</p>
          <h2>Character deck</h2>
          <p>Controls the hero text, portrait, rotating roles and primary actions.</p>
        </header>
        <form action={saveProfile} className="admin-form admin-form-grid">
          <input type="hidden" name="id" value={profileRow?.id ?? ""} />
          <input type="hidden" name="existing_avatar" value={profileRow?.avatar_url ?? ""} />
          <label>Full name<input name="full_name" defaultValue={profileRow?.full_name ?? ""} required /></label>
          <label>Location<input name="location" defaultValue={profileRow?.location ?? ""} /></label>
          <label className="wide">System label<input name="hero_label" defaultValue={profileRow?.hero_label ?? ""} /></label>
          <label>Display title<input name="hero_display_title" defaultValue={profileRow?.hero_display_title ?? ""} /></label>
          <label>Accent title<input name="hero_accent_title" defaultValue={profileRow?.hero_accent_title ?? ""} /></label>
          <label className="wide">Tagline<input name="tagline" defaultValue={profileRow?.tagline ?? ""} /></label>
          <label className="wide">Hero description<textarea name="bio" rows={4} defaultValue={profileRow?.bio ?? ""} /></label>
          <label className="wide">
            Rotating roles
            <input name="hero_roles" defaultValue={profileRow?.hero_roles?.join(", ") ?? ""} placeholder="Web Builder, Visual Designer, Automation Explorer" />
          </label>
          <label>Primary button text<input name="hero_primary_cta_text" defaultValue={profileRow?.hero_primary_cta_text ?? ""} /></label>
          <label>Primary button URL<input name="hero_primary_cta_url" defaultValue={profileRow?.hero_primary_cta_url ?? "#work"} /></label>
          <label>Secondary button text<input name="hero_secondary_cta_text" defaultValue={profileRow?.hero_secondary_cta_text ?? ""} /></label>
          <label>Secondary button URL<input name="hero_secondary_cta_url" defaultValue={profileRow?.hero_secondary_cta_url ?? "#services"} /></label>
          <label className="wide">Availability/status<input name="status_text" defaultValue={profileRow?.status_text ?? ""} /></label>
          <label>Email<input name="email" type="email" defaultValue={profileRow?.email ?? ""} /></label>
          <label>Phone<input name="phone" defaultValue={profileRow?.phone ?? ""} /></label>
          <label>Resume URL<input name="resume_url" defaultValue={profileRow?.resume_url ?? ""} /></label>
          <label>Character portrait<input name="avatar" type="file" accept="image/*" /></label>
          <button className="button button-primary" type="submit">Save character deck</button>
        </form>
      </section>

      <section className="admin-section" id="sections">
        <header>
          <p className="eyebrow">Global copy</p>
          <h2>Section headings</h2>
          <p>Edit every public label, title, accent and description.</p>
        </header>
        <div className="admin-records compact">
          {sectionRows.map((section) => (
            <form action={saveSection} className="admin-form admin-record" key={section.section_key}>
              <input type="hidden" name="section_key" value={section.section_key} />
              <div className="admin-record-title"><h3>{section.section_key}</h3><span>Section</span></div>
              <div className="admin-form-grid">
                <label>Label<input name="label" defaultValue={section.label ?? ""} /></label>
                <label>Title<input name="title" defaultValue={section.title ?? ""} /></label>
                <label>Accent<input name="accent" defaultValue={section.accent ?? ""} /></label>
                <label>CTA text<input name="cta_text" defaultValue={section.cta_text ?? ""} /></label>
                <label className="wide">Description<textarea name="description" rows={3} defaultValue={section.description ?? ""} /></label>
                <label className="wide">CTA URL<input name="cta_url" defaultValue={section.cta_url ?? ""} /></label>
              </div>
              <button className="button button-primary" type="submit">Save section</button>
            </form>
          ))}
        </div>
      </section>

      <section className="admin-section" id="projects">
        <header>
          <p className="eyebrow">Work catalogue</p>
          <h2>Projects</h2>
          <p>The first available external, live or GitHub URL makes the full card clickable.</p>
        </header>
        <div className="admin-records">
          {[...projectRows, null].map((project, index) => (
            <form action={saveProject} className="admin-form admin-record" key={project?.id ?? "new-project"}>
              <div className="admin-record-title"><h3>{project?.title ?? "Add project"}</h3><span>{project ? `#${project.id}` : "New"}</span></div>
              <input type="hidden" name="id" value={project?.id ?? ""} />
              <input type="hidden" name="existing_thumbnail" value={project?.thumbnail_url ?? ""} />
              <div className="admin-form-grid">
                <label>Title<input name="title" defaultValue={project?.title ?? ""} required /></label>
                <label>Slug<input name="slug" defaultValue={project?.slug ?? ""} /></label>
                <label>Category<input name="category" defaultValue={project?.category ?? ""} /></label>
                <label>Icon text<input name="icon_text" defaultValue={project?.icon_text ?? "WEB"} /></label>
                <label className="wide">Description<textarea name="description" rows={4} defaultValue={project?.description ?? ""} /></label>
                <label className="wide">Technology stack<input name="tech_stack" defaultValue={project?.tech_stack?.join(", ") ?? ""} /></label>
                <label>External URL<input name="external_url" defaultValue={project?.external_url ?? ""} /></label>
                <label>Live URL<input name="live_url" defaultValue={project?.live_url ?? ""} /></label>
                <label>GitHub URL<input name="github_url" defaultValue={project?.github_url ?? ""} /></label>
                <label>Sort order<input name="sort_order" type="number" defaultValue={project?.sort_order ?? index + 1} /></label>
                <label>Thumbnail<input name="thumbnail" type="file" accept="image/*" /></label>
                <label>Image fit<select name="thumbnail_fit" defaultValue={project?.thumbnail_fit ?? "cover"}><option value="cover">Cover</option><option value="contain">Contain</option></select></label>
                <label>Image position<input name="thumbnail_position" defaultValue={project?.thumbnail_position ?? "center center"} /></label>
                <div className="admin-checks">
                  <label><input name="featured" type="checkbox" defaultChecked={project?.featured ?? false} />Featured</label>
                  <label><input name="is_active" type="checkbox" defaultChecked={project?.is_active ?? true} />Visible</label>
                </div>
              </div>
              <div className="admin-record-actions">
                <button className="button button-primary" type="submit">{project ? "Update project" : "Create project"}</button>
                {project ? <button className="button admin-danger" formAction={deleteProject} name="id" value={project.id}>Delete</button> : null}
              </div>
            </form>
          ))}
        </div>
      </section>

      <section className="admin-section" id="services">
        <header><p className="eyebrow">Service catalogue</p><h2>Services</h2><p>Each service supports its own thumbnail, description, link and visibility.</p></header>
        <div className="admin-records compact">
          {[...serviceRows, null].map((service, index) => (
            <form action={saveService} className="admin-form admin-record" key={service?.id ?? "new-service"}>
              <div className="admin-record-title"><h3>{service?.title ?? "Add service"}</h3><span>{service ? `#${service.id}` : "New"}</span></div>
              <input type="hidden" name="id" value={service?.id ?? ""} />
              <input type="hidden" name="existing_thumbnail" value={service?.thumbnail_url ?? ""} />
              <div className="admin-form-grid">
                <label>Title<input name="title" defaultValue={service?.title ?? ""} required /></label>
                <label>Icon text<input name="icon_text" defaultValue={service?.icon_text ?? ""} /></label>
                <label className="wide">Description<textarea name="description" rows={3} defaultValue={service?.description ?? ""} /></label>
                <label>CTA text<input name="cta_text" defaultValue={service?.cta_text ?? "Discuss project"} /></label>
                <label>CTA URL<input name="cta_url" defaultValue={service?.cta_url ?? "#contact"} /></label>
                <label>Sort order<input name="sort_order" type="number" defaultValue={service?.sort_order ?? index + 1} /></label>
                <label>Thumbnail<input name="thumbnail" type="file" accept="image/*" /></label>
                <label>Image fit<select name="thumbnail_fit" defaultValue={service?.thumbnail_fit ?? "cover"}><option value="cover">Cover</option><option value="contain">Contain</option></select></label>
                <label>Image position<input name="thumbnail_position" defaultValue={service?.thumbnail_position ?? "center center"} /></label>
                <label className="admin-inline-check"><input name="is_active" type="checkbox" defaultChecked={service?.is_active ?? true} />Visible</label>
              </div>
              <div className="admin-record-actions">
                <button className="button button-primary" type="submit">{service ? "Update service" : "Create service"}</button>
                {service ? <button className="button admin-danger" formAction={deleteService} name="id" value={service.id}>Delete</button> : null}
              </div>
            </form>
          ))}
        </div>
      </section>

      <section className="admin-section" id="skills">
        <header><p className="eyebrow">System modules</p><h2>Skills</h2><p>Control the skill inventory, detail copy, proficiency and optional destination URL.</p></header>
        <div className="admin-records compact">
          {[...skillRows, null].map((skill, index) => (
            <form action={saveSkill} className="admin-form admin-record" key={skill?.id ?? "new-skill"}>
              <div className="admin-record-title"><h3>{skill?.name ?? "Add skill"}</h3><span>{skill ? `#${skill.id}` : "New"}</span></div>
              <input type="hidden" name="id" value={skill?.id ?? ""} />
              <div className="admin-form-grid">
                <label>Name<input name="name" defaultValue={skill?.name ?? ""} required /></label>
                <label>Category<input name="category" defaultValue={skill?.category ?? ""} /></label>
                <label>Icon<input name="icon" defaultValue={skill?.icon ?? ""} /></label>
                <label>Proficiency<input name="proficiency" type="number" min="0" max="100" defaultValue={skill?.proficiency ?? 50} /></label>
                <label className="wide">Description<textarea name="description" rows={2} defaultValue={skill?.description ?? ""} /></label>
                <label className="wide">Optional URL<input name="link_url" defaultValue={skill?.link_url ?? ""} /></label>
                <label>Sort order<input name="sort_order" type="number" defaultValue={skill?.sort_order ?? index + 1} /></label>
                <label className="admin-inline-check"><input name="is_active" type="checkbox" defaultChecked={skill?.is_active ?? true} />Visible</label>
              </div>
              <div className="admin-record-actions">
                <button className="button button-primary" type="submit">{skill ? "Update skill" : "Create skill"}</button>
                {skill ? <button className="button admin-danger" formAction={deleteSkill} name="id" value={skill.id}>Delete</button> : null}
              </div>
            </form>
          ))}
        </div>
      </section>

      <section className="admin-section" id="journey">
        <header><p className="eyebrow">Chronology</p><h2>Journey</h2><p>Create and order experience, study or project milestones.</p></header>
        <div className="admin-records compact">
          {[...experienceRows, null].map((item, index) => (
            <form action={saveExperience} className="admin-form admin-record" key={item?.id ?? "new-experience"}>
              <div className="admin-record-title"><h3>{item?.role ?? "Add journey item"}</h3><span>{item ? `#${item.id}` : "New"}</span></div>
              <input type="hidden" name="id" value={item?.id ?? ""} />
              <div className="admin-form-grid">
                <label>Role/title<input name="role" defaultValue={item?.role ?? ""} required /></label>
                <label>Company/context<input name="company" defaultValue={item?.company ?? ""} required /></label>
                <label>Period<input name="period" defaultValue={item?.period ?? ""} /></label>
                <label>Status<input name="status" defaultValue={item?.status ?? ""} /></label>
                <label>Icon<input name="icon" defaultValue={item?.icon ?? ""} /></label>
                <label>Sort order<input name="sort_order" type="number" defaultValue={item?.sort_order ?? index + 1} /></label>
                <label className="wide">Description<textarea name="description" rows={3} defaultValue={item?.description ?? ""} /></label>
                <label className="wide">Optional URL<input name="link_url" defaultValue={item?.link_url ?? ""} /></label>
                <label className="admin-inline-check"><input name="is_active" type="checkbox" defaultChecked={item?.is_active ?? true} />Visible</label>
              </div>
              <div className="admin-record-actions">
                <button className="button button-primary" type="submit">{item ? "Update item" : "Create item"}</button>
                {item ? <button className="button admin-danger" formAction={deleteExperience} name="id" value={item.id}>Delete</button> : null}
              </div>
            </form>
          ))}
        </div>
      </section>

      <section className="admin-section" id="settings">
        <header><p className="eyebrow">Interface variables</p><h2>Settings</h2><p>These values control small labels and supporting copy used throughout the site.</p></header>
        <div className="admin-records compact">
          {[...settingRows, null].map((setting) => (
            <form action={saveSetting} className="admin-form admin-record" key={setting?.setting_key ?? "new-setting"}>
              <div className="admin-form-grid">
                <label>Setting key<input name="setting_key" defaultValue={setting?.setting_key ?? ""} readOnly={Boolean(setting)} required /></label>
                <label className="wide">Value<textarea name="setting_value" rows={2} defaultValue={setting?.setting_value ?? ""} /></label>
              </div>
              <button className="button button-primary" type="submit">{setting ? "Update setting" : "Create setting"}</button>
            </form>
          ))}
        </div>
      </section>

      <section className="admin-section" id="links">
        <header><p className="eyebrow">Network</p><h2>Social links</h2><p>Control URLs and exactly where each channel appears.</p></header>
        <div className="admin-records compact">
          {[...linkRows, null].map((link, index) => (
            <form action={saveSocialLink} className="admin-form admin-record" key={link?.id ?? "new-link"}>
              <div className="admin-record-title"><h3>{link?.label ?? "Add link"}</h3><span>{link ? `#${link.id}` : "New"}</span></div>
              <input type="hidden" name="id" value={link?.id ?? ""} />
              <div className="admin-form-grid">
                <label>Platform<input name="platform" defaultValue={link?.platform ?? ""} required /></label>
                <label>Label<input name="label" defaultValue={link?.label ?? ""} required /></label>
                <label className="wide">URL<input name="url" defaultValue={link?.url ?? ""} required /></label>
                <label>Icon<input name="icon_text" defaultValue={link?.icon_text ?? "LK"} /></label>
                <label>Sort order<input name="sort_order" type="number" defaultValue={link?.sort_order ?? index + 1} /></label>
                <div className="admin-checks">
                  <label><input name="is_active" type="checkbox" defaultChecked={link?.is_active ?? true} />Active</label>
                  <label><input name="show_in_hero" type="checkbox" defaultChecked={link?.show_in_hero ?? false} />Hero</label>
                  <label><input name="show_in_contact" type="checkbox" defaultChecked={link?.show_in_contact ?? true} />Contact</label>
                  <label><input name="show_in_footer" type="checkbox" defaultChecked={link?.show_in_footer ?? true} />Footer</label>
                </div>
              </div>
              <div className="admin-record-actions">
                <button className="button button-primary" type="submit">{link ? "Update link" : "Create link"}</button>
                {link ? <button className="button admin-danger" formAction={deleteSocialLink} name="id" value={link.id}>Delete</button> : null}
              </div>
            </form>
          ))}
        </div>
      </section>

      <section className="admin-section" id="messages">
        <header><p className="eyebrow">Secure inbox</p><h2>Contact messages</h2></header>
        <div className="admin-messages">
          {messageRows.length ? messageRows.map((message) => (
            <article className={message.is_read ? "" : "unread"} key={message.id}>
              <header>
                <div><h3>{message.sender_name}</h3><a href={`mailto:${message.sender_email}`}>{message.sender_email}</a></div>
                <time>{new Date(message.created_at).toLocaleString()}</time>
              </header>
              <p>{message.message}</p>
              {!message.is_read ? (
                <form action={markMessageRead}>
                  <input type="hidden" name="id" value={message.id} />
                  <button className="button button-secondary" type="submit">Mark read</button>
                </form>
              ) : null}
            </article>
          )) : <p className="admin-empty">No contact messages yet.</p>}
        </div>
      </section>
    </main>
  );
}
