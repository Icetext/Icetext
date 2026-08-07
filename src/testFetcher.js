import assert from 'node:assert/strict';
import {
  aggregateLifetimeContributions,
  calculateOverallStats,
  fetchAllRepositories,
  fetchLifetimeContributions,
  fetchUserData,
  getContributionYearRange,
  validateTokenAccess,
} from './fetcher.js';

let passed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✔ ${name}`);
  } catch (error) {
    console.error(`  ✘ ${name}`);
    throw error;
  }
}

console.log('\nFetcher validation tests');

await test('creates bounded, non-overlapping contribution-year ranges', () => {
  assert.deepEqual(getContributionYearRange(2024, new Date('2026-08-07T12:00:00Z')), {
    from: '2024-01-01T00:00:00.000Z',
    to: '2024-12-31T23:59:59.999Z',
  });
  assert.deepEqual(getContributionYearRange(2026, new Date('2026-08-07T12:00:00Z')), {
    from: '2026-01-01T00:00:00.000Z',
    to: '2026-08-07T12:00:00.000Z',
  });
});

await test('aggregates contribution totals across every year', () => {
  const totals = aggregateLifetimeContributions([
    {
      totalCommitContributions: 10,
      totalIssueContributions: 2,
      totalPullRequestContributions: 3,
      totalPullRequestReviewContributions: 4,
      totalRepositoryContributions: 1,
      restrictedContributionsCount: 0,
    },
    {
      totalCommitContributions: 20,
      totalIssueContributions: 5,
      totalPullRequestContributions: 7,
      totalPullRequestReviewContributions: 8,
      totalRepositoryContributions: 2,
      restrictedContributionsCount: 1,
    },
  ]);
  assert.equal(totals.totalCommitContributions, 30);
  assert.equal(totals.totalPullRequestContributions, 10);
  assert.equal(totals.restrictedContributionsCount, 1);
});

await test('does not misclassify restricted activity as commits', () => {
  const stats = calculateOverallStats({
    contributionsCollection: {
      totalCommitContributions: 12,
      restrictedContributionsCount: 99,
      totalRepositoryContributions: 4,
    },
    repositories: { nodes: [] },
  });
  assert.equal(stats.totalCommits, 12);
  assert.equal(stats.contributedTo, 4);
});

await test('paginates through every repository page', async () => {
  const cursors = [];
  const client = async (_query, variables) => {
    cursors.push(variables.after);
    return variables.after === null
      ? {
          user: {
            repositories: {
              nodes: [{ name: 'first' }],
              pageInfo: { hasNextPage: true, endCursor: 'next-page' },
            },
          },
        }
      : {
          user: {
            repositories: {
              nodes: [{ name: 'second' }],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        };
  };
  const repositories = await fetchAllRepositories(client, 'Icetext');
  assert.deepEqual(repositories.map((repo) => repo.name), ['first', 'second']);
  assert.deepEqual(cursors, [null, 'next-page']);
});

await test('fetches and sums each lifetime contribution year', async () => {
  const years = [];
  const client = async (_query, variables) => {
    const year = Number(variables.from.slice(0, 4));
    years.push(year);
    return {
      user: {
        contributionsCollection: {
          totalCommitContributions: year === 2023 ? 10 : year === 2024 ? 20 : 30,
        },
      },
    };
  };
  const totals = await fetchLifetimeContributions(
    client,
    'Icetext',
    [2023, 2024, 2026, 2024],
    new Date('2026-08-07T12:00:00Z')
  );
  assert.deepEqual(years, [2023, 2024, 2026]);
  assert.equal(totals.totalCommitContributions, 60);
});

await test('accepts a matching classic PAT with private scopes', async () => {
  const fakeFetch = async () => ({
    ok: true,
    status: 200,
    headers: { get: () => 'repo, read:user' },
    json: async () => ({ login: 'Icetext' }),
  });
  const result = await validateTokenAccess('secret', 'icetext', fakeFetch);
  assert.equal(result.login, 'Icetext');
});

await test('rejects tokens that cannot guarantee private coverage', async () => {
  const fakeFetch = async () => ({
    ok: true,
    status: 200,
    headers: { get: () => '' },
    json: async () => ({ login: 'Icetext' }),
  });
  await assert.rejects(
    validateTokenAccess('secret', 'Icetext', fakeFetch),
    /cannot guarantee complete private statistics/
  );
});

await test('refuses silent mock fallback without explicit opt-in', async () => {
  await assert.rejects(fetchUserData('Icetext', ''), /GITHUB_TOKEN is required/);
  const mockStats = await fetchUserData('Icetext', '', { allowMockData: true });
  assert.equal(mockStats.overallStats.totalCommits, 845);
});

console.log(`✔ Fetcher tests passed: ${passed}/${passed}\n`);
