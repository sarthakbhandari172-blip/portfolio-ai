import Image from "next/image";
import { submitContact } from "@/app/actions";
import { CosmicLobby } from "@/app/cosmic-lobby";
import { KineticInterface } from "@/app/kinetic-interface";
import { getPortfolioData } from "@/lib/data";
import type { SectionContent } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function SocialIcon({ platform }: { platform: string }) {
  const name = platform.toLowerCase();
  const common = {
    viewBox: "0 0 24 24",
    width: 22,
    height: 22,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name.includes("github")) {
    return (
      <svg {...common} fill="currentColor" stroke="none">
        <path d="M12 .8a11.4 11.4 0 0 0-3.6 22.2c.6.1.8-.3.8-.6v-2.2c-3.4.7-4.1-1.4-4.1-1.4-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.3.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.4 3.6 1.1.1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6a4.7 4.7 0 0 1 1.2-3.2c-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.3 11.3 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.9.1 3.2a4.7 4.7 0 0 1 1.2 3.2c0 4.7-2.8 5.7-5.5 6 .5.4.9 1.2.9 2.4v3.5c0 .3.2.7.8.6A11.4 11.4 0 0 0 12 .8Z" />
      </svg>
    );
  }

  if (name.includes("linkedin")) {
    return (
      <svg {...common} fill="currentColor" stroke="none">
        <path d="M5.3 3.5A2.3 2.3 0 1 1 .7 3.5a2.3 2.3 0 0 1 4.6 0ZM1.1 7.2h4.3V21H1.1V7.2Zm6.9 0h4.1v1.9h.1c.6-1.1 2-2.3 4-2.3 4.3 0 5.1 2.8 5.1 6.5V21H17v-6.8c0-1.6 0-3.7-2.3-3.7-2.3 0-2.6 1.8-2.6 3.6V21H8V7.2Z" />
      </svg>
    );
  }

  if (name.includes("instagram")) {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name.includes("whatsapp")) {
    return (
      <svg {...common}>
        <path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.7a8.5 8.5 0 1 1 16.2-4.1Z" />
        <path d="M8.1 7.6c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.8 2c.1.3 0 .5-.2.7l-.7.8c-.2.2-.1.4 0 .6.7 1.2 1.6 2.1 2.8 2.7.2.1.4.1.6-.1l.9-1.1c.2-.2.4-.3.7-.2l2 .9c.3.1.4.3.4.5 0 .5-.2 1.6-1.1 2.1-.6.4-1.4.6-2.3.3-1.3-.4-3-1.1-4.8-2.8-1.5-1.5-2.5-3.3-2.8-4.5-.3-.8 0-1.5.3-1.9Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

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
      <KineticInterface />

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
        region={data.settings.hero_region ?? data.profile.location ?? "Nepal"}
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
                <span><SocialIcon platform={link.platform} /></span>
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
