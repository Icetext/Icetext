/**
 * GraphQL Query for fetching GitHub profile statistics.
 * Retrieves user details, contribution collection (commits, issues, PRs, reviews, calendar, restricted count),
 * and repository language usage and stargazer counts.
 */
export const GET_USER_STATS_QUERY = `
  query getUserStats($login: String!) {
    user(login: $login) {
      name
      login
      avatarUrl
      contributionsCollection {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
              color
            }
          }
        }
      }
      repositories(
        first: 100
        ownerAffiliations: OWNER
        isFork: false
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes {
          name
          stargazerCount
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
      }
    }
  }
`;
