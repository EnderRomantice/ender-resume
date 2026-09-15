import assert from 'node:assert/strict';
import test from 'node:test';
import { isGitHubPortfolioData } from './github-portfolio-validation.ts';

function fixture() {
  return {
    username: 'EnderRomantice',
    updatedAt: '2026-09-16T01:02:03.456Z',
    repositories: [{
      id: 'R_example',
      name: 'example.repo',
      fullName: 'some-owner/example.repo',
      url: 'https://github.com/some-owner/example.repo',
      description: null,
      stars: 0,
      contributions: 0,
      totalCommits: 5,
      contributorRank: null,
      language: '',
      isOwner: false,
    }],
    calendar: {
      totalContributions: 3,
      weeks: [{ contributionDays: [{
        date: '2026-09-15',
        contributionCount: 3,
        contributionLevel: 'THIRD_QUARTILE',
        weekday: 2,
      }] }],
    },
  };
}

test('accepts nullable/empty metadata, null rank, partial weeks and API freshness fields', () => {
  const data = fixture();
  assert.equal(isGitHubPortfolioData(data), true);
  data.repositories[0].description = '';
  data.repositories[0].language = null;
  data.repositories[0].contributorRank = 1;
  assert.equal(isGitHubPortfolioData({ ...data, stale: false, source: 'github' }), true);
  assert.equal(isGitHubPortfolioData({ ...data, repositories: [], calendar: { totalContributions: 0, weeks: [] } }), true);
});

test('rejects missing fields and old share-only repository data', () => {
  for (const key of Object.keys(fixture())) {
    const data = fixture();
    delete data[key];
    assert.equal(isGitHubPortfolioData(data), false, key);
  }
  for (const key of Object.keys(fixture().repositories[0])) {
    const data = fixture();
    delete data.repositories[0][key];
    assert.equal(isGitHubPortfolioData(data), false, key);
  }
  const data = fixture();
  delete data.repositories[0].contributorRank;
  data.repositories[0].contributionShare = 0;
  assert.equal(isGitHubPortfolioData(data), false);
});

test('does not accept malformed or overflowing dates that Date.parse can normalize', () => {
  for (const updatedAt of ['z', '', '2026-09-16', '2026-02-30T01:02:03Z', '2026-09-16T24:00:00Z', '2026-09-16T01:02:03']) {
    assert.equal(isGitHubPortfolioData({ ...fixture(), updatedAt }), false, updatedAt);
  }
  assert.equal(isGitHubPortfolioData({ ...fixture(), updatedAt: '2024-02-29T09:02:03+08:00' }), true);
  for (const date of ['2026-02-29', '2026-09-31', '2026-13-01', 'invalid']) {
    const data = fixture();
    data.calendar.weeks[0].contributionDays[0].date = date;
    assert.equal(isGitHubPortfolioData(data), false, date);
  }
});

test('rejects invalid counts and ranks without rejecting zero counts', () => {
  for (const key of ['stars', 'contributions', 'totalCommits']) {
    for (const invalid of [-1, 1.5, NaN, Infinity, '1', Number.MAX_SAFE_INTEGER + 1]) {
      const data = fixture();
      data.repositories[0][key] = invalid;
      assert.equal(isGitHubPortfolioData(data), false, `${key}: ${invalid}`);
    }
  }
  for (const contributorRank of [undefined, 0, -1, 1.5, NaN, Infinity, '1']) {
    const data = fixture();
    data.repositories[0].contributorRank = contributorRank;
    assert.equal(isGitHubPortfolioData(data), false);
  }
  const data = fixture();
  data.repositories[0].contributions = 6;
  assert.equal(isGitHubPortfolioData(data), false);
});

test('only accepts matching HTTPS GitHub repository links', () => {
  for (const url of [
    'javascript:alert(1)', 'http://github.com/some-owner/example.repo',
    'https://github.com.evil.test/some-owner/example.repo',
    'https://github.com@evil.test/some-owner/example.repo',
    'https://user:password@github.com/some-owner/example.repo',
    'https://github.com/some-owner/other',
    'https://github.com:444/some-owner/example.repo',
  ]) {
    const data = fixture();
    data.repositories[0].url = url;
    assert.equal(isGitHubPortfolioData(data), false, url);
  }
});

test('deeply rejects malformed calendar arrays, days, totals and duplicates', () => {
  const mutations = [
    data => { data.calendar.weeks = [null]; },
    data => { data.calendar.weeks[0].contributionDays = {}; },
    data => { data.calendar.weeks[0].contributionDays = [null]; },
    data => { data.calendar.weeks[0].contributionDays[0].contributionLevel = 'UNKNOWN'; },
    data => { data.calendar.weeks[0].contributionDays[0].contributionCount = -1; },
    data => { data.calendar.weeks[0].contributionDays[0].weekday = 7; },
    data => { data.calendar.weeks[0].contributionDays[0].weekday = 1; },
    data => { delete data.calendar.weeks[0].contributionDays[0].weekday; },
    data => { data.calendar.totalContributions = 4; },
    data => { data.calendar.weeks.push(structuredClone(data.calendar.weeks[0])); },
    data => { data.repositories.push(structuredClone(data.repositories[0])); },
  ];
  for (const mutate of mutations) {
    const data = fixture();
    mutate(data);
    assert.equal(isGitHubPortfolioData(data), false);
  }
  for (const value of [undefined, null, [], true, 3, 'data']) {
    assert.equal(isGitHubPortfolioData(value), false);
  }
});
