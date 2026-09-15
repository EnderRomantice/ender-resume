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
    company: "42",
    domain: "AI hardware startup · accessibility, pet care & Alzheimer's care",
    role: "Full-Stack Engineer / Lead",
    dates: "Aug 2026 — Present",
    location: "Beijing · Remote",
    badge: "Current",
    logo: "/logos/42-ai.png",
    logoDark: true,
    bullets: [
      "Designed and built a desktop multi-agent workbench that separates conversation, planning, and tool execution. Parallel background tasks, mid-task instructions, and result reporting keep long-running work from blocking user interaction; delivered macOS and Windows alpha test builds.",
      "Built a TypeScript agent runtime with ordered per-session scheduling, parallel tools, and exclusive execution controls. Checkpoint reconciliation handles process interruptions and ambiguous database commits, restoring persisted results without automatically replaying operations with uncertain outcomes.",
      "Built a recruiting agent connecting document intake, candidate creation, and natural-language screening. Role-level and evidence-aware evaluation, server-recomputed scores, and evidence-based score caps constrain assessments; saved rationales and tool traces support recruiter review.",
    ],
  },
  {
    company: "Creatorone",
    domain: "AI-native TikTok Shop platform",
    role: "Full-Stack Developer",
    dates: "Feb 2026 — Jun 2026",
    location: "Seattle · Remote",
    badge: "Recent",
    logo: "/logos/creatorone.svg",
    logoDark: false,
    bullets: [
      "Contributed to the platform from the ground up across Next.js dashboards, NestJS APIs, authentication and authorization, API contracts, relational data models, and AI agent workflows.",
      "Implemented multi-page merchant workflows with internationalization, analytics, SWR and Zustand state management, reusable components, and detailed interaction states.",
      "Contributed to seller and creator automation workflows using system prompts, memory, and constrained tool calls, keeping model reasoning separate from backend permissions and data rules.",
    ],
  },
  {
    company: "XTrace",
    domain: "Silicon Valley AI memory startup",
    role: "Frontend Developer Intern",
    dates: "Dec 2025 — Feb 2026",
    location: "San Francisco · Remote",
    badge: null,
    logo: "/logos/xtrace.png",
    logoDark: true,
    bullets: [
      "Contributed to the Web Memory Hub and browser-extension interfaces, helping users manage and reuse memory across web-based AI agents.",
      "Supported cross-agent memory sharing through XTrace's MCP service for CLI agents and its browser extension for web-based AI tools.",
      "Worked across web UX, the Memory Hub, browser extension, MCP integration, and agent feature integration.",
    ],
  },
];

const OPEN_SOURCE = [
  {
    name: "react-bits",
    rank: "Long-standing Top 2 contributor · 10 merged PRs",
    desc: "Shipped components, API extensions, rendering improvements, and interaction fixes to a widely used React animation library.",
    href: "https://github.com/DavidHDev/react-bits",
    preview: "https://reactbits.dev/",
    previewImage: "/previews/react-bits.png",
    stars: "47.3k",
    contributions: [
      "Shipped the original Pixel Swap component.",
      "Extended the Lanyard and InfiniteMenu APIs.",
      "Reduced unnecessary rendering work in TextPressure, Shuffle, and AnimatedList.",
      "Diagnosed and fixed TextCursor interaction issues.",
    ],
  },
  {
    name: "vue-grab",
    rank: "Author · Maintainer",
    desc: "Built and maintain a Vue 3 element-grabbing tool that sends component context into AI coding workflows.",
    href: "https://github.com/EnderRomantice/vue-grab",
    preview: "https://vue-grab.vercel.app/",
    previewImage: "/previews/vue-grab.png",
    stars: "89",
    contributions: [
      "Built the project independently from architecture through release.",
      "Implemented component tracking, Shadow DOM overlays, hotkeys, and agent bridges.",
      "Own the API design, documentation, releases, and project direction.",
    ],
  },
  {
    name: "skill-npm",
    rank: "Contributor · 2 merged PRs",
    desc: "Improved an npm-based distribution tool for installing Agent Skills across coding agents.",
    href: "https://github.com/antfu/skills-npm",
    preview: "https://www.jsdelivr.com/package/npm/skills-npm",
    previewImage: "/previews/skills-npm.png",
    stars: "516",
    contributions: [
      "Added caching to reduce repeated work and improve perceived performance.",
      "Added warnings for invalid skills to make failures easier to diagnose.",
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
            I build <strong>AI-native products</strong> across Next.js, NestJS, and agent workflows,
            and contribute to open-source React / Vue tools used by other developers. I am a
            long-standing Top 2 contributor to React Bits.
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
