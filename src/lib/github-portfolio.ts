import 'server-only';

import { unstable_cache } from 'next/cache';
import snapshot from '@/data/github-portfolio.json';
import { collectGitHubPortfolio, createGitHubClient, GITHUB_USERNAME } from './github-portfolio-source.mjs';
import type { GitHubPortfolioData, GitHubPortfolioResult } from './github-portfolio-types';
import { isGitHubPortfolioData } from './github-portfolio-validation';

const CACHE_MS = 60 * 60 * 1000;
const REFRESH_TIMEOUT_MS = 90 * 1000;
const verifiedSnapshot = snapshot as GitHubPortfolioData;
let inFlight: Promise<GitHubPortfolioData> | undefined;
let retryAfter = 0;

async function refreshPortfolio(): Promise<GitHubPortfolioData> {
  if (inFlight) return inFlight;
  if (Date.now() < retryAfter) throw new Error('GitHub refresh is temporarily unavailable.');

  const signal = AbortSignal.timeout(REFRESH_TIMEOUT_MS);
  const graphql = createGitHubClient({
    token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
    allowCli: process.env.NODE_ENV === 'development',
    signal,
  });
  if (!graphql) throw new Error('GitHub credentials are unavailable.');

  inFlight = collectGitHubPortfolio(graphql, { signal })
    .then((data) => data as GitHubPortfolioData)
    .catch(() => {
      retryAfter = Date.now() + 30_000;
      throw new Error('GitHub refresh failed.');
    })
    .finally(() => { inFlight = undefined; });
  return inFlight;
}

// This project uses the non-Cache-Components model. The Data Cache persists the
// complete successful result across requests and server instances; credentials
// are read only inside the callback and never appear in arguments/cache keys.
const getCachedPortfolio = unstable_cache(
  refreshPortfolio,
  ['github-portfolio', GITHUB_USERNAME, 'public-account-contributor-rank-v3'],
  { revalidate: CACHE_MS / 1000 },
);

/**
 * The page renders its snapshot synchronously; its client fetch can wait for a
 * bounded cold refresh. Subsequent requests use Next's one-hour Data Cache.
 * Errors and deployments without credentials retain the verified snapshot.
 */
export async function getGitHubPortfolio(): Promise<GitHubPortfolioResult> {
  const canRefresh = Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.NODE_ENV === 'development');
  if (canRefresh) {
    try {
      const data = await getCachedPortfolio();
      if (!isGitHubPortfolioData(data)) throw new Error('GitHub cache contains an invalid dataset.');
      return { ...data, stale: Date.now() - Date.parse(data.updatedAt) >= CACHE_MS, source: 'github' };
    } catch {
      // Never forward GitHub error payloads, credentials, or private metadata.
    }
  }
  return { ...verifiedSnapshot, stale: true, source: 'snapshot' };
}
