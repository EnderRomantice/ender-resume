import { execFile } from 'node:child_process';

export const GITHUB_USERNAME = 'EnderRomantice';

const PROFILE_QUERY = `query PortfolioProfile($login: String!) {
  user(login: $login) {
    id login createdAt
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel weekday } }
      }
    }
  }
}`;

const CONTRIBUTED_QUERY = `query PortfolioContributed($login: String!, $cursor: String) {
  user(login: $login) {
    repositoriesContributedTo(first: 100, after: $cursor, includeUserRepositories: true,
      contributionTypes: [COMMIT, PULL_REQUEST, ISSUE, PULL_REQUEST_REVIEW]) {
      nodes { id isPrivate visibility }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

const OWNED_QUERY = `query PortfolioOwned($login: String!, $cursor: String) {
  user(login: $login) {
    repositories(first: 100, after: $cursor, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false) {
      nodes { id isPrivate visibility }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

const MERGED_QUERY = `query PortfolioMerged($search: String!, $cursor: String) {
  search(query: $search, type: ISSUE, first: 100, after: $cursor) {
    issueCount
    nodes { ... on PullRequest { repository { id isPrivate visibility } } }
    pageInfo { hasNextPage endCursor }
  }
}`;

const DETAILS_QUERY = `query PortfolioDetails($ids: [ID!]!, $author: ID!) {
  nodes(ids: $ids) {
    ... on Repository {
      id name nameWithOwner url description stargazerCount isPrivate visibility isFork
      owner { login }
      primaryLanguage { name }
      defaultBranchRef {
        target {
          ... on Commit {
            authored: history(author: {id: $author}) { totalCount }
            all: history { totalCount }
          }
        }
      }
    }
  }
}`;

const LEVELS = new Set(['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE']);
const isPublic = (repository) => repository && repository.isPrivate === false && repository.visibility === 'PUBLIC';

function assertCount(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('GitHub returned invalid contribution counts.');
  return value;
}

function calendarFrom(value) {
  if (!value || !Array.isArray(value.weeks)) throw new Error('GitHub returned no contribution calendar.');
  return {
    totalContributions: assertCount(value.totalContributions),
    weeks: value.weeks.map((week) => ({
      contributionDays: week.contributionDays.map((day) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !LEVELS.has(day.contributionLevel) ||
          !Number.isInteger(day.weekday) || day.weekday < 0 || day.weekday > 6) {
          throw new Error('GitHub returned an invalid contribution day.');
        }
        return {
          date: day.date,
          contributionCount: assertCount(day.contributionCount),
          contributionLevel: day.contributionLevel,
          weekday: day.weekday,
        };
      }),
    })),
  };
}

function readGraphQLResponse(body) {
  // Never include GitHub error payloads: they can contain private repository names.
  if (!body || body.errors?.length || !body.data) throw new Error('GitHub GraphQL request failed.');
  return body.data;
}

const REST_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

function contributorPage(status, headers, body) {
  if (status === 204) return { entries: [], hasNextPage: false };
  // Rate limits (including 403/429), missing repositories, and transient errors
  // abort the refresh. They are never reported as a genuine missing rank.
  if (status !== 200 || !Array.isArray(body)) throw new Error(`GitHub contributors request failed (${status}).`);
  return { entries: body, hasNextPage: /rel="next"/.test(headers.get('link') ?? '') };
}

function parseIncludedResponse(stdout) {
  const status = Number(stdout.match(/^HTTP\/[\d.]+ (\d{3})/i)?.[1]);
  const separator = /\r?\n\r?\n/.exec(stdout);
  if (!Number.isInteger(status) || !separator) throw new Error('GitHub REST returned an invalid response.');
  const headers = new Headers();
  for (const line of stdout.slice(0, separator.index).split(/\r?\n/).slice(1)) {
    const colon = line.indexOf(':');
    if (colon > 0) headers.append(line.slice(0, colon), line.slice(colon + 1).trim());
  }
  const body = stdout.slice(separator.index + separator[0].length).trim();
  return contributorPage(status, headers, body ? JSON.parse(body) : null);
}

/**
 * @typedef {((query: string, variables: Record<string, unknown>) => Promise<any>) & {
 *   rest: (path: string) => Promise<{entries: any[], hasNextPage: boolean}>
 * }} GitHubClient
 */

/**
 * Create a fixed-endpoint client. gh reads its own credentials; no token extraction.
 * @param {{token?: string, allowCli?: boolean, signal?: AbortSignal, requestTimeoutMs?: number}} options
 * @returns {GitHubClient | null}
 */
export function createGitHubClient({ token, allowCli = false, signal, requestTimeoutMs = 12000 } = {}) {
  const requestSignal = () => signal
    ? AbortSignal.any([signal, AbortSignal.timeout(requestTimeoutMs)])
    : AbortSignal.timeout(requestTimeoutMs);
  if (token) {
    const graphql = async (query, variables) => {
      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'ender-portfolio',
        },
        body: JSON.stringify({ query, variables }),
        signal: requestSignal(),
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('GitHub API is unavailable.');
      return readGraphQLResponse(await response.json());
    };
    return Object.assign(graphql, {
      rest: async (path) => {
        if (!/^\/repos\/[^/?]+\/[^/?]+\/contributors\?per_page=100&page=[1-9]\d*$/.test(path)) {
          throw new Error('Unsupported GitHub REST endpoint.');
        }
        const response = await fetch(`https://api.github.com${path}`, {
          headers: { ...REST_HEADERS, Authorization: `Bearer ${token}`, 'User-Agent': 'ender-portfolio' },
          signal: requestSignal(),
          cache: 'no-store',
        });
        return contributorPage(response.status, response.headers, response.status === 200 ? await response.json() : null);
      },
    });
  }
  if (!allowCli) return null;
  const runCli = (args, input) => new Promise((resolve, reject) => {
    const child = execFile('gh', args, {
      timeout: requestTimeoutMs,
      maxBuffer: 4 * 1024 * 1024,
      signal,
      windowsHide: true,
    }, (error, stdout) => {
      if (error) return reject(new Error('GitHub CLI request failed.'));
      resolve(stdout);
    });
    child.stdin?.on('error', () => {});
    child.stdin?.end(input);
  });
  const graphql = async (query, variables) => {
    try {
      return readGraphQLResponse(JSON.parse(await runCli(['api', 'graphql', '--input', '-'], JSON.stringify({ query, variables }))));
    } catch { throw new Error('GitHub CLI returned an invalid response.'); }
  };
  return Object.assign(graphql, {
    rest: async (path) => {
      if (!/^\/repos\/[^/?]+\/[^/?]+\/contributors\?per_page=100&page=[1-9]\d*$/.test(path)) {
        throw new Error('Unsupported GitHub REST endpoint.');
      }
      try {
        return parseIncludedResponse(await runCli(['api', path, '--include', '--method', 'GET',
          '-H', 'Accept: application/vnd.github+json', '-H', 'X-GitHub-Api-Version: 2022-11-28']));
      } catch { throw new Error('GitHub contributor lookup failed.'); }
    },
  });
}

/** Preserve GitHub's default account order, including bots and tied counts. */
export async function getContributorRank(rest, fullName, username, signal) {
  const [owner, repository, extra] = fullName.split('/');
  if (!owner || !repository || extra) throw new Error('Invalid repository name.');
  let offset = 0;
  for (let page = 1; ; page++) {
    signal?.throwIfAborted();
    const result = await rest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contributors?per_page=100&page=${page}`);
    if (!Array.isArray(result.entries)) throw new Error('GitHub returned invalid contributors.');
    // The default endpoint excludes anonymous authors. Keep that account-only
    // definition even if a response unexpectedly contains an unlinked record.
    const accounts = result.entries.filter((entry) => typeof entry?.login === 'string' && entry.login.length > 0);
    const index = accounts.findIndex((entry) => entry.login.toLowerCase() === username.toLowerCase());
    if (index !== -1) return offset + index + 1;
    offset += accounts.length;
    if (!result.hasNextPage) return null;
    if (!result.entries.length) throw new Error('GitHub returned an empty intermediate contributor page.');
  }
}

/**
 * Collect only public repositories, never persisting intermediate/private names.
 * @param {GitHubClient} graphql
 * @param {{now?: Date, signal?: AbortSignal}} options
 */
export async function collectGitHubPortfolio(graphql, { now = new Date(), signal } = {}) {
  // GitHub supplies the rolling-year window and its partial boundary weeks.
  const profile = await graphql(PROFILE_QUERY, { login: GITHUB_USERNAME });
  const user = profile.user;
  if (!user || user.login.toLowerCase() !== GITHUB_USERNAME.toLowerCase()) throw new Error('GitHub profile is unavailable.');

  // Evidence is independent of commit attribution. Merged/squashed PRs and issues
  // remain valid contributions even when default-branch author history is zero.
  const candidates = new Map();
  const remember = (repository, evidence) => {
    if (!isPublic(repository)) return;
    candidates.set(repository.id, { evidence: evidence || candidates.get(repository.id)?.evidence || false });
  };
  const paginate = async (query, variables, select, visit) => {
    let cursor = null;
    for (let page = 0; page < 100; page++) {
      signal?.throwIfAborted();
      const connection = select(await graphql(query, { ...variables, cursor }));
      if (!connection?.nodes || !connection.pageInfo) throw new Error('GitHub returned an incomplete repository list.');
      connection.nodes.forEach(visit);
      if (!connection.pageInfo.hasNextPage) return;
      const next = connection.pageInfo.endCursor;
      if (!next || next === cursor) throw new Error('GitHub returned an invalid pagination cursor.');
      cursor = next;
    }
    throw new Error('GitHub repository pagination exceeded the refresh limit.');
  };

  await Promise.all([
    paginate(CONTRIBUTED_QUERY, { login: GITHUB_USERNAME }, (data) => data.user?.repositoriesContributedTo,
      (repo) => remember(repo, true)),
    paginate(OWNED_QUERY, { login: GITHUB_USERNAME }, (data) => data.user?.repositories,
      (repo) => remember(repo, false)),
    // GitHub search exposes up to 1,000 results. Partition by year so historic
    // merged PRs are not limited to the profile's recent contribution window.
    (async () => {
      const createdYear = new Date(user.createdAt).getUTCFullYear();
      if (!Number.isInteger(createdYear)) throw new Error('GitHub profile creation date is invalid.');
      for (let year = createdYear; year <= now.getUTCFullYear(); year++) {
        await paginate(MERGED_QUERY, {
          search: `author:${GITHUB_USERNAME} is:pr is:merged is:public created:${year}-01-01..${year}-12-31`,
        }, (data) => {
          if (data.search?.issueCount > 1000) throw new Error('Historical GitHub PR search exceeds the yearly limit.');
          return data.search;
        }, (node) => remember(node?.repository, true));
      }
    })(),
  ]);

  const ids = [...candidates.keys()];
  const repositories = [];
  for (let offset = 0; offset < ids.length; offset += 20) {
    signal?.throwIfAborted();
    const details = await graphql(DETAILS_QUERY, { ids: ids.slice(offset, offset + 20), author: user.id });
    if (!Array.isArray(details.nodes)) throw new Error('GitHub returned incomplete repository counts.');
    for (const repository of details.nodes) {
      if (!isPublic(repository)) continue;
      const head = repository.defaultBranchRef?.target;
      const totalCommits = head ? assertCount(head.all?.totalCount) : 0;
      const contributions = head ? assertCount(head.authored?.totalCount) : 0;
      if (contributions > totalCommits) throw new Error('GitHub returned inconsistent commit counts.');
      const hasEvidence = candidates.get(repository.id)?.evidence;
      if (!hasEvidence && (!contributions || repository.isFork)) continue;
      repositories.push({
        id: repository.id,
        name: repository.name,
        fullName: repository.nameWithOwner,
        url: repository.url,
        description: repository.description ?? null,
        stars: assertCount(repository.stargazerCount),
        contributions,
        totalCommits,
        contributorRank: null,
        language: repository.primaryLanguage?.name ?? null,
        isOwner: repository.owner.login.toLowerCase() === GITHUB_USERNAME.toLowerCase(),
      });
    }
  }

  // Each worker advances one repository at a time. Large contributor lists are
  // fully paginated, while at most four repositories make REST requests at once.
  let nextRepository = 0;
  let rankLookupFailed = false;
  await Promise.all(Array.from({ length: Math.min(4, repositories.length) }, async () => {
    while (!rankLookupFailed && nextRepository < repositories.length) {
      const repository = repositories[nextRepository++];
      try {
        repository.contributorRank = await getContributorRank(graphql.rest, repository.fullName, GITHUB_USERNAME, signal);
      } catch (error) {
        rankLookupFailed = true;
        throw error;
      }
    }
  }));

  // Keep transport order neutral. Ranking belongs to the UI, not the dataset.
  repositories.sort((a, b) => a.fullName.localeCompare(b.fullName));
  return {
    username: GITHUB_USERNAME,
    updatedAt: now.toISOString(),
    repositories,
    calendar: calendarFrom(user.contributionsCollection?.contributionCalendar),
  };
}
