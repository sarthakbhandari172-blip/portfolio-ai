import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CV — Sarthak Bhandari",
  description: "Curriculum vitae of Sarthak Bhandari, graphic & digital designer in Kathmandu.",
};

const css = `
  .cv-root { background: #ECECEF; min-height: 100vh; padding: 32px 16px 64px; font-family: -apple-system, "Segoe UI", Arial, sans-serif; }
  .cv-sheet { max-width: 210mm; margin: 0 auto; background: #fff; color: #3c3c44; padding: 15mm 16mm 14mm; box-shadow: 0 2px 6px rgba(15,15,20,.1), 0 14px 40px rgba(15,15,20,.14); }
  .cv-name { font-size: 30pt; font-weight: 800; line-height: 1.02; color: #1b1b20; letter-spacing: -.015em; margin: 0; }
  .cv-role { font-weight: 700; font-size: 11pt; color: #0e6b60; margin: 2mm 0 0; }
  .cv-contact { margin: 3mm 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 1.6mm 5mm; font-size: 8pt; color: #71717b; font-family: ui-monospace, Menlo, monospace; }
  .cv-contact a { color: #3c3c44; text-decoration: none; }
  .cv-header { border-bottom: .5mm solid #1b1b20; padding-bottom: 5mm; }
  .cv-cols { display: grid; grid-template-columns: 1fr 58mm; gap: 0 9mm; margin-top: 7mm; }
  .cv-cols section { margin-bottom: 6.5mm; }
  .cv-cols h2 { font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: #1b1b20; margin: 0 0 2.8mm; display: flex; align-items: center; gap: 2.5mm; }
  .cv-cols h2::after { content: ""; flex: 1; border-top: 1px solid #dddde2; }
  .cv-entry { margin: 0 0 4.2mm; }
  .cv-entry .top { display: flex; align-items: baseline; gap: 3mm; }
  .cv-entry h3 { font-size: 10.3pt; color: #1b1b20; margin: 0; font-weight: 700; }
  .cv-entry .when { margin-left: auto; font-family: ui-monospace, Menlo, monospace; font-size: 7.4pt; color: #71717b; white-space: nowrap; }
  .cv-entry p { font-size: 9.3pt; line-height: 1.45; margin: 1mm 0 0; }
  .cv-note { font-weight: 500; color: #71717b; }
  .cv-lede { font-size: 9.6pt; line-height: 1.5; margin: 0; }
  .cv-rail dt { font-weight: 700; font-size: 8.4pt; color: #1b1b20; margin: 0 0 .8mm; }
  .cv-rail dd { font-size: 9pt; line-height: 1.5; margin: 0 0 3.2mm; }
  .cv-rail dl { margin: 0; }
  .cv-print-hint { max-width: 210mm; margin: 14px auto 0; font-size: 13px; color: #71717b; }
  @media (max-width: 860px) { .cv-cols { grid-template-columns: 1fr; } .cv-sheet { padding: 24px 20px; } }
  @page { size: A4; margin: 0; }
  @media print {
    .cv-root { background: #fff; padding: 0; }
    .cv-sheet { box-shadow: none; max-width: none; }
    .cv-print-hint { display: none; }
  }
`;

export default function CvPage() {
  return (
    <div className="cv-root">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="cv-sheet">
        <header className="cv-header">
          <h1 className="cv-name">Sarthak Bhandari</h1>
          <p className="cv-role">Graphic &amp; Digital Designer</p>
          <ul className="cv-contact">
            <li>Kathmandu, Nepal · remote-ready (UK-hours overlap)</li>
            <li><a href="mailto:sarthakbhandari172@gmail.com">sarthakbhandari172@gmail.com</a></li>
            <li>+977 9769291674</li>
            <li><a href="https://portfolio-ai-eta-kohl.vercel.app/">portfolio-ai-eta-kohl.vercel.app</a></li>
            <li><a href="https://www.linkedin.com/in/sarthak-bhandari-1303b0365/">linkedin.com/in/sarthak-bhandari</a></li>
          </ul>
        </header>

        <div className="cv-cols">
          <div>
            <section>
              <h2>Profile</h2>
              <p className="cv-lede">
                Graphic and digital designer with a developer&apos;s toolkit. I create brand, social and
                campaign visuals in Adobe Creative Cloud and Figma, retouch photography, and build
                responsive web experiences — I designed, coded and shipped my own portfolio platform
                end-to-end. Learning by making, managing my own deadlines, and caring about the details.
              </p>
            </section>

            <section>
              <h2>Selected work</h2>
              <div className="cv-entry">
                <div className="top"><h3>LEKH Trail Gear — brand identity &amp; merch <span className="cv-note">(self-initiated concept)</span></h3><span className="when">2026</span></div>
                <p>Fictional Kathmandu trekking-gear brand designed end to end: ridgeline logomark, palette and type system with Devanagari pairing, Instagram set, screen-print merch artwork, and companion-app UI from wireframes to hi-fi screens.</p>
              </div>
              <div className="cv-entry">
                <div className="top"><h3>Saath (साथ) — dementia-awareness campaign <span className="cv-note">(concept)</span></h3><span className="when">2026</span></div>
                <p>Two poster directions and a social adaptation: marigold memory metaphor, bilingual typography, and an accessible palette checked against WCAG contrast (12:1 body text).</p>
              </div>
              <div className="cv-entry">
                <div className="top"><h3>Portfolio Engine</h3><span className="when">2025 — present</span></div>
                <p>Designed and built a dynamic portfolio platform: layout and type system, responsive interface, and an authenticated content dashboard for updating work without touching code.</p>
              </div>
              <div className="cv-entry">
                <div className="top"><h3>Nine more projects</h3><span className="when">2026</span></div>
                <p>YouTube thumbnail system, fintech dashboard UI, logofolio, tea packaging, risograph gig poster, editorial cover &amp; spread and more — on the <a href="/#work">work grid</a>.</p>
              </div>
            </section>

            <section>
              <h2>Experience</h2>
              <div className="cv-entry">
                <div className="top"><h3>Independent Visual Designer — Freelance</h3><span className="when">2025 — present</span></div>
                <p>Brand identity concepts (logo exploration, typography, colour), social media and campaign-style assets, presentation decks and event visuals for self-initiated and small client briefs. Photo retouching in Photoshop and Lightroom; organised, print-ready file delivery. AI tools (Midjourney, Firefly) for ideation only — selection, compositing and refinement done by hand.</p>
              </div>
              <div className="cv-entry">
                <div className="top"><h3>Independent design &amp; development projects</h3><span className="when">2024 — present</span></div>
                <p>Self-initiated projects across web development — scoping the brief, designing, building and delivering to my own deadlines while studying full-time.</p>
              </div>
            </section>
          </div>

          <aside className="cv-rail">
            <section>
              <h2>Tools</h2>
              <dl>
                <dt>Design</dt>
                <dd>Photoshop · Illustrator · Lightroom · Figma · Canva · Premiere Pro · After Effects · InDesign (basics)</dd>
                <dt>AI-assisted</dt>
                <dd>Midjourney · Adobe Firefly · Canva AI — ideation only, finished by hand</dd>
                <dt>Code</dt>
                <dd>HTML &amp; CSS · JavaScript / TypeScript · Next.js · PHP · Python · Git &amp; GitHub</dd>
              </dl>
            </section>

            <section>
              <h2>Education</h2>
              <div className="cv-entry">
                <div className="top"><h3>BSc (Hons) Computer Science with Artificial Intelligence</h3></div>
                <p>Birmingham City University (UK) programme, delivered at Sunway College, Kathmandu. <span className="when">Oct 2024 — present · Year 2</span></p>
              </div>
            </section>

            <section>
              <h2>Certificates</h2>
              <dl><dd>Graphic Design Essentials — Canva Design School, Sept 2026 · ID 505afa</dd></dl>
            </section>

            <section>
              <h2>Languages</h2>
              <dl>
                <dd>English — professional (UK curriculum)</dd>
                <dd>Nepali — native</dd>
                <dd>Hindi — conversational</dd>
              </dl>
            </section>

            <section>
              <h2>How I work</h2>
              <dl>
                <dd>Explore → prototype → refine. I ask early when unsure, keep files organised and named properly, and treat every export like someone else has to open it next.</dd>
              </dl>
            </section>
          </aside>
        </div>
      </div>
      <p className="cv-print-hint">To save as PDF: press Ctrl/Cmd&nbsp;+&nbsp;P → Save as PDF → A4, margins none, background graphics on.</p>
    </div>
  );
}
