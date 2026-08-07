/**
 * Realistic mock dataset fallback for user 'Icetext' when GITHUB_TOKEN is missing or unauthenticated.
 */

function generateMockCalendar() {
  const weeks = [];
  const today = new Date();
  const daysTotal = 364; // 52 weeks * 7 days
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - daysTotal);

  let currentDate = new Date(startDate);
  let totalContributions = 0;

  for (let w = 0; w < 52; w++) {
    const contributionDays = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const daysFromEnd = Math.floor((today - currentDate) / (1000 * 60 * 60 * 24));

      let count = 0;

      // Current streak: Last 15 days (daysFromEnd 0 to 14)
      if (daysFromEnd <= 14) {
        count = Math.floor(Math.random() * 6) + 3; // 3 - 8 contributions
      }
      // Longest streak simulation: daysFromEnd 150 to 197 (48 days total)
      else if (daysFromEnd >= 150 && daysFromEnd <= 197) {
        count = Math.floor(Math.random() * 8) + 2; // 2 - 9 contributions
      }
      // General activity pattern (50% active days)
      else if ((w * 7 + d) % 3 !== 0) {
        count = Math.floor(Math.random() * 5) + 1;
      }

      totalContributions += count;

      let color = '#161b22';
      if (count >= 10) color = '#39d353';
      else if (count >= 6) color = '#26a641';
      else if (count >= 3) color = '#006d32';
      else if (count >= 1) color = '#0e4429';

      contributionDays.push({
        contributionCount: count,
        date: dateStr,
        color,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push({ contributionDays });
  }

  return {
    totalContributions,
    weeks,
  };
}

/**
 * Returns raw GraphQL mock response structure for a user.
 * @param {string} [username='Icetext']
 * @returns {object} Mock user GraphQL response node
 */
export function getMockUserData(username = 'Icetext') {
  return {
    user: {
      name: username === 'Icetext' ? 'Icetext' : username,
      login: username,
      avatarUrl: 'https://avatars.githubusercontent.com/u/10000000?v=4',
      contributionsCollection: {
        totalCommitContributions: 845,
        totalIssueContributions: 32,
        totalPullRequestContributions: 67,
        totalPullRequestReviewContributions: 24,
        totalRepositoryContributions: 15,
        restrictedContributionsCount: 182,
        contributionCalendar: generateMockCalendar(),
      },
      repositories: {
        nodes: [
          {
            name: 'github-profile-stats',
            stargazerCount: 24,
            languages: {
              edges: [
                { size: 145000, node: { name: 'JavaScript', color: '#f1e05a' } },
                { size: 35000, node: { name: 'HTML', color: '#e34c26' } },
                { size: 25000, node: { name: 'CSS', color: '#563d7c' } },
              ],
            },
          },
          {
            name: 'awesome-tools-cli',
            stargazerCount: 18,
            languages: {
              edges: [
                { size: 185000, node: { name: 'TypeScript', color: '#3178c6' } },
                { size: 65000, node: { name: 'JavaScript', color: '#f1e05a' } },
              ],
            },
          },
          {
            name: 'python-data-services',
            stargazerCount: 12,
            languages: {
              edges: [
                { size: 110000, node: { name: 'Python', color: '#3572A5' } },
                { size: 40000, node: { name: 'TypeScript', color: '#3178c6' } },
              ],
            },
          },
          {
            name: 'systems-kernel-lab',
            stargazerCount: 8,
            languages: {
              edges: [
                { size: 75000, node: { name: 'Rust', color: '#dea584' } },
                { size: 30000, node: { name: 'Go', color: '#00ADD8' } },
              ],
            },
          },
        ],
      },
    },
  };
}
