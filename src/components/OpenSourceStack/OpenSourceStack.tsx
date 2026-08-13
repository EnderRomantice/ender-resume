"use client";

import Image from "next/image";
import CardSwap, { Card } from "./CardSwap";
import styles from "./OpenSourceStack.module.css";

export type OpenSourceProject = {
  name: string;
  rank: string;
  desc: string;
  href: string;
  preview: string;
  previewImage: string;
  stars: string;
  contributions: string[];
};

const GitHubIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 6.844c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>;
const StarIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.25 2.91 5.9 6.51.95-4.71 4.59 1.11 6.48L12 17.11l-5.82 3.06 1.11-6.48L2.58 9.1l6.51-.95L12 2.25z" /></svg>;

export default function OpenSourceStack({ projects }: { projects: OpenSourceProject[] }) {
  return (
    <div className={styles.stack}>
      <CardSwap width="calc(100% - 120px)" height={440} cardDistance={60} verticalDistance={60} delay={5000} skewAmount={2} easing="elastic">
        {projects.map((project, index) => (
          <Card key={project.name} customClass={styles.card} role="article">
            <div className={styles.tab}><span>{project.name}</span><span>{String(index + 1).padStart(2, "0")}</span></div>
            <div className={styles.sheet}>
              <a className={styles.preview} href={project.preview} target="_blank" rel="noreferrer" aria-label={`Open ${project.name} website`}>
                <Image src={project.previewImage} alt={`${project.name} website preview`} fill sizes="(max-width: 860px) 86vw, 760px" />
              </a>
              <div className={styles.content}>
                <div className={styles.top}><span className={styles.rank}>{project.rank}</span><a className={styles.github} href={project.href} target="_blank" rel="noreferrer" aria-label={`Open ${project.name} on GitHub`}>{GitHubIcon}</a></div>
                <span className={styles.name}>{project.name}</span>
                <span className={styles.desc}>{project.desc}</span>
                <div className={styles.contributionBlock}>
                  <span className={styles.contributionLabel}>What I contributed</span>
                  <ul className={styles.contributions}>
                    {project.contributions.map((contribution) => <li key={contribution}>{contribution}</li>)}
                  </ul>
                </div>
                <span className={styles.meta}>{StarIcon}{project.stars}</span>
              </div>
            </div>
          </Card>
        ))}
      </CardSwap>
    </div>
  );
}
