import Image from "next/image";
import PageParticleScroll from "@/components/PageParticleScroll/PageParticleScroll";
import PortfolioAgent from "@/components/PortfolioAgent/PortfolioAgent";
import GlobalLanyard from "@/components/Lanyard/GlobalLanyard";
import OpenSourceStack from "@/components/OpenSourceStack/OpenSourceStack";
import styles from "./page.module.css";

const EMAIL = "enderromantic@gmail.com";
const GITHUB = "https://github.com/EnderRomantice";

const EXPERIENCE = [
  {
    company: "Creatorone",
    domain: "AI-native TikTok Shop platform",
    role: "Full-Stack Developer",
    dates: "Feb 2026 — Jun 2026",
    location: "North America · Remote",
    badge: "Recent",
    logo: "/logos/creatorone.svg",
    logoDark: false,
    bullets: [
      "Built an AI-native TikTok Shop platform from 0 to 1, covering frontend architecture, backend APIs, authentication, authorization, database schema design, and AI agent workflows.",
      "Developed multi-page business dashboard flows with internationalization, analytics tracking, state management, reusable business components, and polished interaction details.",
      "Designed backend routing, auth flows, access-control logic, API contracts, and relational data models for secure multi-user business operations.",
      "Orchestrated AI agent workflows with system prompts, memory, tool calling, and task execution for TikTok Shop seller and creator automation scenarios.",
    ],
  },
  {
    company: "XTrace",
    domain: "Silicon Valley AI memory startup",
    role: "Frontend Developer Intern",
    dates: "Dec 2025 — Feb 2026",
    location: "North America · Remote",
    badge: null,
    logo: "/logos/xtrace.png",
    logoDark: true,
    bullets: [
      "Designed and implemented user interfaces for a focused AI memory product, improving usability, interaction clarity, and the overall web experience.",
      "Built the web Memory Hub and browser-extension experiences that let users manage and reuse memory across AI agents.",
      "Supported cross-agent memory sharing through XTrace's MCP service for CLI agents and its browser extension for web-based AI tools.",
      "Contributed across the complete product flow, including web UX, Memory Hub, browser extension, MCP integration, and agent-feature coordination.",
    ],
  },
];

const OPEN_SOURCE = [
  {
    name: "react-bits",
    rank: "Top 2 Contributor",
    desc: "Contributed animation components, examples, fixes, and DX improvements to a widely used React animation library.",
    href: "https://github.com/DavidHDev/react-bits",
    preview: "https://reactbits.dev/",
    previewImage: "/previews/react-bits.png",
    stars: "42.4k",
    contributions: [
      "Maintained and refined the existing component library.",
      "Expanded component APIs and improved prop design for greater flexibility.",
      "Reproduced, diagnosed, and resolved component and interaction bugs.",
      "Strengthened the project architecture and developer workflow.",
      "Designed and shipped original components from concept to release.",
    ],
  },
  {
    name: "vue-grab",
    rank: "Project Leader",
    desc: "Led project direction, component API design, examples, issue triage, and release maintenance for Vue drag interactions.",
    href: "https://github.com/EnderRomantice/vue-grab",
    preview: "https://vue-grab.vercel.app/",
    previewImage: "/previews/vue-grab.png",
    stars: "88",
    contributions: [
      "Built and maintained the project independently from zero to one.",
      "Owned the complete architecture, from the core agent system through the framework adaptation layer.",
      "Led ongoing API design, documentation, releases, and project direction.",
    ],
  },
  {
    name: "skill-npm",
    rank: "Top 4 Contributor",
    desc: "Improved developer-tooling workflows, package behavior, documentation, and contributor experience in the npm ecosystem.",
    href: "https://github.com/antfu/skills-npm",
    preview: "https://www.jsdelivr.com/package/npm/skills-npm",
    previewImage: "/previews/skills-npm.png",
    stars: "479",
    contributions: [
      "Improved the early-stage codebase and helped shape its foundational architecture.",
      "Introduced new capabilities and streamlined key developer workflows.",
      "Contributed during the project’s formative stage; no longer actively involved in maintenance.",
    ],
  },
];

const SKILL_GROUPS = [
  {
    group: "Frontend",
    skills: ["TypeScript", "React", "Next.js", "Vue", "Astro", "Tailwind CSS", "R3F / Three.js"],
  },
  {
    group: "Backend",
    skills: ["Node.js", "NestJS", "REST API Design", "PostgreSQL", "Vercel", "AWS"],
  },
  {
    group: "AI / Agent",
    skills: ["Harness", "Context Engineering", "Prompt Engineering", "Agent Loop", "Memory", "MCP", "ACP", "RAG"],
  },
  {
    group: "Product",
    skills: ["AI-native Products", "Analytics Tracking", "Internationalization", "UI / Interaction Design"],
  },
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

      <PageParticleScroll>
        {/* Hero */}
        <header className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.name}>Ender Romantice</h1>
          <p className={styles.lede}>
            I build <strong>AI-native products</strong>, full-stack systems, open-source React / Vue
            tools, and polished web experiences that stay useful after the first impression.
          </p>
          <p className={styles.personalNote}>
            Based in Chengdu. Also into rock music, fashion, photography, modeling, coffee, and
            conversations that wander somewhere interesting.
          </p>
        </div>

        <div className={styles.heroRight}>
          <PortfolioAgent />
        </div>
        </header>

        <main className={styles.container}>
        {/* Experience */}
        <section id="experience" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Experience</h2>
          </div>

          {EXPERIENCE.map((job, index) => (
            <article key={job.company} className={`${styles.role} ${index === 0 ? styles.lanyardRole : ""}`}>
              {index === 0 && <GlobalLanyard />}
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
        <section id="open-source" className={`${styles.section} ${styles.openSourceSection}`}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Open Source</h2>
          </div>

          <OpenSourceStack projects={OPEN_SOURCE} />
        </section>

        {/* Skills */}
        <section id="skills" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Skills &amp; Tools</h2>
          </div>
          <div className={styles.skillGroups}>
            {SKILL_GROUPS.map((group) => (
              <div key={group.group} className={styles.skillGroup}>
                <h3>{group.group}</h3>
                <div className={styles.skills}>
                  {group.skills.map((s) => (
                    <span key={s} className={styles.skill}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
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
      </PageParticleScroll>
    </div>
  );
}
