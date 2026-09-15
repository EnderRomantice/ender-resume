import assert from 'node:assert/strict';
import test from 'node:test';
import { rankGitHubProjects } from './github-ranking.ts';

function project(fullName, stars, contributorRank) {
  return { id: fullName, name: fullName, fullName, url: `https://github.com/${fullName}`, description: null, stars, contributorRank, contributions: 1, totalCommits: 1, language: null, isOwner: false };
}

test('inverse contributor rank and logarithmic stars each contribute half of the score', () => {
  const input = [project('owner/small', 99, 1), project('owner/large', 9999, 4)];
  const ranked = rankGitHubProjects(input);
  assert.equal(ranked[0].fullName, 'owner/small');
  assert.ok(Math.abs(ranked[0].score - 0.75) < 1e-12);
  assert.ok(Math.abs(ranked[1].score - 0.625) < 1e-12);
  assert.equal(input[0].score, undefined);
});

test('zero-star repositories rank by contributor position without NaN', () => {
  const ranked = rankGitHubProjects([project('owner/a', 0, 2), project('owner/b', 0, 1)]);
  assert.deepEqual(ranked.map(({ score }) => score), [0.5, 0.25]);
  assert.deepEqual(rankGitHubProjects([]), []);
});

test('ties are deterministic', () => {
  const ranked = rankGitHubProjects([project('owner/z', 100, 2), project('owner/a', 100, 2)]);
  assert.equal(ranked[0].fullName, 'owner/a');
});

test('unavailable or invalid rank never invents a contributor position', () => {
  for (const rank of [null, undefined, 0, -1, 1.5, NaN]) {
    assert.equal(rankGitHubProjects([project('owner/unranked', 100, rank)])[0].score, 0.5);
  }
});
