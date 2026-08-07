/** Fetches the authenticated viewer and the profile's rolling one-year calendar. */
export const GET_USER_PROFILE_QUERY = `
  query getUserProfile($login: String!) {
    viewer {
      login
    }
    user(login: $login) {
      name
      login
      avatarUrl
      contributionsCollection {
        contributionYears
        restrictedContributionsCount
        totalRepositoryContributions
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
    }
  }
`;

/** Fetches one bounded contribution period. GitHub limits a collection to one year. */
export const GET_CONTRIBUTIONS_QUERY = `
  query getContributions($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions
        restrictedContributionsCount
      }
    }
  }
`;

/** Fetches one page of owned, non-fork repositories for stars and language totals. */
export const GET_REPOSITORIES_QUERY = `
  query getRepositories($login: String!, $after: String) {
    user(login: $login) {
      repositories(
        first: 100
        after: $after
        ownerAffiliations: OWNER
        isFork: false
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes {
          name
          stargazerCount
          languages(first: 100, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;
