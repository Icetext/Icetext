import { getTheme } from './theme.js';

/**
 * Escapes special XML characters in text strings.
 * @param {string} str Raw string
 * @returns {string} XML-safe string
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Formats numbers with commas (e.g. 1234 -> 1,234).
 * @param {number} num Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-US');
}

/**
 * Calculates rank grade and percentile based on user performance metrics.
 * @param {object} stats Performance metrics
 * @returns {object} { rank, score, percentile }
 */
export function calculateRank(stats = {}) {
  const totalCommits = stats.totalCommits || 0;
  const totalPRs = stats.totalPRs || 0;
  const totalIssues = stats.totalIssues || 0;
  const totalStars = stats.totalStars || 0;
  const totalReviews = stats.totalReviews || 0;
  const contributedTo = stats.contributedTo || 0;

  const COMMITS_WEIGHT = 1;
  const PRS_WEIGHT = 2;
  const ISSUES_WEIGHT = 1;
  const STARS_WEIGHT = 4;
  const REVIEWS_WEIGHT = 2;
  const CONTRIBUTED_WEIGHT = 3;

  const score =
    totalCommits * COMMITS_WEIGHT +
    totalPRs * PRS_WEIGHT +
    totalIssues * ISSUES_WEIGHT +
    totalStars * STARS_WEIGHT +
    totalReviews * REVIEWS_WEIGHT +
    contributedTo * CONTRIBUTED_WEIGHT;

  let rank = 'C';
  let percentile = 25;

  if (score >= 2500) {
    rank = 'S+';
    percentile = 98;
  } else if (score >= 1500) {
    rank = 'S';
    percentile = 90;
  } else if (score >= 800) {
    rank = 'A+';
    percentile = 80;
  } else if (score >= 400) {
    rank = 'A';
    percentile = 65;
  } else if (score >= 200) {
    rank = 'B+';
    percentile = 50;
  } else if (score >= 100) {
    rank = 'B';
    percentile = 35;
  } else {
    rank = 'C';
    percentile = 20;
  }

  return { rank, score, percentile };
}

/**
 * Renders SVG GitHub Overall Stats Card.
 * @param {object} data Raw data containing overallStats and user info, or directly overallStats
 * @param {string|object} [themeName='dark'] Theme key or custom palette
 * @param {object} [options] Custom rendering options
 * @returns {string} SVG string
 */
export function renderOverallStatsCard(data = {}, themeName = 'dark', options = {}) {
  const theme = getTheme(themeName);

  // Extract stats and username flexibly
  let stats = {};
  let username = options.username || 'User';

  if (data.overallStats) {
    stats = data.overallStats;
    username = options.username || data.user?.name || data.user?.login || 'User';
  } else {
    stats = data;
  }

  const { rank, percentile } = calculateRank(stats);

  const title = options.title || `${username}'s GitHub Stats`;
  const width = options.width || 495;
  const height = options.height || 195;
  const borderRadius = options.borderRadius ?? theme.borderRadius ?? 10;

  // Metric items configuration
  const items = [
    {
      id: 'stars',
      label: 'Total Stars:',
      value: formatNumber(stats.totalStars),
      icon: `<path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>`,
    },
    {
      id: 'commits',
      label: 'Total Commits:',
      value: formatNumber(stats.totalCommits),
      icon: `<path fill-rule="evenodd" d="M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43 0a3.993 3.993 0 01-2.68 3.782v3.718a.75.75 0 01-1.5 0v-3.718A3.993 3.993 0 015.07 7.75H1.75a.75.75 0 010-1.5h3.32a3.993 3.993 0 012.68-3.782V.75a.75.75 0 011.5 0v1.718a3.993 3.993 0 012.68 3.782h3.32a.75.75 0 010 1.5h-3.32z"/>`,
    },
    {
      id: 'prs',
      label: 'Total PRs:',
      value: formatNumber(stats.totalPRs),
      icon: `<path fill-rule="evenodd" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 018.75 3.25zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5zm7.5 0a.75.75 0 100 1.5.75.75 0 000-1.5z"/>`,
    },
    {
      id: 'issues',
      label: 'Total Issues:',
      value: formatNumber(stats.totalIssues),
      icon: `<path fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"/>`,
    },
    {
      id: 'contrib',
      label: 'Contributed to:',
      value: formatNumber(stats.contributedTo),
      icon: `<path fill-rule="evenodd" d="M2 2.5A1.5 1.5 0 013.5 1h9A1.5 1.5 0 0114 2.5v11a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 13.5v-11zM3.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h9a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-9zM5 4.75A.75.75 0 015.75 4h4.5a.75.75 0 010 1.5h-4.5A.75.75 0 015 4.75zm0 3A.75.75 0 015.75 7h4.5a.75.75 0 010 1.5h-4.5A.75.75 0 015 7.75zm0 3a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75z"/>`,
    },
  ];

  // Circle geometry for Rank Ring
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentile) / 100;

  // Generate metric SVG rows
  const itemRows = items
    .map((item, index) => {
      const y = 62 + index * 25;
      const animDelay = 150 + index * 100;

      return `
      <g class="stagger" style="animation-delay: ${animDelay}ms" transform="translate(25, ${y})">
        <svg class="icon" viewBox="0 0 16 16" version="1.1" width="16" height="16" fill="${theme.icon_color}">
          ${item.icon}
        </svg>
        <text class="stat-label" x="25" y="12.5">${escapeXml(item.item_label || item.label)}</text>
        <text class="stat-value" x="170" y="12.5">${escapeXml(item.value)}</text>
        ${
          item.note
            ? `<text class="stat-note" x="220" y="12.5">${escapeXml(item.note)}</text>`
            : ''
        }
      </g>`;
    })
    .join('');

  return `<svg
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label="${escapeXml(title)}"
>
  <style>
    .header {
      font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif, -apple-system;
      fill: ${theme.title_color};
      animation: fadeIn 0.8s ease-in-out forwards;
    }
    .stat-label {
      font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif, -apple-system;
      fill: ${theme.text_color};
    }
    .stat-value {
      font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif, -apple-system;
      fill: ${theme.text_color};
    }
    .stat-note {
      font: 400 11px 'Segoe UI', Ubuntu, Sans-Serif, -apple-system;
      fill: ${theme.icon_color};
      opacity: 0.8;
    }
    .rank-text {
      font: 700 24px 'Segoe UI', Ubuntu, Sans-Serif, -apple-system;
      fill: ${theme.title_color};
    }
    .rank-label {
      font: 500 11px 'Segoe UI', Ubuntu, Sans-Serif, -apple-system;
      fill: ${theme.text_color};
      opacity: 0.75;
    }
    .stagger {
      opacity: 0;
      animation: fadeIn 0.5s ease-in-out forwards;
    }
    .rank-ring {
      stroke-dasharray: ${circumference.toFixed(2)};
      stroke-dashoffset: ${circumference.toFixed(2)};
      animation: rankRingAnim 1.2s ease-in-out forwards 0.3s;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes rankRingAnim {
      to { stroke-dashoffset: ${strokeDashoffset.toFixed(2)}; }
    }
  </style>

  <rect
    x="0.5"
    y="0.5"
    rx="${borderRadius}"
    width="${width - 1}"
    height="${height - 1}"
    fill="${theme.bg_color}"
    stroke="${theme.border_color}"
    stroke-opacity="1"
  />

  <g transform="translate(25, 35)">
    <!-- Octicon GitHub Header Icon -->
    <svg fill="${theme.title_color}" height="20" viewBox="0 0 16 16" version="1.1" width="20" aria-hidden="true">
      <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
    <text x="30" y="15" class="header">${escapeXml(title)}</text>
  </g>

  <!-- Left Column: Metrics -->
  <g>
    ${itemRows}
  </g>

  <!-- Right Column: Rank Badge -->
  <g transform="translate(${width - 95}, ${height / 2 + 5})">
    <!-- Rank Outer Circular Ring Background -->
    <circle
      cx="0"
      cy="0"
      r="${radius}"
      fill="none"
      stroke="${theme.border_color}"
      stroke-width="6"
    />
    <!-- Animated Rank Circle Progress Ring -->
    <circle
      class="rank-ring"
      cx="0"
      cy="0"
      r="${radius}"
      fill="none"
      stroke="${theme.accent_color}"
      stroke-width="6"
      stroke-linecap="round"
      transform="rotate(-90)"
    />
    <!-- Rank Text Inside Ring -->
    <text cx="0" cy="0" x="0" y="8" text-anchor="middle" class="rank-text">${escapeXml(rank)}</text>
    <!-- Rank Label Below Ring -->
    <text x="0" y="58" text-anchor="middle" class="rank-label">Rank Grade</text>
  </g>
</svg>`;
}
