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
 * Renders SVG GitHub Streak Stats Card.
 * @param {object} data Object containing streakStats or directly streakStats
 * @param {string|object} [themeName='dark'] Theme key or custom palette
 * @param {object} [options] Custom rendering options
 * @returns {string} SVG string
 */
export function renderStreakCard(data = {}, themeName = 'dark', options = {}) {
  const theme = getTheme(themeName);

  let streakStats = {};
  if (data.streakStats) {
    streakStats = data.streakStats;
  } else {
    streakStats = data;
  }

  const title = options.title || 'GitHub Streak Stats';
  const width = options.width || 495;
  const height = options.height || 150;
  const borderRadius = options.borderRadius ?? theme.borderRadius ?? 10;

  const totalContributions = streakStats.totalContributions || 0;
  const currentStreak = streakStats.currentStreak || 0;
  const longestStreak = streakStats.longestStreak || 0;
  const streakRange = streakStats.streakRange ? (streakStats.streakRange.length > 26 ? streakStats.streakRange.substring(0, 23) + '...' : streakStats.streakRange) : '';
  const rawCurrentRange = streakStats.currentStreakRange || (currentStreak > 0 ? 'Active' : 'No Active Streak');
  const currentStreakRange = rawCurrentRange.length > 26 ? rawCurrentRange.substring(0, 23) + '...' : rawCurrentRange;
  const rawLongestRange = streakStats.longestStreakRange || streakRange;
  const longestStreakRange = rawLongestRange.length > 26 ? rawLongestRange.substring(0, 23) + '...' : rawLongestRange;

  // Flame SVG path
  const flameIconPath = `M7.75 0C6.67 2.05 4.5 3.5 4.5 6a3.5 3.5 0 007 0c0-1.25-.5-2.25-1.5-3.25.1.75-.15 1.5-.75 2-.5.42-1.25.42-1.75-.15-.5-.57-.5-1.5-.5-2.6 0-.85.3-1.4.75-2z`;

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
    .stat-number {
      font: 700 28px 'Segoe UI', Ubuntu, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      fill: ${theme.title_color};
      dominant-baseline: central;
    }
    .stat-label {
      font: 600 13px 'Segoe UI', Ubuntu, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      fill: ${theme.text_color};
      dominant-baseline: central;
    }
    .stat-range {
      font: 400 11px 'Segoe UI', Ubuntu, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      fill: ${theme.icon_color};
      opacity: 0.85;
      dominant-baseline: central;
    }
    .fire-icon {
      fill: ${theme.fire_color};
      transform-box: fill-box;
      transform-origin: center;
      animation: flamePulse 1.5s infinite ease-in-out alternate;
    }
    .divider {
      stroke: ${theme.border_color};
      stroke-width: 1;
      stroke-opacity: 0.7;
    }
    .fade-in {
      opacity: 0;
      animation: fadeIn 0.6s ease-in-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes flamePulse {
      0% { transform: scale(1); }
      100% { transform: scale(1.1); }
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

  <!-- Divider Lines -->
  <line class="divider" x1="165" y1="25" x2="165" y2="125" />
  <line class="divider" x1="330" y1="25" x2="330" y2="125" />

  <!-- Block 1: Total Contributions -->
  <g class="fade-in" style="animation-delay: 150ms" transform="translate(82.5, 32)">
    <!-- Calendar/Activity Icon -->
    <svg x="-10" y="0" fill="${theme.icon_color}" height="20" width="20" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M4.75 0a.75.75 0 01.75.75V2h5V.75a.75.75 0 011.5 0V2h1.25A1.75 1.75 0 0115 3.75v10.5A1.75 1.75 0 0113.25 16H2.75A1.75 1.75 0 011 14.25V3.75A1.75 1.75 0 012.75 2H4V.75A.75.75 0 014.75 0zm0 3.5h8.5a.25.25 0 01.25.25V6H2.5V3.75a.25.25 0 01.25-.25h2zm-2.25 4v6.75c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25V7.5H2.5z"/>
    </svg>
    <text x="0" y="30" text-anchor="middle" class="stat-number" dominant-baseline="central">${formatNumber(totalContributions)}</text>
    <text x="0" y="54" text-anchor="middle" class="stat-label" dominant-baseline="central">Total Contributions</text>
    <text x="0" y="72" text-anchor="middle" class="stat-range" dominant-baseline="central">${escapeXml(streakRange)}</text>
  </g>

  <!-- Block 2: Current Streak (Highlighted) -->
  <g class="fade-in" style="animation-delay: 300ms" transform="translate(247.5, 30)">
    <!-- Animated Flame Icon -->
    <g transform="translate(0, 0)">
      <svg class="fire-icon" x="-12" y="-2" height="24" width="24" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="${flameIconPath}"/>
      </svg>
    </g>
    <text x="0" y="30" text-anchor="middle" class="stat-number" dominant-baseline="central">${formatNumber(currentStreak)}</text>
    <text x="0" y="54" text-anchor="middle" class="stat-label" dominant-baseline="central">Current Streak</text>
    <text x="0" y="72" text-anchor="middle" class="stat-range" dominant-baseline="central">${escapeXml(currentStreakRange)}</text>
  </g>

  <!-- Block 3: Longest Streak -->
  <g class="fade-in" style="animation-delay: 450ms" transform="translate(412.5, 32)">
    <!-- Crown / Zap Icon -->
    <svg x="-10" y="0" fill="${theme.icon_color}" height="20" width="20" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M8 1.5a.75.75 0 01.65.375l2.25 3.75a.75.75 0 01-.15.938l-2.25 2.25a.75.75 0 01-1 0L5.25 6.563a.75.75 0 01-.15-.938l2.25-3.75A.75.75 0 018 1.5zM2.5 13.5a.75.75 0 01.75-.75h9.5a.75.75 0 010 1.5h-9.5a.75.75 0 01-.75-.75z"/>
    </svg>
    <text x="0" y="30" text-anchor="middle" class="stat-number" dominant-baseline="central">${formatNumber(longestStreak)}</text>
    <text x="0" y="54" text-anchor="middle" class="stat-label" dominant-baseline="central">Longest Streak</text>
    <text x="0" y="72" text-anchor="middle" class="stat-range" dominant-baseline="central">${escapeXml(longestStreakRange || streakRange)}</text>
  </g>
</svg>`;
}
