import Image from "next/image";
import Link from "next/link";
import { submitContact } from "@/app/actions";
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
          <a href="#about">About</a>
          <a href="#work">Work</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#contact">Contact</a>
        </div>
        <Link className="nav-admin" href="/admin">
          Admin
        </Link>
      </nav>

      <section className="hero shell" id="home">
        <div className="hero-copy">
          <p className="eyebrow">Software // Hardware // Interfaces</p>
          <h1>
            Sarthak
            <br />
            <span>Bhandari</span>
          </h1>
          <p className="hero-tagline">
            {data.profile.tagline ?? "Technology enthusiast based in Nepal"}
          </p>
          <p className="hero-bio">
            {data.profile.bio ??
              "Exploring the space between an idea and its execution."}
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#work">
              View selected work
            </a>
            <a className="button button-secondary" href="#contact">
              Start a conversation
            </a>
          </div>
          {heroLinks.length ? (
            <div className="social-row" aria-label="Featured social links">
              {heroLinks.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer">
                  <span>{link.icon_text}</span>
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="hero-visual" aria-label="Profile image">
          <div className="portrait-frame">
            <div className="portrait-ring portrait-ring-one" />
            <div className="portrait-ring portrait-ring-two" />
            <Image
              src={data.profile.avatar_url || "/media/profile/avatar.png"}
              alt="Sarthak Bhandari"
              width={620}
              height={620}
              priority
            />
            <div className="visual-label visual-label-top">
              <span>BASE</span>
              <strong>{data.profile.location ?? "Nepal"}</strong>
            </div>
            <div className="visual-label visual-label-bottom">
              <span>FOCUS</span>
              <strong>Software + Hardware</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section shell" id="about">
        <div className="about-grid">
          <div>
            <p className="eyebrow">Profile / 01</p>
            <h2 className="display-heading">
              Ideas become useful
              <span> through execution.</span>
            </h2>
          </div>
          <div className="about-copy">
            <p>
              I&apos;m {data.profile.full_name}, a technology enthusiast in{" "}
              {data.profile.location ?? "Nepal"}. My interests sit across
              software, hardware and the interfaces connecting them.
            </p>
            <dl className="identity-list">
              <div>
                <dt>Approach</dt>
                <dd>Explore → prototype → refine</dd>
              </div>
              <div>
                <dt>Current mode</dt>
                <dd>Learning through practical projects</dd>
              </div>
              <div>
                <dt>Primary tools</dt>
                <dd>Web, data, automation and physical computing</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="skills-grid">
          {data.skills.map((skill) => (
            <article className="skill-card" key={skill.id}>
              <div>
                <span className="skill-icon">{skill.icon ?? "—"}</span>
                <small>{skill.category ?? "Technology"}</small>
              </div>
              <h3>{skill.name}</h3>
              <div className="skill-meter" aria-label={`${skill.proficiency}% proficiency`}>
                <span style={{ width: `${skill.proficiency}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell" id="work">
        <SectionHeading
          section={data.sections.work}
          fallbackLabel="Selected Work"
          fallbackTitle="Featured Projects"
        />
        <div className="projects-grid">
          {data.projects.map((project, index) => (
            <article className="project-card" key={project.id}>
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
                  {project.live_url && project.live_url !== "#" ? (
                    <a href={project.live_url} target="_blank" rel="noreferrer">
                      Live project ↗
                    </a>
                  ) : null}
                  {project.github_url ? (
                    <a href={project.github_url} target="_blank" rel="noreferrer">
                      Source ↗
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell" id="capabilities">
        <SectionHeading
          section={data.sections.services}
          fallbackLabel="Capabilities"
          fallbackTitle="What I Build"
        />
        <div className="services-grid">
          {data.services.map((service) => (
            <article className="service-card" key={service.id}>
              <span className="service-index">{String(service.sort_order).padStart(2, "0")}</span>
              <div className="service-icon">{service.icon_text}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <a href={service.cta_url ?? "#contact"}>
                {service.cta_text ?? "Discuss project"} ↗
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell">
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
        <p>Software · Hardware · Interfaces</p>
        <a href="#home">Back to top ↑</a>
      </footer>
    </main>
  );
}

