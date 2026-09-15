'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import type { GitHubPortfolioData } from '@/lib/github-portfolio-types';
import { isGitHubPortfolioData } from '@/lib/github-portfolio-validation';
import { rankGitHubProjects } from '@/lib/github-ranking';
import ContributionHeatmap from './ContributionHeatmap';
import styles from './OpenSourceGrid.module.css';

const compactNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

const GitHubIcon = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 6.844c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);
const StarIcon = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.4l-5.6 3 1.1-6.3L3 9.6l6.2-.9L12 3Z" /></svg>;

export default function OpenSourceGrid({ initialData }: { initialData: GitHubPortfolioData }) {
  const [data, setData] = useState(initialData);
  const [rankingOpen, setRankingOpen] = useState(false);
  const rankingPanelId = useId();
  const ranked = useMemo(() => rankGitHubProjects(data.repositories.filter((project) =>
    project.stars >= 50 &&
    project.contributions >= 20 &&
    project.contributorRank !== null && project.contributorRank <= 5
  )), [data.repositories]);
  const projects = ranked.slice(0, 5);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/github', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const next: unknown = await response.json();
        if (!controller.signal.aborted && isGitHubPortfolioData(next) &&
          next.username === initialData.username &&
          Date.parse(next.updatedAt) > Date.parse(initialData.updatedAt)) setData(next);
      })
      .catch(() => { /* The verified snapshot remains available offline. */ });
    return () => controller.abort();
  }, [initialData.username, initialData.updatedAt]);

  return (
    <div className={styles.portfolio}>
      <div className={styles.overview}>
        <a href={`https://github.com/${data.username}`} target="_blank" rel="noreferrer">
          <span className={styles.profileName}>@{data.username}</span>
          <span className={styles.profileArrow} aria-hidden="true">↗</span>
        </a>
        <span>Updated <time dateTime={data.updatedAt}>{dateFormat.format(new Date(data.updatedAt))}</time></span>
      </div>

      <div className={styles.projectViewport} role="region" aria-label="Contributed projects, sorted by contributor rank and stars" tabIndex={0}>
        <ol className={styles.grid}>
          {projects.map((project) => (
            <li key={project.id}>
              <a className={styles.project} href={project.url} target="_blank" rel="noreferrer" aria-label={`${project.fullName} on GitHub`}>
                <div className={styles.identity}>
                  <span className={styles.repoIcon}>{GitHubIcon}</span>
                  <div className={styles.identityText}>
                    <span className={styles.owner}>{project.fullName.split('/')[0]}</span>
                    <h3 className={styles.name} title={project.name}>{project.name}</h3>
                  </div>
                  <span className={styles.arrow} aria-hidden="true">↗</span>
                </div>
                <p className={styles.description}>{project.description || (project.isOwner ? 'An open-source project I maintain.' : 'An open-source project I contribute to.')}</p>
                <div className={styles.stats}>
                  <span title={`${project.stars.toLocaleString('en')} stars`} aria-label={`${project.stars} stars`}>{StarIcon}{compactNumber.format(project.stars)}</span>
                  <span title={project.contributorRank ? `#${project.contributorRank} in GitHub’s commit contributor list` : 'No commit contributor rank available from GitHub'}>
                    {project.contributorRank ? `#${project.contributorRank}` : null}
                    <span className={styles.statLabel}>{project.contributorRank ? 'contributor' : 'Contributor'}</span>
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.gridFooter}>
        <span>{projects.length < ranked.length ? `Top ${projects.length} of ${ranked.length} contributed projects` : `${projects.length} contributed projects`} · 50+ stars</span>
        <div className={`${styles.rankingNote} ${styles['t-acc']}`} data-open={rankingOpen}>
          <button
            type="button"
            className={styles.rankingTrigger}
            aria-expanded={rankingOpen}
            aria-controls={rankingPanelId}
            onClick={() => setRankingOpen((open) => !open)}
          >
            <span className={styles['t-acc-chevron']} aria-hidden="true">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6.5L8 10.5L12 6.5" /></svg>
            </span>
            Contributor rank + stars
          </button>
          <div id={rankingPanelId} className={styles['t-acc-panel']} aria-hidden={!rankingOpen} inert={!rankingOpen}>
            <div className={styles['t-acc-panel-inner']}>
              <p>Shown projects have at least 50 stars, 20 of my commits, and a top-five contributor rank. Contributor rank and stars each carry 50%. A higher position in GitHub’s commit contributor list scores better (1 ÷ rank). Stars use a logarithmic scale.</p>
            </div>
          </div>
        </div>
      </div>

      <ContributionHeatmap calendar={data.calendar} />
    </div>
  );
}
