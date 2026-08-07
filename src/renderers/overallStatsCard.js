import { getTheme } from './theme.js';

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString('en-US') : '0';
}

export function calculateRank(stats = {}) {
  const score =
    (stats.totalCommits || 0) +
    (stats.totalPRs || 0) * 2 +
    (stats.totalIssues || 0) +
    (stats.totalStars || 0) * 4 +
    (stats.totalReviews || 0) * 2 +
    (stats.contributedTo || 0) * 3;

  if (score >= 2500) return { rank: 'S+', score, percentile: 98 };
  if (score >= 1500) return { rank: 'S', score, percentile: 90 };
  if (score >= 800) return { rank: 'A+', score, percentile: 80 };
  if (score >= 400) return { rank: 'A', score, percentile: 65 };
  if (score >= 200) return { rank: 'B+', score, percentile: 50 };
  if (score >= 100) return { rank: 'B', score, percentile: 35 };
  return { rank: 'C', score, percentile: 20 };
}

/** Render the profile overview card shown at the top of the README stats block. */
export function renderOverallStatsCard(data = {}, themeName = 'dark', options = {}) {
  const theme = getTheme(themeName);
  const stats = data.overallStats || data;
  const username = options.username || data.user?.name || data.user?.login || 'User';
  const rawTitle = options.title || `${username}'s GitHub Stats`;
  const title = rawTitle.length > 34 ? `${rawTitle.slice(0, 31)}...` : rawTitle;
  const width = options.overallWidth || options.width || 495;
  const height = options.overallHeight || 215;
  const borderRadius = options.borderRadius ?? 6;
  const { rank } = calculateRank(stats);

  const rows = [
    ['Total Stars Earned:', stats.totalStars],
    ['Total Commits:', stats.totalCommits],
    ['Total PRs:', stats.totalPRs],
    ['Total Issues:', stats.totalIssues],
    ['Contributed to (last year):', stats.contributedTo],
  ]
    .map(([label, value], index) => `
    <g class="row" style="animation-delay:${150 + index * 80}ms">
      <text x="27" y="${70 + index * 27}" class="stat-label">${escapeXml(label)}</text>
      <text x="247" y="${70 + index * 27}" class="stat-value">${formatNumber(value)}</text>
    </g>`)
    .join('');

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(title)}">
  <style>
    .header,.stat-label,.stat-value,.rank { font-family:'Segoe UI',Ubuntu,-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif; dominant-baseline:middle; }
    .header { font-size:18px; font-weight:600; fill:${theme.title_color}; }
    .stat-label,.stat-value { font-size:14px; font-weight:600; fill:${theme.text_color}; }
    .rank { font-size:26px; font-weight:700; fill:${theme.text_color}; text-anchor:middle; }
    .row { opacity:0; animation:fadeIn .45s ease-out forwards; }
    @keyframes fadeIn { to { opacity:1; } }
  </style>
  <rect x=".75" y=".75" width="${width - 1.5}" height="${height - 1.5}" rx="${borderRadius}" fill="${theme.bg_color}" stroke="${theme.text_color}" stroke-width="1.5"/>
  <text x="27" y="34" class="header">${escapeXml(title)}</text>
  ${rows.trimStart()}
  <g transform="translate(${width - 104},121)">
    <circle r="44" fill="none" stroke="${theme.border_color}" stroke-width="7"/>
    <circle cy="-44" r="4" fill="${theme.accent_color}"/>
    <text y="1" class="rank">${escapeXml(rank)}</text>
  </g>
</svg>`;
}
