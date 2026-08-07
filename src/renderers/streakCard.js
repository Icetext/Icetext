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

function truncate(value, maxLength = 27) {
  const text = String(value || '');
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

/** Render the three-column contribution streak card from the reference design. */
export function renderStreakCard(data = {}, themeName = 'dark', options = {}) {
  const theme = getTheme(themeName);
  const stats = data.streakStats || data;
  const width = options.streakWidth || 545;
  const height = options.streakHeight || 215;
  const borderRadius = options.borderRadius ?? 6;
  const currentStreak = stats.currentStreak || 0;
  const leftRange = truncate(stats.streakRange);
  const currentRange = truncate(stats.currentStreakRange || (currentStreak > 0 ? 'Active' : 'No Active Streak'));
  const longestRange = truncate(stats.longestStreakRange || stats.streakRange);
  const firstDivider = width / 3;
  const secondDivider = (width / 3) * 2;
  const centers = [width / 6, width / 2, (width / 6) * 5];

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="GitHub streak statistics">
  <style>
    .number,.label,.range { font-family:'Segoe UI',Ubuntu,-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif; text-anchor:middle; dominant-baseline:middle; }
    .number { font-size:28px; font-weight:700; fill:${theme.text_color}; }
    .label { font-size:14px; font-weight:400; fill:${theme.text_color}; }
    .range { font-size:12px; font-weight:400; fill:${theme.text_color}; opacity:.9; }
    .current-number { fill:${theme.icon_color}; }
    .current-label { fill:${theme.icon_color}; font-weight:700; }
    .column { opacity:0; animation:fadeIn .5s ease-out forwards; }
    @keyframes fadeIn { to { opacity:1; } }
  </style>
  <rect x=".75" y=".75" width="${width - 1.5}" height="${height - 1.5}" rx="${borderRadius}" fill="${theme.bg_color}" stroke="${theme.text_color}" stroke-width="1.5"/>
  <line x1="${firstDivider}" y1="30" x2="${firstDivider}" y2="187" stroke="${theme.text_color}" stroke-width="1" opacity=".8"/>
  <line x1="${secondDivider}" y1="30" x2="${secondDivider}" y2="187" stroke="${theme.text_color}" stroke-width="1" opacity=".8"/>
  <g class="column" style="animation-delay:120ms">
    <text x="${centers[0]}" y="78" class="number">${formatNumber(stats.totalContributions)}</text>
    <text x="${centers[0]}" y="118" class="label">Total Contributions</text>
    <text x="${centers[0]}" y="151" class="range">${escapeXml(leftRange)}</text>
  </g>
  <g class="column" style="animation-delay:240ms">
    <circle cx="${centers[1]}" cy="75" r="43" fill="none" stroke="${theme.accent_color}" stroke-width="5"/>
    <path d="M ${centers[1]} 23 C ${centers[1] - 8} 32,${centers[1] - 10} 40,${centers[1]} 44 C ${centers[1] + 9} 40,${centers[1] + 8} 31,${centers[1] + 2} 26 C ${centers[1] + 3} 32,${centers[1] - 1} 35,${centers[1] - 3} 32 C ${centers[1] - 4} 29,${centers[1] - 2} 26,${centers[1]} 23 Z" fill="${theme.accent_color}" stroke="${theme.bg_color}" stroke-width="4"/>
    <text x="${centers[1]}" y="76" class="number current-number">${formatNumber(currentStreak)}</text>
    <text x="${centers[1]}" y="145" class="label current-label">Current Streak</text>
    <text x="${centers[1]}" y="174" class="range">${escapeXml(currentRange)}</text>
  </g>
  <g class="column" style="animation-delay:360ms">
    <text x="${centers[2]}" y="78" class="number">${formatNumber(stats.longestStreak)}</text>
    <text x="${centers[2]}" y="118" class="label">Longest Streak</text>
    <text x="${centers[2]}" y="151" class="range">${escapeXml(longestRange)}</text>
  </g>
</svg>`;
}
