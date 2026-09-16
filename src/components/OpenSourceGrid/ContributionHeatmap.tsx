'use client';

import { useEffect, useId, useMemo, useRef, type CSSProperties } from 'react';
import type { GitHubCalendar } from '@/lib/github-portfolio-types';
import styles from './ContributionHeatmap.module.css';

const CELL_SIZE = 12;
const CELL_STEP = 15;
const LEFT_LABEL_WIDTH = 32;
const TOP_LABEL_HEIGHT = 23;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LEVELS = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'] as const;
const dateLabel = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const rangeLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

function asDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

export default function ContributionHeatmap({ calendar }: { calendar: GitHubCalendar }) {
  const figureRef = useRef<HTMLElement>(null);
  const hasRevealedRef = useRef(false);
  const descriptionId = useId();
  const weeks = useMemo(() => calendar.weeks
    .map(week => [...week.contributionDays].sort((a, b) => a.date.localeCompare(b.date)))
    .filter(days => days.length > 0)
    .sort((a, b) => a[0].date.localeCompare(b[0].date)), [calendar.weeks]);
  const firstDay = weeks[0]?.[0];
  const lastWeek = weeks.at(-1);
  const lastDay = lastWeek?.at(-1);
  const total = calendar.totalContributions.toLocaleString('en-US');
  const graphWidth = LEFT_LABEL_WIDTH + weeks.length * CELL_STEP - (CELL_STEP - CELL_SIZE);
  const graphHeight = TOP_LABEL_HEIGHT + 7 * CELL_STEP;
  const months = weeks.flatMap((days, index) => {
    const firstOfMonth = days.find(day => day.date.endsWith('-01'));
    const day = firstOfMonth ?? (index === 0 ? days[0] : undefined);
    if (!day || index > weeks.length - 3) return [];
    return [{ index, label: MONTHS[asDate(day.date).getUTCMonth()] }];
  }).filter((month, index, labels) => index !== 0 || labels.length === 1 || labels[1].index - month.index >= 3);

  useEffect(() => {
    const figure = figureRef.current;
    if (!figure || hasRevealedRef.current || weeks.length === 0 || typeof IntersectionObserver === 'undefined') return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) {
      hasRevealedRef.current = true;
      return;
    }

    // Server-rendered data is visible without JavaScript. Only prepare an
    // offscreen chart, so hydration never hides a chart already being read.
    const rect = figure.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      hasRevealedRef.current = true;
      return;
    }
    figure.dataset.reveal = 'pending';

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      hasRevealedRef.current = true;
      figure.dataset.reveal = 'shown';
      observer.disconnect();
    }, { threshold: 0.12 });
    observer.observe(figure);

    const finish = (event: AnimationEvent) => {
      if (!(event.target instanceof SVGElement) || event.target.dataset.revealEnd !== 'true') return;
      // Release the finished animations instead of retaining composited layers.
      figure.dataset.reveal = 'complete';
    };
    const reduceMotion = () => {
      if (!motion.matches) return;
      hasRevealedRef.current = true;
      figure.dataset.reveal = 'complete';
      observer.disconnect();
    };
    figure.addEventListener('animationend', finish);
    motion.addEventListener('change', reduceMotion);

    return () => {
      observer.disconnect();
      figure.removeEventListener('animationend', finish);
      motion.removeEventListener('change', reduceMotion);
      delete figure.dataset.reveal;
    };
  }, [weeks.length]);

  return (
    <figure ref={figureRef} className={styles.heatmap}>
      <figcaption className={styles.caption}>
        <strong>{total}</strong> contributions in the last year
      </figcaption>

      {firstDay && lastDay ? (
        <>
          <div className={styles.scroll} tabIndex={0} role="region" aria-label="GitHub contribution calendar; scroll horizontally on small screens">
            <svg
              className={styles.graph}
              viewBox={`0 0 ${graphWidth} ${graphHeight}`}
              role="img"
              aria-labelledby={`${descriptionId}-title ${descriptionId}-description`}
            >
              <title id={`${descriptionId}-title`}>GitHub contribution calendar</title>
              <desc id={`${descriptionId}-description`}>
                {`${total} contributions from ${dateLabel.format(asDate(firstDay.date))} to ${dateLabel.format(asDate(lastDay.date))}. Each column is one week, running from Sunday at the top to Saturday at the bottom. Darker squares indicate more contributions.`}
              </desc>
              <g className={styles.axis} aria-hidden="true">
                {months.map(month => (
                  <text key={month.index} x={LEFT_LABEL_WIDTH + month.index * CELL_STEP} y={11}>{month.label}</text>
                ))}
                {[[1, 'Mon'], [3, 'Wed'], [5, 'Fri']].map(([weekday, label]) => (
                  <text key={weekday} x={0} y={TOP_LABEL_HEIGHT + Number(weekday) * CELL_STEP + CELL_SIZE - 2}>{label}</text>
                ))}
              </g>
              {weeks.map((days, index) => (
                <g
                  key={days[0].date}
                  style={{ '--week-index': index } as CSSProperties}
                >
                  {days.map(day => (
                    <g key={day.date}>
                      <title>{`${day.contributionCount.toLocaleString('en-US')} ${day.contributionCount === 1 ? 'contribution' : 'contributions'} on ${dateLabel.format(asDate(day.date))}`}</title>
                      <rect
                        className={styles.cellBase}
                        x={LEFT_LABEL_WIDTH + index * CELL_STEP}
                        y={TOP_LABEL_HEIGHT + day.weekday * CELL_STEP}
                        width={CELL_SIZE}
                        height={CELL_SIZE}
                        rx={1.5}
                      />
                      <rect
                        className={styles.cell}
                        data-level={day.contributionLevel}
                        data-reveal-end={day === lastDay ? 'true' : undefined}
                        x={LEFT_LABEL_WIDTH + index * CELL_STEP}
                        y={TOP_LABEL_HEIGHT + day.weekday * CELL_STEP}
                        width={CELL_SIZE}
                        height={CELL_SIZE}
                        rx={1.5}
                      />
                    </g>
                  ))}
                </g>
              ))}
            </svg>
          </div>
          <div className={styles.footer}>
            <span>{rangeLabel.format(asDate(firstDay.date))} — {rangeLabel.format(asDate(lastDay.date))}</span>
            <div className={styles.legend} aria-label="Contribution intensity, from less to more">
              <span>Less</span>
              {LEVELS.map(level => <i key={level} className={styles.swatch} data-level={level} aria-hidden="true" />)}
              <span>More</span>
            </div>
          </div>
        </>
      ) : <p className={styles.empty}>Contribution history is unavailable.</p>}
    </figure>
  );
}
