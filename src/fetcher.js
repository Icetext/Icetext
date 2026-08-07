import { graphql } from '@octokit/graphql';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import {
  GET_COMMIT_REPOSITORIES_QUERY,
  GET_CONTRIBUTIONS_QUERY,
  GET_REPOSITORY_COMMITS_QUERY,
  GET_REPOSITORIES_QUERY,
  GET_USER_PROFILE_QUERY,
} from './queries.js';
import { getMockUserData } from './mockData.js';

const GITHUB_API_VERSION = '2022-11-28';

/**
 * Validates that a classic PAT belongs to the target user and can read private
 * repositories and private contribution data. A fine-grained token cannot
 * prove that every repository was selected, so it is rejected in strict mode.
 */
export async function validateTokenAccess(token, targetUsername, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('A Fetch API implementation is required to validate the GitHub token.');
  }

  const response = await fetchImpl('https://api.github.com/user', {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': GITHUB_API_VERSION,
      'user-agent': 'github-profile-stats',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub token validation failed with HTTP ${response.status}.`);
  }

  const viewer = await response.json();
  if (viewer.login?.toLowerCase() !== targetUsername.toLowerCase()) {
    throw new Error(
      `GITHUB_TOKEN belongs to '${viewer.login || 'an unknown user'}', not '${targetUsername}'.`
    );
  }

  const scopesHeader = response.headers.get('x-oauth-scopes') || '';
  const scopes = new Set(
    scopesHeader.split(',').map((scope) => scope.trim().toLowerCase()).filter(Boolean)
  );
  const hasPrivateRepoAccess = scopes.has('repo');
  const hasPrivateContributionAccess = scopes.has('user') || scopes.has('read:user');

  if (!hasPrivateRepoAccess || !hasPrivateContributionAccess) {
    const tokenKind = scopes.size === 0 ? 'fine-grained or unscoped' : 'classic';
    throw new Error(
      `The ${tokenKind} GITHUB_TOKEN cannot guarantee complete private statistics. ` +
      'Use a classic PAT with the repo and read:user scopes.'
    );
  }

  return { login: viewer.login, scopes: [...scopes] };
}

/** Returns a non-overlapping UTC range for a contribution year. */
export function getContributionYearRange(year, now = new Date()) {
  const numericYear = Number(year);
  const start = new Date(Date.UTC(numericYear, 0, 1));
  const endOfYear = new Date(Date.UTC(numericYear + 1, 0, 1) - 1);
  const end = numericYear === now.getUTCFullYear() && now < endOfYear ? now : endOfYear;

  return { from: start.toISOString(), to: end.toISOString() };
}

/** Sums yearly contribution collections into lifetime totals. */
export function aggregateLifetimeContributions(collections = []) {
  const fields = [
    'totalCommitContributions',
    'totalIssueContributions',
    'totalPullRequestContributions',
    'totalPullRequestReviewContributions',
    'totalRepositoryContributions',
    'restrictedContributionsCount',
  ];
  const totals = Object.fromEntries(fields.map((field) => [field, 0]));

  for (const collection of collections) {
    for (const field of fields) totals[field] += Number(collection?.[field]) || 0;
  }

  return totals;
}

/** Fetches every owned, non-fork repository page visible to the token. */
export async function fetchAllRepositories(graphqlClient, login, authorId) {
  const repositories = [];
  let after = null;

  do {
    const response = await graphqlClient(GET_REPOSITORIES_QUERY, { login, authorId, after });
    const connection = response?.user?.repositories;
    if (!connection) throw new Error(`GitHub did not return repositories for '${login}'.`);
    repositories.push(...(connection.nodes || []));
    after = connection.pageInfo?.hasNextPage ? connection.pageInfo.endCursor : null;
  } while (after);

  return repositories;
}

/** Fetches owned, collaborator, and organization repositories visible to the token. */
export async function fetchCommitRepositories(graphqlClient, authorId) {
  const repositories = [];
  let after = null;

  do {
    const response = await graphqlClient(GET_COMMIT_REPOSITORIES_QUERY, { authorId, after });
    const connection = response?.viewer?.repositories;
    if (!connection) throw new Error('GitHub did not return repositories visible to the token.');
    repositories.push(...(connection.nodes || []));
    after = connection.pageInfo?.hasNextPage ? connection.pageInfo.endCursor : null;
  } while (after);

  return repositories;
}

function commitMatchesIdentity(author, login, aliases) {
  const candidates = [author?.user?.login, author?.name, author?.email]
    .filter(Boolean)
    .map((value) => value.toLowerCase());
  const identities = new Set([login, ...(aliases || [])].filter(Boolean).map((value) => value.toLowerCase()));
  return candidates.some((candidate) => identities.has(candidate));
}

/**
 * Counts commits across every accessible repository's default branch. Matching
 * both GitHub login and configured author aliases recovers older commits whose
 * email was never linked to the account.
 */
export async function fetchRepositoryCommitStats(
  graphqlClient,
  repositories,
  login,
  aliases = []
) {
  const accessibleLinkedCommits = (repositories || []).reduce(
    (sum, repo) => sum + (repo.defaultBranchRef?.target?.history?.totalCount || 0),
    0
  );

  const repositoryCounts = await Promise.all((repositories || []).map(async (repository) => {
    if (!repository.id || !repository.defaultBranchRef) return 0;
    const matchingOids = new Set();
    let after = null;

    do {
      const response = await graphqlClient(GET_REPOSITORY_COMMITS_QUERY, {
        repositoryId: repository.id,
        after,
      });
      const history = response?.node?.defaultBranchRef?.target?.history;
      if (!history) break;
      for (const commit of history.nodes || []) {
        if (commitMatchesIdentity(commit.author, login, aliases)) matchingOids.add(commit.oid);
      }
      after = history.pageInfo?.hasNextPage ? history.pageInfo.endCursor : null;
    } while (after);

    return matchingOids.size;
  }));

  return {
    accessibleLinkedCommits,
    accessibleAuthoredCommits: repositoryCounts.reduce((sum, count) => sum + count, 0),
  };
}

// Backward-compatible export for callers using the previous function name.
export const fetchOwnedRepositoryCommitStats = fetchRepositoryCommitStats;

/** Fetches and aggregates each contribution year to produce lifetime totals. */
export async function fetchLifetimeContributions(graphqlClient, login, years, now = new Date()) {
  const uniqueYears = [...new Set((years || []).map(Number).filter(Number.isInteger))].sort();
  if (!uniqueYears.includes(now.getUTCFullYear())) uniqueYears.push(now.getUTCFullYear());

  const collections = [];
  for (const year of uniqueYears) {
    const range = getContributionYearRange(year, now);
    const response = await graphqlClient(GET_CONTRIBUTIONS_QUERY, { login, ...range });
    const collection = response?.user?.contributionsCollection;
    if (!collection) throw new Error(`GitHub did not return ${year} contributions for '${login}'.`);
    collections.push(collection);
  }

  return aggregateLifetimeContributions(collections);
}

/**
 * Calculates overall user statistics from GraphQL user data.
 * @param {object} user GraphQL user object
 * @returns {object} Aggregated overall stats
 */
export function calculateOverallStats(
  user,
  lifetimeContributions = null,
  repositoryCommitStats = null
) {
  const collection = user?.contributionsCollection || {};
  const totals = lifetimeContributions || collection;
  const repoNodes = user?.repositories?.nodes || [];

  const totalStars = repoNodes.reduce((sum, repo) => sum + (repo.stargazerCount || 0), 0);

  // With an authenticated viewer and read:user scope, GitHub includes accessible
  // private commits in this field. restrictedContributionsCount is deliberately
  // not added because it contains every restricted contribution type, not commits.
  const contributionCommits = totals.totalCommitContributions || 0;
  const accessibleLinkedCommits = repositoryCommitStats?.accessibleLinkedCommits ??
    repositoryCommitStats?.ownedLinkedCommits ?? 0;
  const accessibleAuthoredCommits = repositoryCommitStats?.accessibleAuthoredCommits ??
    repositoryCommitStats?.ownedAuthoredCommits ?? 0;
  const unscannedContributionCommits = Math.max(0, contributionCommits - accessibleLinkedCommits);
  const totalCommits = repositoryCommitStats
    ? accessibleAuthoredCommits + unscannedContributionCommits
    : contributionCommits;
  const totalPRs = totals.totalPullRequestContributions || 0;
  const totalIssues = totals.totalIssueContributions || 0;
  const totalReviews = totals.totalPullRequestReviewContributions || 0;
  const contributedTo = collection.totalRepositoryContributions || 0;

  return {
    totalStars,
    totalCommits,
    totalPRs,
    totalIssues,
    totalReviews,
    contributedTo,
  };
}

/**
 * Formats a YYYY-MM-DD date string into a human-readable format like "Aug 7, 2025".
 * @param {string} dateStr Date string YYYY-MM-DD
 * @returns {string} Formatted date string
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (monthIdx < 0 || monthIdx > 11 || isNaN(day)) return dateStr;
  return `${months[monthIdx]} ${day}, ${year}`;
}

/**
 * Calculates streak metrics from the GraphQL contribution calendar.
 * @param {object} contributionCalendar GraphQL contribution calendar
 * @returns {object} Aggregated streak metrics
 */
export function calculateStreakStats(contributionCalendar) {
  if (!contributionCalendar || !contributionCalendar.weeks) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalContributions: 0,
      totalDays: 0,
      streakRange: '',
    };
  }

  // Flatten weeks into a single array of contribution days
  const allDays = [];
  for (const week of contributionCalendar.weeks) {
    if (week.contributionDays) {
      allDays.push(...week.contributionDays);
    }
  }

  if (allDays.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalContributions: 0,
      totalDays: 0,
      streakRange: '',
    };
  }

  // Ensure days are sorted chronologically by date
  allDays.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));

  const totalDays = allDays.length;
  const totalContributions =
    contributionCalendar.totalContributions ??
    allDays.reduce((sum, day) => sum + (day.contributionCount || 0), 0);

  // Calculate longest streak
  let longestStreak = 0;
  let longestStreakStartStr = '';
  let longestStreakEndStr = '';
  let tempStreak = 0;
  let tempStreakStartStr = '';

  for (const day of allDays) {
    if (day.contributionCount > 0) {
      if (tempStreak === 0) tempStreakStartStr = day.date;
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
        longestStreakStartStr = tempStreakStartStr;
        longestStreakEndStr = day.date;
      }
    } else {
      tempStreak = 0;
    }
  }

  // Calculate current streak stepping backwards from the most recent day (today)
  let currentStreak = 0;
  let currentStreakStartStr = '';
  let currentStreakEndStr = '';
  const reversedDays = [...allDays].reverse();

  let startIndex = 0;
  if (reversedDays.length > 0 && reversedDays[0].contributionCount === 0) {
    // Today has no contributions yet; check if yesterday had activity
    if (reversedDays.length > 1 && reversedDays[1].contributionCount > 0) {
      startIndex = 1;
    } else {
      startIndex = -1; // Streak broken
    }
  }

  if (startIndex !== -1) {
    currentStreakEndStr = reversedDays[startIndex].date;
    for (let i = startIndex; i < reversedDays.length; i++) {
      if (reversedDays[i].contributionCount > 0) {
        currentStreak++;
        currentStreakStartStr = reversedDays[i].date; // Keeps updating as we go backwards, ending up at the start
      } else {
        break;
      }
    }
  }

  const startDateStr = allDays[0]?.date || '';
  const endDateStr = allDays[allDays.length - 1]?.date || '';
  const streakRange =
    startDateStr && endDateStr
      ? `${formatDate(startDateStr)} – ${formatDate(endDateStr)}`
      : '';

  const currentStreakRange =
    currentStreak > 0
      ? `${formatDate(currentStreakStartStr)} – ${formatDate(currentStreakEndStr)}`
      : formatDate(reversedDays[0]?.date) || '';
      
  const longestStreakRange =
    longestStreak > 0
      ? `${formatDate(longestStreakStartStr)} – ${formatDate(longestStreakEndStr)}`
      : '';

  return {
    currentStreak,
    currentStreakRange,
    longestStreak,
    longestStreakRange,
    totalContributions,
    totalDays,
    streakRange,
  };
}

/**
 * Aggregates top programming languages across repositories.
 * Filters out excluded languages and calculates percentage usage by byte count.
 * @param {Array} repoNodes Array of repository objects from GraphQL
 * @param {Array<string>} languageExclusions Array of language names to exclude
 * @returns {Array<object>} Array of language stats sorted by bytes descending
 */
export function aggregateTopLanguages(repoNodes = [], languageExclusions = []) {
  const exclusionsLower = (languageExclusions || []).map((ex) => ex.toLowerCase());
  const langMap = new Map();

  for (const repo of repoNodes || []) {
    const edges = repo.languages?.edges || [];
    for (const edge of edges) {
      const { size, node } = edge;
      if (!node || !node.name) continue;

      const langName = node.name;
      const langColor = node.color || '#858585';

      if (exclusionsLower.includes(langName.toLowerCase())) {
        continue;
      }

      if (langMap.has(langName)) {
        const existing = langMap.get(langName);
        existing.bytes += size;
      } else {
        langMap.set(langName, {
          name: langName,
          color: langColor,
          bytes: size,
        });
      }
    }
  }

  const totalBytes = Array.from(langMap.values()).reduce((sum, item) => sum + item.bytes, 0);

  const topLanguages = Array.from(langMap.values()).map((item) => {
    const percentage = totalBytes > 0 ? Number(((item.bytes / totalBytes) * 100).toFixed(2)) : 0;
    return {
      name: item.name,
      color: item.color,
      bytes: item.bytes,
      percentage,
    };
  });

  topLanguages.sort((a, b) => b.bytes - a.bytes);

  return topLanguages;
}

/**
 * Main function to fetch user data from GitHub GraphQL API or fallback mock dataset.
 * @param {string} [username] Target GitHub username (defaults to config.username)
 * @param {string} [token] GitHub PAT (defaults to config.githubToken)
 * @param {object} [options] Additional options (e.g., languageExclusions)
 * @returns {Promise<object>} Processed user metrics object
 */
export async function fetchUserData(
  username = config.username,
  token = config.githubToken,
  options = {}
) {
  const languageExclusions = options.languageExclusions || config.languageExclusions || [];
  const commitAuthorAliases = options.commitAuthorAliases || config.commitAuthorAliases || [];
  const targetUsername = username || 'Icetext';
  const allowMockData = options.allowMockData === true;

  if (!token || token.trim() === '') {
    if (!allowMockData) {
      throw new Error(
        'GITHUB_TOKEN is required. Refusing to generate inaccurate mock statistics.'
      );
    }
    const rawUserData = getMockUserData(targetUsername).user;
    return processUserData(rawUserData, languageExclusions);
  }

  if (options.validateToken !== false) {
    await validateTokenAccess(token, targetUsername, options.fetchImpl || globalThis.fetch);
  }

  const graphqlWithAuth = options.graphqlClient || graphql.defaults({
    headers: { authorization: `bearer ${token}` },
  });
  const profileResponse = await graphqlWithAuth(GET_USER_PROFILE_QUERY, { login: targetUsername });
  const rawUserData = profileResponse?.user;
  if (!rawUserData) throw new Error(`GitHub user '${targetUsername}' was not found.`);
  if (profileResponse.viewer?.login?.toLowerCase() !== targetUsername.toLowerCase()) {
    throw new Error('The authenticated GitHub viewer does not match the configured username.');
  }

  const [repoNodes, commitRepoNodes, lifetimeContributions] = await Promise.all([
    fetchAllRepositories(graphqlWithAuth, targetUsername, rawUserData.id),
    fetchCommitRepositories(graphqlWithAuth, rawUserData.id),
    fetchLifetimeContributions(
      graphqlWithAuth,
      targetUsername,
      rawUserData.contributionsCollection?.contributionYears
    ),
  ]);

  if (lifetimeContributions.restrictedContributionsCount > 0) {
    throw new Error(
      `The token cannot access ${lifetimeContributions.restrictedContributionsCount} private ` +
      'contribution(s). Authorize the PAT for every private repository and organization SSO.'
    );
  }

  const repositoryCommitStats = await fetchRepositoryCommitStats(
    graphqlWithAuth,
    commitRepoNodes,
    targetUsername,
    commitAuthorAliases
  );
  rawUserData.repositories = { nodes: repoNodes };
  return processUserData(
    rawUserData,
    languageExclusions,
    lifetimeContributions,
    repositoryCommitStats
  );
}

function processUserData(
  rawUserData,
  languageExclusions,
  lifetimeContributions = null,
  repositoryCommitStats = null
) {

  const user = {
    name: rawUserData.name || rawUserData.login || targetUsername,
    login: rawUserData.login || targetUsername,
    avatarUrl: rawUserData.avatarUrl || '',
  };

  const overallStats = calculateOverallStats(
    rawUserData,
    lifetimeContributions,
    repositoryCommitStats
  );
  const streakStats = calculateStreakStats(rawUserData.contributionsCollection?.contributionCalendar);
  const topLanguages = aggregateTopLanguages(rawUserData.repositories?.nodes || [], languageExclusions);

  return {
    user,
    overallStats,
    streakStats,
    topLanguages,
  };
}

/**
 * Convenience function to fetch stats using current config settings.
 * @param {object} [customOptions] Overrides for configuration
 * @returns {Promise<object>} Processed user metrics object
 */
export async function getUserStats(customOptions = {}) {
  const username = customOptions.username || config.username;
  const token = customOptions.githubToken || config.githubToken;
  const options = {
    languageExclusions: customOptions.languageExclusions || config.languageExclusions,
    commitAuthorAliases: customOptions.commitAuthorAliases || config.commitAuthorAliases,
    ...customOptions,
  };

  return fetchUserData(username, token, options);
}

// Standalone execution test run
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  console.log('=== Running Standalone GitHub Fetcher Test ===');
  getUserStats()
    .then((stats) => {
      console.log('\nUser Info:', stats.user);
      console.log('\nOverall Stats:', stats.overallStats);
      console.log('\nStreak Stats:', stats.streakStats);
      console.log('\nTop Languages (filtered):', stats.topLanguages);
      console.log('\n=== Fetcher Test Completed Successfully ===');
    })
    .catch((err) => {
      console.error('Fetcher test error:', err);
      process.exit(1);
    });
}
