import Image from "next/image";
import Link from "next/link";
import { submitContact } from "@/app/actions";
import { CosmicLobby } from "@/app/cosmic-lobby";
import { getPortfolioData } from "@/lib/data";
import type { SectionContent } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function SectionHeading({
  section,
  fallbackLabel,
  fallbackTitle,
}: {
  section?: SectionContent;
  fallbackLabel: string;
  fallbackTitle: string;
}) {
  return (
    <header className="section-heading">
      <p className="eyebrow">{section?.label ?? fallbackLabel}</p>
      <h2>
        {section?.title ?? fallbackTitle}
        {section?.accent ? <span> {section.accent}</span> : null}
      </h2>
      {section?.description ? <p>{section.description}</p> : null}
    </header>
  );
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const data = await getPortfolioData();
  const heroLinks = data.socialLinks.filter((link) => link.show_in_hero);
  const contactLinks = data.socialLinks.filter((link) => link.show_in_contact);
  const contactStatus = typeof params.contact === "string" ? params.contact : "";

  return (
    <main>
      <div className="ambient" aria-hidden="true">
        <div className="ambient-grid" />
        <div className="ambient-orb ambient-orb-one" />
        <div className="ambient-orb ambient-orb-two" />
      </div>

      <nav className="nav shell" aria-label="Primary navigation">
        <a className="brand" href="#home" aria-label="Sarthak Bhandari home">
          <span>SB</span>
          <small>Portfolio</small>
        </a>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#work">Work</a>
          <a href="#services">Services</a>
          <a href="#journey">Journey</a>
          <a href="#skills">Skills</a>
          <a href="#contact">Contact</a>
        </div>
        <Link className="nav-admin" href="/admin">
          Admin
        </Link>
      </nav>

      <CosmicLobby
        displayTitle={data.profile.hero_display_title ?? data.profile.full_name}
        accentTitle={data.profile.hero_accent_title ?? "Digital Portfolio"}
        label={data.profile.hero_label ?? "System Online — Digital Portfolio"}
        tagline={data.profile.tagline ?? "Software · Hardware · Interfaces"}
        bio={data.profile.bio ?? "Exploring the space between an idea and its execution."}
        imageUrl={data.profile.avatar_url ?? "/media/profile/cosmic-avatar.png"}
        roles={data.profile.hero_roles ?? []}
        primaryCta={{
          text: data.profile.hero_primary_cta_text ?? "View Work",
          url: data.profile.hero_primary_cta_url ?? "#work",
        }}
        secondaryCta={{
          text: data.profile.hero_secondary_cta_text ?? "Enter Portal",
          url: data.profile.hero_secondary_cta_url ?? "#services",
        }}
        characterClass={data.settings.hero_class ?? "Digital creative"}
        region={data.settings.hero_region ?? data.profile.location ?? "Nepal"}
        systemState={data.settings.hero_system_state ?? "Portfolio system online"}
        statusText={data.profile.status_text ?? "Available for selected projects"}
        links={heroLinks.map((link) => ({
          id: link.id,
          label: link.label,
          url: link.url,
          icon_text: link.icon_text,
        }))}
      />

      <section className="section shell" id="about">
        <div className="about-grid">
          <div>
            <p className="eyebrow">{data.sections.about?.label ?? "Identity File"}</p>
            <h2 className="display-heading">
              {data.sections.about?.title ?? "About"}
              <span> {data.sections.about?.accent ?? "Sarthak"}</span>
            </h2>
          </div>
          <div className="about-copy">
            <p>
              {data.sections.about?.description ??
                `I'm ${data.profile.full_name}, a multidisciplinary builder in ${data.profile.location ?? "Nepal"}.`}
            </p>
            <dl className="identity-list">
              <div>
                <dt>Approach</dt>
                <dd>{data.settings.about_approach ?? "Explore → prototype → refine"}</dd>
              </div>
              <div>
                <dt>Current mode</dt>
                <dd>{data.settings.about_mode ?? "Learning through practical projects"}</dd>
              </div>
              <div>
                <dt>Primary tools</dt>
                <dd>{data.settings.about_tools ?? "Design, web and automation"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="section shell" id="work">
        <SectionHeading
          section={data.sections.work}
          fallbackLabel="Selected Work"
          fallbackTitle="Featured Projects"
        />
        <div className="projects-grid">
          {data.projects.map((project, index) => {
            const projectUrl =
              project.external_url || project.live_url || project.github_url;
            return (
            <article className="project-card" key={project.id}>
              {projectUrl && projectUrl !== "#" ? (
                <a
                  className="card-hit-target"
                  href={projectUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${project.title}`}
                />
              ) : null}
              <div className="project-media">
                {project.thumbnail_url ? (
                  <Image
                    src={project.thumbnail_url}
                    alt=""
                    width={900}
                    height={580}
                    style={{
                      objectFit: project.thumbnail_fit,
                      objectPosition: project.thumbnail_position,
                    }}
                  />
                ) : (
                  <span>{project.icon_text ?? String(index + 1).padStart(2, "0")}</span>
                )}
              </div>
              <div className="project-content">
                <div className="project-meta">
                  <span>{project.category ?? "Project"}</span>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="tag-row">
                  {project.tech_stack.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <div className="project-links">
                  <span>{projectUrl && projectUrl !== "#" ? "Open project ↗" : "Project archive"}</span>
                </div>
              </div>
            </article>
          )})}
        </div>
      </section>

      <section className="section shell" id="services">
        <SectionHeading
          section={data.sections.services}
          fallbackLabel="Capabilities"
          fallbackTitle="What I Build"
        />
        <div className="services-grid">
          {data.services.map((service) => (
            <article className="service-card" key={service.id}>
              {service.cta_url ? (
                <a
                  className="card-hit-target"
                  href={service.cta_url}
                  aria-label={`${service.cta_text ?? "Open"} ${service.title}`}
                />
              ) : null}
              <span className="service-index">{String(service.sort_order).padStart(2, "0")}</span>
              {service.thumbnail_url ? (
                <div className="service-media">
                  <Image
                    src={service.thumbnail_url}
                    alt=""
                    width={600}
                    height={360}
                    style={{
                      objectFit: service.thumbnail_fit ?? "cover",
                      objectPosition: service.thumbnail_position ?? "center center",
                    }}
                  />
                </div>
              ) : null}
              <div className="service-icon">{service.icon_text}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <span className="service-cta">{service.cta_text ?? "Discuss project"} ↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell" id="journey">
        <SectionHeading
          section={data.sections.journey}
          fallbackLabel="Journey"
          fallbackTitle="Experience"
        />
        <div className="timeline">
          {data.experience.map((item) => (
            <article key={item.id}>
              <span>{item.icon ?? String(item.sort_order).padStart(2, "0")}</span>
              <div>
                <p>{item.period}</p>
                <h3>{item.role}</h3>
                <h4>{item.company}</h4>
                <p>{item.description}</p>
              </div>
              <small>{item.status}</small>
              {item.link_url ? (
                <a
                  className="card-hit-target"
                  href={item.link_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${item.role}`}
                />
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="section shell" id="skills">
        <SectionHeading
          section={data.sections.skills}
          fallbackLabel="System Modules"
          fallbackTitle="Skills Inventory"
        />
        <div className="skills-grid">
          {data.skills.map((skill) => (
            <article className="skill-card" key={skill.id}>
              {skill.link_url ? (
                <a
                  className="card-hit-target"
                  href={skill.link_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${skill.name}`}
                />
              ) : null}
              <div>
                <span className="skill-icon">{skill.icon ?? "—"}</span>
                <small>{skill.category ?? "Technology"}</small>
              </div>
              <h3>{skill.name}</h3>
              {skill.description ? <p>{skill.description}</p> : null}
              <div className="skill-meter" aria-label={`${skill.proficiency}% proficiency`}>
                <span style={{ width: `${skill.proficiency}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell contact-section" id="contact">
        <div className="contact-copy">
          <SectionHeading
            section={data.sections.contact}
            fallbackLabel="Contact"
            fallbackTitle="Start a Conversation"
          />
          <div className="contact-links">
            {contactLinks.map((link) => (
              <a href={link.url} key={link.id} target="_blank" rel="noreferrer">
                <span>{link.icon_text}</span>
                <div>
                  <small>{link.platform}</small>
                  <strong>{link.label}</strong>
                </div>
              </a>
            ))}
          </div>
        </div>

        <form className="contact-form" action={submitContact}>
          <input
            className="honeypot"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <label>
            Name
            <input name="name" minLength={2} maxLength={120} required />
          </label>
          <label>
            Email
            <input name="email" type="email" maxLength={254} required />
          </label>
          <label>
            Message
            <textarea name="message" minLength={10} maxLength={5000} rows={6} required />
          </label>
          {contactStatus === "sent" ? (
            <p className="form-status success">Message received. Thank you.</p>
          ) : null}
          {contactStatus === "invalid" ? (
            <p className="form-status error">Please check the form and try again.</p>
          ) : null}
          {contactStatus === "offline" ? (
            <p className="form-status error">
              The form is not connected yet. Please use email.
            </p>
          ) : null}
          <button className="button button-primary" type="submit">
            Send message
          </button>
        </form>
      </section>

      <footer className="footer shell">
        <p>© {new Date().getFullYear()} Sarthak Bhandari</p>
        <p>{data.settings.footer_signature ?? "Software · Hardware · Interfaces"}</p>
        <a href="#home">Back to top ↑</a>
      </footer>
    </main>
  );
}
