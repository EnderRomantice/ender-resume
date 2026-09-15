import type { GitHubPortfolioData } from './github-portfolio-types';

const CONTRIBUTION_LEVELS = new Set([
  'NONE',
  'FIRST_QUARTILE',
  'SECOND_QUARTILE',
  'THIRD_QUARTILE',
  'FOURTH_QUARTILE',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isNullableText(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  return Boolean(match && isCalendarDate(match[1]) &&
    Number(match[2]) < 24 && Number(match[3]) < 60 && Number(match[4]) < 60 &&
    (match[5] === undefined || (Number(match[5]) < 24 && Number(match[6]) < 60)) &&
    Number.isFinite(Date.parse(value)));
}

function isRepository(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value) || !isText(value.id) || !isText(value.name) ||
    !isText(value.fullName) || !/^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(value.fullName) ||
    value.fullName.split('/')[1] !== value.name || !isText(value.url) ||
    !isNullableText(value.description) || !isNullableText(value.language) ||
    typeof value.isOwner !== 'boolean' || !isCount(value.stars) ||
    !isCount(value.contributions) || !isCount(value.totalCommits) ||
    value.contributions > value.totalCommits ||
    !(value.contributorRank === null || (isCount(value.contributorRank) && value.contributorRank > 0))) {
    return false;
  }

  try {
    const url = new URL(value.url);
    return url.protocol === 'https:' && url.hostname === 'github.com' && url.port === '' &&
      url.username === '' && url.password === '' && url.search === '' && url.hash === '' &&
      url.pathname === `/${value.fullName}`;
  } catch {
    return false;
  }
}

function isCalendar(value: unknown): boolean {
  if (!isRecord(value) || !isCount(value.totalContributions) || !Array.isArray(value.weeks)) return false;

  const dates = new Set<string>();
  let total = 0;
  for (const week of value.weeks) {
    if (!isRecord(week) || !Array.isArray(week.contributionDays) || week.contributionDays.length > 7) return false;
    for (const day of week.contributionDays) {
      if (!isRecord(day) || !isCalendarDate(day.date) || dates.has(day.date) ||
        !isCount(day.contributionCount) || typeof day.contributionLevel !== 'string' ||
        !CONTRIBUTION_LEVELS.has(day.contributionLevel) || !isCount(day.weekday) || day.weekday > 6 ||
        new Date(`${day.date}T00:00:00Z`).getUTCDay() !== day.weekday) return false;
      dates.add(day.date);
      total += day.contributionCount;
      if (!Number.isSafeInteger(total)) return false;
    }
  }
  return total === value.totalContributions;
}

/** Validate untrusted API/cache data before replacing the readable snapshot. */
export function isGitHubPortfolioData(value: unknown): value is GitHubPortfolioData {
  if (!isRecord(value) || !isText(value.username) || !/^[A-Za-z0-9-]+$/.test(value.username) ||
    !isTimestamp(value.updatedAt) || !Array.isArray(value.repositories) || !isCalendar(value.calendar)) return false;

  const ids = new Set<string>();
  const names = new Set<string>();
  for (const repository of value.repositories) {
    if (!isRepository(repository)) return false;
    const id = repository.id as string;
    const name = (repository.fullName as string).toLowerCase();
    if (ids.has(id) || names.has(name)) return false;
    ids.add(id);
    names.add(name);
  }
  return true;
}
