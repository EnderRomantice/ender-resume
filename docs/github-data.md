# GitHub portfolio data

The project grid only displays repositories with at least 50 stars, at least 20
commits attributed to EnderRomantice, and a contributor rank of 1–5. Missing ranks
are excluded. All three conditions must hold; at most 5 cards are shown.
Filtering does not change the complete contribution calendar.

`src/data/github-portfolio.json` is a checked-in snapshot fetched from GitHub's
GraphQL and REST APIs for `EnderRomantice`. It contains public repositories and GitHub's
rolling-year contribution calendar. `updatedAt` is the collection time, not a
claim that a fallback snapshot is live.

## Refresh the snapshot

Run `node scripts/update-github-data.mjs` from the repository. It uses an existing
`GITHUB_TOKEN` or `GH_TOKEN`, in that order, or the currently authenticated `gh`
CLI. It never extracts or saves CLI credentials. Failed refreshes leave the
existing snapshot untouched.

## Deployment

Set `GITHUB_TOKEN` (or `GH_TOKEN`) as a **server-only deployment secret** to enable
live refreshes. A read-only GitHub token with access to the needed public
repositories is sufficient; private-repository access is unnecessary. Do not
prefix the variable with `NEXT_PUBLIC_`, commit a token, or put a token in this
snapshot. Production never attempts to use a local `gh` login.

`GET /api/github` returns the data object directly, plus `stale` and `source`
(`github` or `snapshot`). The page renders the snapshot synchronously; the
client's API request then loads live data without blocking the initial page.
`unstable_cache` stores successful complete results in Next.js's persistent
Data Cache with `revalidate: 3600`, so reuse is not limited to process memory.
A cache miss waits for one bounded refresh (90-second overall deadline,
12-second deadline per GitHub request). Expired cached results follow Next's
stale-while-revalidate behavior. Failures return the verified snapshot with
`stale: true`, and deployments without credentials return it immediately.
Fresh API responses have a one-hour shared HTTP cache; fallback responses use
a short 30-second shared cache so a successful retry becomes visible. Tokens
are never arguments or keys in the Data Cache.
Simultaneous misses in one server process share an in-flight collection. A
failed collection has a short 30-second retry backoff. Contributor lookups use
at most four concurrent repository requests.

## Metrics and coverage

- Repositories come from `repositoriesContributedTo` (commits, PRs, issues, reviews,
  including owned repositories), historical public merged PR searches, and
  public non-fork owned repositories with attributed commits. No pinned-repository
  shortcut is used. Searches are paginated; historical PR searches are split
  by creation year. A year exceeding GitHub's 1,000-result search cap fails the
  refresh rather than silently publishing a partial dataset.
  GitHub defines `repositoriesContributedTo` as **recent** contributions, without
  promising a complete historical archive. Historical merged PRs and owned
  repositories are covered; older issue-only or unmerged-PR-only activity outside
  that recent list can be absent. Recent review-only activity is included, but
  historical reviews are not separately searched. This list should not be
  described as every repository ever touched.
- Repository visibility is checked both during discovery and before output.
  Private/internal repository names and metadata are never written to the
  snapshot or returned by the API. Empty owned repositories and owned-only fork
  copies are excluded. Forks with independent GitHub contribution evidence can
  appear.
- `contributorRank` is the one-based position of `EnderRomantice` in GitHub's
  default [`GET /repos/{owner}/{repo}/contributors`](https://docs.github.com/en/rest/repos/repos#list-repository-contributors)
  response, paginated until found or the list ends. It follows GitHub's order
  by contributor commit count; bots remain included and anonymous unlinked
  authors are excluded (the `anon` option is not enabled). Tied counts retain
  GitHub's returned order. Empty repositories or an account absent from the
  complete list have `null`, never zero. A failed/limited/timed-out request
  fails the refresh instead of manufacturing a null rank. GitHub caches this
  endpoint for a few hours and only associates the first 500 author emails
  with accounts, so some genuine contributors may not appear by login.
- `contributions` is `defaultBranchRef.target.history(author: {id: USER_ID})
  .totalCount`; `totalCommits` is the same default-branch history without the
  author filter. `contributions` supplies the 20-commit display threshold. These
  counts are not used to infer contributor rank or to weight the project list.
- Repositories supported by PR/issue contribution evidence are retained even
  when the author-filtered default-branch commit count is zero.
- The calendar is returned unchanged from GitHub's `contributionCalendar`,
  including contribution levels and partial boundary weeks. It represents all
  GitHub contribution types, not only commits in the repository cards. GitHub
  may include anonymized restricted-contribution counts; no private names are
  requested for the calendar.
- Counts and metadata are stored without ranking. The UI applies its separate
  50% reciprocal contributor rank / 50% normalized `log1p(stars)` sorting rule.
