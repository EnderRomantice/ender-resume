import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Wayline — Operational Workflow Systems",
  description: "Reliable execution layers across email, documents, portals, and systems of record. One workflow. Clear criteria. Real evidence.",
};

const steps = [
  ["Capture", "Bring email, documents, portals, and system events into one traceable flow."],
  ["Validate", "Extract fields, apply rules, and surface missing or conflicting data early."],
  ["Execute", "Move work across the existing stack via APIs, integrations, or browser control."],
  ["Escalate", "Route low-confidence cases and high-impact actions to the right person."],
  ["Observe", "Record status, decisions, retries, and recovery — visible and supportable."],
];

const gaps = [
  ["Information arrives in the wrong shape", "Orders, certificates, invoices, and delivery proofs arrive as email, PDFs, spreadsheets, or portal downloads."],
  ["Staff bridge disconnected tools", "Teams re-key fields, check statuses, and reconcile records across systems never designed to work together."],
  ["Exceptions stop simple automation", "Missing data, conflicting rules, and sensitive actions create edge cases brittle scripts cannot safely resolve."],
  ["Growth creates more coordination", "Volume outpaces process visibility. The default answer becomes more headcount and more operational risk."],
];

const useCases = [
  ["Independent insurance", "Renewals and carrier portals", "Collect renewal information, coordinate portal work, update agency systems, and return approvals to licensed staff."],
  ["Wholesale distribution", "Email or PDF orders to ERP", "Extract orders, check required fields, validate pricing or inventory, and route exceptions before entry."],
  ["Property operations", "Invoices and work orders", "Connect incoming invoices, contracts, work orders, and approvals with an auditable trail."],
  ["Freight brokerage", "Proof of delivery to billing", "Capture documents, verify shipment details, update transportation systems, and prepare billing packets."],
];

const engagement = [
  ["Discover", "Bring one painful workflow", "A 30–45 minute session maps handoffs, systems, exceptions, and cost of delay."],
  ["Define", "Set a narrow pilot", "Agree on scope, access, checkpoints, and success criteria before building."],
  ["Deliver", "Build, observe, decide", "Deliver the workflow, monitor real use, then expand, refine, or stop."],
];

const contact = "mailto:ender@singlebase.co?subject=Wayline%20discovery%20call";

export default function WaylinePage() {
  return (
    <div className={styles.page}>
      <a href="#main" className={styles.skip}>Skip to content</a>
      <header className={styles.header}>
        <Link href="/wayline" className={styles.wordmark} aria-label="Wayline home">WAYLINE<span aria-hidden="true">↗</span></Link>
        <nav aria-label="Wayline navigation">
          <Link href="/">Back to Ender</Link>
          <a href="#contact">Let’s talk <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <main id="main">
        <section className={styles.hero} aria-labelledby="hero-title">
          <p className={styles.eyebrow}>Operational workflow systems</p>
          <h1 id="hero-title">The operational<br className={styles.desktopBreak} /> last mile should not run on <em>copy-and-paste.</em></h1>
          <p className={styles.intro}>We build reliable execution layers across email, documents, portals, and systems of record — without forcing a core-system replacement.</p>
          <div className={styles.heroActions}>
            <a className={styles.button} href="#contact">Bring us one workflow <span aria-hidden="true">↗</span></a>
            <a className={styles.textLink} href="#approach">See how it works <span aria-hidden="true">↓</span></a>
          </div>
          <div className={styles.summary}>
            <div><span>01 / INPUT</span><h2>From fragmented inputs</h2><p>Email, PDFs, spreadsheets, and portals.</p></div>
            <div><span>02 / CONTROL</span><h2>Through exceptions</h2><p>Rules, retries, and human review.</p></div>
            <div><span>03 / OUTCOME</span><h2>To completed work</h2><p>Visible, auditable, and recoverable.</p></div>
          </div>
        </section>

        <section className={styles.section} id="approach" aria-labelledby="gap-title">
          <div className={styles.sectionLabel}><span>01 / The execution layer</span><span>Built around your existing stack</span></div>
          <h2 id="gap-title">The gap is usually <em>between</em> systems, not inside them.</h2>
          <p className={styles.sectionIntro}>Core software stores the record. The work around it still moves through inboxes, files, browser tabs, and people who know the unwritten rules.</p>
          <div className={styles.grid}>
            {gaps.map(([title, description]) => <article className={styles.item} key={title}><h3>{title}</h3><p>{description}</p></article>)}
          </div>
          <aside className={styles.callout}><span>A strong candidate</span><p>A recurring workflow that crosses multiple systems, contains real exceptions, and costs money when it is slow or wrong.</p></aside>
          <div className={styles.workflow}>
            <h3 className={styles.eyebrow}>One controlled workflow, from intake to completion</h3>
            <ol className={styles.steps}>
              {steps.map(([title, description], index) => <li key={title}><span className={styles.stepNumber}>{index + 1}</span><h4>{title}</h4><p>{description}</p></li>)}
            </ol>
            <p className={styles.humanNote}><strong>Human-in-the-loop by design.</strong> People stay in control where judgment or accountability matters. Delivered end to end — product, integrations, deployment — and designed to become repeatable.</p>
          </div>
          <p className={styles.signoff}>Deterministic where possible. Agentic where useful.</p>
        </section>

        <section className={`${styles.section} ${styles.useCases}`} aria-labelledby="fit-title">
          <div className={styles.sectionLabel}><span>02 / Where it fits</span><span>Real operations. Real exceptions.</span></div>
          <h2 id="fit-title">Repetitive, cross-system work full of <em>real exceptions.</em></h2>
          <div className={styles.grid}>
            {useCases.map(([industry, title, description]) => <article className={styles.item} key={industry}><span className={styles.tag}>{industry}</span><h3>{title}</h3><p>{description}</p></article>)}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="engage-title">
          <div className={styles.sectionLabel}><span>03 / How we engage</span><span>Small scope. Measurable progress.</span></div>
          <h2 id="engage-title">Start narrow. Prove value.<br /><em>Expand with evidence.</em></h2>
          <div className={styles.engagement}>
            {engagement.map(([label, title, description], index) => <article key={label}><span className={styles.eyebrow}>0{index + 1} / {label}</span><h3>{title}</h3><p>{description}</p></article>)}
          </div>
          <div className={styles.details}>
            <blockquote>“Show us the workflow that makes your best people babysit software.”</blockquote>
            <div><h3>Engagement model</h3><p>Scoped paid pilot, followed by implementation and support where results justify it.</p><h3>Availability</h3><p>Client conversations and support during normal US business hours.</p></div>
          </div>
          <div className={styles.contact} id="contact">
            <div><p className={styles.eyebrow}>Let’s make one workflow measurably better.</p><a className={styles.email} href="mailto:ender@singlebase.co">ender@singlebase.co</a></div>
            <a className={styles.contactButton} href={contact}>Discuss a pilot <span aria-hidden="true">↗</span></a>
          </div>
        </section>
      </main>
      <footer className={styles.footer}><span className={styles.wordmark}>WAYLINE</span><p>One workflow. Clear criteria. Real evidence.</p><Link href="/">Back to Ender <span aria-hidden="true">↗</span></Link></footer>
    </div>
  );
}
