import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { collectGitHubPortfolio, createGitHubClient, getContributorRank, GITHUB_USERNAME } from './github-portfolio-source.mjs';

const now = new Date('2026-09-16T00:00:00.000Z');
const repository = (id, options = {}) => ({
  id,
  name: id,
  nameWithOwner: `public/${id}`,
  url: `https://github.com/public/${id}`,
  description: null,
  stargazerCount: 4,
  isPrivate: false,
  visibility: 'PUBLIC',
  isFork: false,
  owner: { login: 'public' },
  primaryLanguage: { name: 'TypeScript' },
  defaultBranchRef: { target: { authored: { totalCount: 2 }, all: { totalCount: 10 } } },
  ...options,
});
const connection = (nodes, cursor = null) => ({
  nodes,
  pageInfo: { hasNextPage: Boolean(cursor), endCursor: cursor },
});
const calendar = {
  totalContributions: 3,
  weeks: [{ contributionDays: [{ date: '2026-09-15', contributionCount: 3, contributionLevel: 'THIRD_QUARTILE', weekday: 2 }] }],
};

function clientFixture({ contributed = [], owned = [], merged = [], details = [], nextContributed = [], issueCount = merged.length, rankings = {} } = {}) {
  const calls = [];
  const graphql = async (query, variables) => {
    calls.push({ query, variables });
    if (query.includes('PortfolioProfile')) return {
      user: { id: 'USER', login: GITHUB_USERNAME, createdAt: '2026-01-01T00:00:00Z', contributionsCollection: { contributionCalendar: calendar } },
    };
    if (query.includes('PortfolioContributed')) return {
      user: { repositoriesContributedTo: variables.cursor
        ? connection(nextContributed)
        : connection(contributed, nextContributed.length ? 'NEXT' : null) },
    };
    if (query.includes('PortfolioOwned')) return { user: { repositories: connection(owned) } };
    if (query.includes('PortfolioMerged')) return { search: { ...connection(merged.map((repo) => ({ repository: repo }))), issueCount } };
    if (query.includes('PortfolioDetails')) return { nodes: details.filter((repo) => variables.ids.includes(repo.id)) };
    throw new Error('Unexpected test operation');
  };
  graphql.rest = async (path) => {
    const name = path.split('/')[3];
    return { entries: rankings[name] ?? [{ login: GITHUB_USERNAME }], hasNextPage: false };
  };
  return { graphql, calls };
}

test('collects public contribution evidence, paginates, and keeps API rank separate from commit counts', async () => {
  const committed = repository('committed');
  const zeroCommitPR = repository('merged', { defaultBranchRef: { target: { authored: { totalCount: 0 }, all: { totalCount: 30 } } } });
  const zeroCommitIssue = repository('issue', { defaultBranchRef: null });
  const privateRepo = repository('not-public', { isPrivate: true, visibility: 'PRIVATE', nameWithOwner: 'private/hidden' });
  const internalRepo = repository('internal', { isPrivate: false, visibility: 'INTERNAL' });
  const owned = repository('owned', { owner: { login: GITHUB_USERNAME } });
  const empty = repository('empty', { owner: { login: GITHUB_USERNAME }, defaultBranchRef: null });
  const copiedFork = repository('copy', { owner: { login: GITHUB_USERNAME }, isFork: true });
  const fixture = clientFixture({
    contributed: [committed, privateRepo, internalRepo],
    nextContributed: [zeroCommitIssue],
    owned: [owned, empty, copiedFork, committed],
    merged: [zeroCommitPR],
    details: [committed, zeroCommitPR, zeroCommitIssue, privateRepo, internalRepo, owned, empty, copiedFork],
    rankings: { committed: [{ login: 'automation[bot]' }, { login: GITHUB_USERNAME }], issue: [], merged: [] },
  });
  const data = await collectGitHubPortfolio(fixture.graphql, { now });
  assert.deepEqual(data.repositories.map((repo) => repo.id), ['committed', 'issue', 'merged', 'owned']);
  assert.equal(data.repositories[0].contributorRank, 2);
  assert.equal(data.repositories[1].contributorRank, null);
  assert.equal(data.repositories[2].contributorRank, null);
  assert.equal(data.repositories[2].contributions, 0);
  assert.equal(data.repositories[3].isOwner, true);
  assert.deepEqual(data.calendar, calendar);
  assert.equal(data.updatedAt, now.toISOString());
  assert.ok(fixture.calls.some((call) => call.variables.cursor === 'NEXT'));
  const requestedIds = fixture.calls.filter((call) => call.query.includes('PortfolioDetails')).flatMap((call) => call.variables.ids);
  assert.ok(!requestedIds.includes('not-public') && !requestedIds.includes('internal'));
  assert.ok(!JSON.stringify(data).includes('private/hidden'));
});

test('checks public visibility again before publishing details', async () => {
  const discovered = repository('changed');
  const fixture = clientFixture({ contributed: [discovered], details: [{ ...discovered, isPrivate: true, visibility: 'PRIVATE' }] });
  assert.deepEqual((await collectGitHubPortfolio(fixture.graphql, { now })).repositories, []);
});

test('refuses invalid commit ratios rather than publishing guessed counts', async () => {
  const invalid = repository('invalid', { defaultBranchRef: { target: { authored: { totalCount: 11 }, all: { totalCount: 10 } } } });
  const fixture = clientFixture({ contributed: [invalid], details: [invalid] });
  await assert.rejects(collectGitHubPortfolio(fixture.graphql, { now }), /inconsistent commit counts/);
});

test('refuses search truncation instead of silently presenting an incomplete history', async () => {
  const fixture = clientFixture({ issueCount: 1001 });
  await assert.rejects(collectGitHubPortfolio(fixture.graphql, { now }), /yearly limit/);
});

test('production transport is unavailable without an explicit token', () => {
  assert.equal(createGitHubClient(), null);
  assert.equal(createGitHubClient({ allowCli: false }), null);
});

test('an expired refresh does not proceed into repository requests', async () => {
  const fixture = clientFixture();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(collectGitHubPortfolio(fixture.graphql, { now, signal: controller.signal }), { name: 'AbortError' });
  assert.ok(!fixture.calls.some((call) => call.query.includes('PortfolioDetails')));
});

test('the verified snapshot preserves count, calendar, and URL invariants', async () => {
  const snapshot = JSON.parse(await readFile(new URL('../data/github-portfolio.json', import.meta.url), 'utf8'));
  assert.equal(snapshot.username, GITHUB_USERNAME);
  assert.ok(Number.isFinite(Date.parse(snapshot.updatedAt)));
  assert.equal(new Set(snapshot.repositories.map((repo) => repo.id)).size, snapshot.repositories.length);
  for (const repo of snapshot.repositories) {
    assert.equal(repo.url, `https://github.com/${repo.fullName}`);
    assert.ok(repo.contributions >= 0 && repo.contributions <= repo.totalCommits);
    assert.ok(repo.contributorRank === null || Number.isSafeInteger(repo.contributorRank) && repo.contributorRank > 0);
    assert.ok(!('contributionShare' in repo));
  }
  const days = snapshot.calendar.weeks.flatMap((week) => week.contributionDays);
  assert.equal(new Set(days.map((day) => day.date)).size, days.length);
  assert.equal(days.reduce((sum, day) => sum + day.contributionCount, 0), snapshot.calendar.totalContributions);
});

test('contributor rank follows paginated account order, retaining bots and excluding anonymous records', async () => {
  const paths = [];
  const rest = async (path) => {
    paths.push(path);
    return paths.length === 1
      ? { entries: [{ type: 'Anonymous', name: 'Unlinked author' }, { login: 'robot[bot]', type: 'Bot' }, { login: 'another' }], hasNextPage: true }
      : { entries: [{ login: 'enderromantice' }, { login: 'later' }], hasNextPage: false };
  };
  assert.equal(await getContributorRank(rest, 'public/repo', GITHUB_USERNAME), 3);
  assert.equal(paths.length, 2);
  assert.ok(paths.every((path) => !path.includes('anon=')));
  assert.ok(paths[1].endsWith('page=2'));
});

test('empty or fully searched contributor lists produce null, while request errors remain errors', async () => {
  assert.equal(await getContributorRank(async () => ({ entries: [], hasNextPage: false }), 'public/repo', GITHUB_USERNAME), null);
  assert.equal(await getContributorRank(async () => ({ entries: [{ login: 'someone' }], hasNextPage: false }), 'public/repo', GITHUB_USERNAME), null);
  await assert.rejects(getContributorRank(async () => { throw new Error('rate limited'); }, 'public/repo', GITHUB_USERNAME), /rate limited/);
});

test('REST transport treats 204 as empty and 429 as refresh failure', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 204 }));
  const client = createGitHubClient({ token: 'unit-test-token' });
  assert.deepEqual(await client.rest('/repos/public/repo/contributors?per_page=100&page=1'), { entries: [], hasNextPage: false });
  globalThis.fetch.mock.mockImplementation(async () => new Response('{}', { status: 429 }));
  await assert.rejects(client.rest('/repos/public/repo/contributors?per_page=100&page=1'), /429/);
});

test('REST rank lookups are bounded to four concurrent repositories', async () => {
  const repos = Array.from({ length: 9 }, (_, index) => repository(`repo-${index}`));
  const fixture = clientFixture({ contributed: repos, details: repos });
  let active = 0;
  let peak = 0;
  fixture.graphql.rest = async () => {
    active++;
    peak = Math.max(active, peak);
    await new Promise((resolve) => setTimeout(resolve, 1));
    active--;
    return { entries: [{ login: GITHUB_USERNAME }], hasNextPage: false };
  };
  const data = await collectGitHubPortfolio(fixture.graphql, { now });
  assert.equal(data.repositories.length, 9);
  assert.equal(peak, 4);
});
