import { graphql } from '@octokit/graphql';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { GET_USER_STATS_QUERY } from './queries.js';
import { getMockUserData } from './mockData.js';

/**
 * Calculates overall user statistics from GraphQL user data.
 * @param {object} user GraphQL user object
 * @returns {object} Aggregated overall stats
 */
export function calculateOverallStats(user) {
  const collection = user?.contributionsCollection || {};
  const repoNodes = user?.repositories?.nodes || [];

  const totalStars = repoNodes.reduce((sum, repo) => sum + (repo.stargazerCount || 0), 0);

  // Total commits includes public commits and restricted (private) commit contributions
  const commitContributions = collection.totalCommitContributions || 0;
  const restrictedContributions = collection.restrictedContributionsCount || 0;
  const totalCommits = commitContributions + restrictedContributions;

  const totalPRs = collection.totalPullRequestContributions || 0;
  const totalIssues = collection.totalIssueContributions || 0;
  const totalReviews = collection.totalPullRequestReviewContributions || 0;
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
  const targetUsername = username || 'Icetext';

  let rawUserData = null;

  if (token && token.trim() !== '') {
    try {
      const graphqlWithAuth = graphql.defaults({
        headers: {
          authorization: `bearer ${token}`,
        },
      });

      const response = await graphqlWithAuth(GET_USER_STATS_QUERY, {
        login: targetUsername,
      });

      if (response && response.user) {
        rawUserData = response.user;
      } else {
        console.warn(`[Fetcher] User '${targetUsername}' not found in GraphQL response. Falling back to mock dataset.`);
      }
    } catch (error) {
      console.warn(`[Fetcher] GitHub GraphQL API call failed (${error.message}). Falling back to mock dataset.`);
    }
  } else {
    console.log(`[Fetcher] No valid GITHUB_TOKEN provided. Using fallback mock dataset for user '${targetUsername}'.`);
  }

  // Fallback to mock dataset if needed
  if (!rawUserData) {
    const mockPayload = getMockUserData(targetUsername);
    rawUserData = mockPayload.user;
  }

  const user = {
    name: rawUserData.name || rawUserData.login || targetUsername,
    login: rawUserData.login || targetUsername,
    avatarUrl: rawUserData.avatarUrl || '',
  };

  const overallStats = calculateOverallStats(rawUserData);
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
