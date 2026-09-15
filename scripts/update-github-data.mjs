import { mkdir, rename, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { collectGitHubPortfolio, createGitHubClient } from '../src/lib/github-portfolio-source.mjs';

const signal = AbortSignal.timeout(120000);
const graphql = createGitHubClient({
  token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
  allowCli: true,
  signal,
});

try {
  const data = await collectGitHubPortfolio(graphql, { signal });
  const directory = new URL('../src/data/', import.meta.url);
  const destination = new URL('github-portfolio.json', directory);
  const temporary = new URL(`.github-portfolio-${process.pid}.json`, directory);
  await mkdir(directory, { recursive: true });
  await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o644 });
  await rename(temporary, destination);
  console.log(`Saved ${data.repositories.length} public repositories and ${data.calendar.totalContributions} calendar contributions to ${fileURLToPath(destination)}.`);
} catch {
  // Preserve the last verified snapshot and never print API/credential payloads.
  console.error('GitHub refresh failed. The existing snapshot was left unchanged.');
  process.exitCode = 1;
}
