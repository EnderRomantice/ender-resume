import Image from "next/image";
import ChengduMap from "@/components/ChengduMap/ChengduMap";
import styles from "./page.module.css";

const EMAIL = "enderromantic@gmail.com";
const GITHUB = "https://github.com/EnderRomantice";

const EXPERIENCE = [
  {
    company: "Creatorone",
    domain: "TikTok Shop ToB SaaS",
    role: "Full-Stack Developer",
    dates: "Feb 2026 — Present",
    location: "North America · Remote",
    badge: "Current",
    logo: "/logos/creatorone.svg",
    logoDark: false,
    bullets: [
      "Building an enterprise SaaS platform end to end — owning features across the Next.js frontend and the Node.js service layer.",
      "Designing reusable UI systems and API contracts that keep the product consistent as it scales.",
      "Shipping production code across the full stack, from data modeling to pixel-level interface polish.",
    ],
  },
  {
    company: "XTrace",
    domain: "AI memory",
    role: "Frontend Developer",
    dates: "Dec 2025 — Feb 2026",
    location: "North America · Remote",
    badge: null,
    logo: "/logos/xtrace.png",
    logoDark: true,
    bullets: [
      "Built and shipped responsive, interactive UI features for the product's web client.",
      "Contributed to the shared component library, improving consistency and developer velocity.",
      "Collaborated closely with design to translate mockups into polished, accessible interfaces.",
    ],
  },
];

const OPEN_SOURCE = [
  {
    name: "react-bits",
    rank: "Top 2 Contributor",
    desc: "An open-source library of animated, production-ready React components used by thousands of developers.",
    href: "https://github.com/DavidHDev/react-bits",
    label: "github.com/DavidHDev/react-bits",
  },
  {
    name: "vue-grab",
    rank: "Project Leader",
    desc: "Lead maintainer driving direction, architecture, and releases for the project and its community.",
    href: "https://github.com/EnderRomantice/vue-grab",
    label: "github.com/EnderRomantice/vue-grab",
  },
  {
    name: "skill-npm",
    rank: "Top 4 Contributor",
    desc: "Core contributor to a developer-tooling package in the npm ecosystem.",
    href: "https://github.com/antfu/skills-npm",
    label: "github.com/antfu/skills-npm",
  },
];

const SKILLS = [
  "TypeScript",
  "React",
  "Next.js",
  "Vue",
  "Node.js",
  "Three.js / R3F",
  "Tailwind CSS",
  "REST / API design",
  "PostgreSQL",
  "Git",
  "UI / Interaction Design",
];

const GmailIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
  </svg>
);

const GitHubIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 6.844c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

export default function Home() {
  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <a href="#" className={styles.brand} aria-label="Ender — home">
            <Image src="/ender.jpg" alt="Ender" width={36} height={36} className={styles.brandAvatar} />
          </a>
          <div className={styles.navLinks}>
            <a href="#experience">Experience</a>
            <a href="#open-source">Open Source</a>
            <a href="#skills">Skills</a>
            <span className={styles.navIcons}>
              <a className={styles.iconLink} href={`mailto:${EMAIL}`} aria-label="Email Ender">
                {GmailIcon}
              </a>
              <a className={styles.iconLink} href={GITHUB} target="_blank" rel="noreferrer" aria-label="GitHub">
                {GitHubIcon}
              </a>
            </span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.heroLeft}>
          <p className={styles.eyebrow}>Full-Stack Developer</p>
          <h1 className={styles.name}>Hi, this is Ender</h1>
          <p className={styles.lede}>
            Born in <strong>Nanchong, Sichuan</strong>, now based in <strong>Chengdu</strong>. I love
            building front-end experiences that feel both breathtaking and genuinely usable. That may
            sound a little contradictory, but it is exactly the goal I keep working toward.
          </p>
          <p className={styles.lede}>
            I am also into rock music and fashion. Every now and then, I work as a photographer and
            model, and I maintain my own social media presence.
          </p>
          <p className={styles.lede}>
            If you would like to grab coffee and talk about your life, open source, or anything else,
            I would be glad to. Just reach me by email.
          </p>
        </div>

        <div className={styles.heroRight}>
          <ChengduMap />
        </div>
      </header>

      <main className={styles.container}>
        {/* Experience */}
        <section id="experience" className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIndex}>01</span>
            <h2 className={styles.sectionTitle}>Experience</h2>
          </div>

          {EXPERIENCE.map((job) => (
            <article key={job.company} className={styles.role}>
              <aside className={styles.roleAside}>
                <div className={`${styles.logoBox} ${job.logoDark ? styles.logoBoxDark : ""}`}>
                  <Image src={job.logo} alt={`${job.company} logo`} width={30} height={30} />
                </div>
                <span className={styles.roleDates}>{job.dates}</span>
                <span className={styles.roleLocation}>{job.location}</span>
              </aside>
              <div className={styles.roleBody}>
                <h3>{job.role}</h3>
                <p className={styles.roleCompany}>
                  {job.company}
                  {job.badge && <span className={styles.badge}>{job.badge}</span>}
                </p>
                <p className={styles.roleDomain}>{job.domain}</p>
                <ul className={styles.bullets}>
                  {job.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>

        {/* Open source */}
        <section id="open-source" className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIndex}>02</span>
            <h2 className={styles.sectionTitle}>Open Source</h2>
          </div>

          <div className={styles.osGrid}>
            {OPEN_SOURCE.map((p) => (
              <a
                key={p.name}
                className={styles.osCard}
                href={p.href}
                target={p.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
              >
                <span className={styles.osRank}>{p.rank}</span>
                <span className={styles.osName}>{p.name}</span>
                <span className={styles.osDesc}>{p.desc}</span>
                <span className={styles.osLink}>
                  {p.label} <span>→</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section id="skills" className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIndex}>03</span>
            <h2 className={styles.sectionTitle}>Skills &amp; Tools</h2>
          </div>
          <div className={styles.skills}>
            {SKILLS.map((s) => (
              <span key={s} className={styles.skill}>
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <span className={styles.footerNote}>© 2026 Ender — built with Next.js &amp; React Bits</span>
          <div className={styles.footerLinks}>
            <a href={`mailto:${EMAIL}`}>Email</a>
            <a href={GITHUB} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
