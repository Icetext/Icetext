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
 * Renders SVG GitHub Top Languages Card.
 * @param {Array|object} data Array of language stats or object containing topLanguages
 * @param {string|object} [themeName='dark'] Theme key or custom palette
 * @param {object} [options] Custom rendering options
 * @returns {string} SVG string
 */
export function renderTopLangsCard(data = [], themeName = 'dark', options = {}) {
  const theme = getTheme(themeName);

  let languages = [];
  if (Array.isArray(data)) {
    languages = data;
  } else if (data && Array.isArray(data.topLanguages)) {
    languages = data.topLanguages;
  }

  const rawTitle = options.title || 'Most Used Languages';
  const title = rawTitle.length > 36 ? rawTitle.substring(0, 33) + '...' : rawTitle;
  const width = options.width || 495;
  const maxLangs = options.maxLangs || 6;

  // Take top N languages
  const topLangs = languages.slice(0, maxLangs);
  const rowCount = Math.ceil(topLangs.length / 2);

  // Dynamic height calculation: 3 rows (6 langs) => 150px
  const defaultHeight = topLangs.length === 0 ? 120 : 78 + (rowCount - 1) * 22 + 28;
  const height = options.height || defaultHeight;
  const borderRadius = options.borderRadius ?? theme.borderRadius ?? 10;

  // Recalculate relative percentages for topLangs if needed or use existing
  const barWidth = width - 50; // 445px for width=495
  const barHeight = 8;
  const barX = 25;
  const barY = 52;

  // Build segmented progress bar rects
  let currentX = barX;
  const barSegments = topLangs
    .map((lang, index) => {
      const segWidth = Math.max((lang.percentage / 100) * barWidth, 1);
      const rectX = currentX;
      currentX += segWidth;
      const animDelay = 200 + index * 80;

      return `<rect
        class="bar-segment"
        style="animation-delay: ${animDelay}ms"
        x="${rectX.toFixed(2)}"
        y="${barY}"
        width="${segWidth.toFixed(2)}"
        height="${barHeight}"
        fill="${lang.color || '#858585'}"
      />`;
    })
    .join('');

  // Build Grid items (2 columns x N rows)
  const gridItems = topLangs
    .map((lang, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);

      const itemX = col === 0 ? barX : 235;
      const itemY = 78 + row * 22;
      const animDelay = 300 + index * 100;

      const langColor = lang.color || '#858585';
      const pctStr = `${(lang.percentage || 0).toFixed(1)}%`;
      const displayName = lang.name && lang.name.length > 15 ? lang.name.substring(0, 13) + '...' : (lang.name || 'Unknown');

      return `
      <g class="stagger" style="animation-delay: ${animDelay}ms" transform="translate(${itemX}, ${itemY})">
        <circle cx="6" cy="6" r="5" fill="${langColor}" />
        <text x="18" y="6" class="lang-name" dominant-baseline="central">${escapeXml(displayName)}</text>
        <text x="175" y="6" text-anchor="end" class="lang-percent" dominant-baseline="central">${pctStr}</text>
      </g>`;
    })
    .join('');

  const emptyState = topLangs.length === 0
    ? `<text x="${width / 2}" y="${height / 2 + 10}" text-anchor="middle" class="stat-label" dominant-baseline="central">No language data available</text>`
    : '';

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
      font: 600 18px 'Segoe UI', Ubuntu, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      fill: ${theme.title_color};
      animation: fadeIn 0.8s ease-in-out forwards;
      dominant-baseline: central;
    }
    .lang-name {
      font: 600 13px 'Segoe UI', Ubuntu, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      fill: ${theme.text_color};
      dominant-baseline: central;
    }
    .lang-percent {
      font: 400 13px 'Segoe UI', Ubuntu, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      fill: ${theme.icon_color};
      dominant-baseline: central;
    }
    .bar-segment {
      opacity: 0;
      animation: fadeIn 0.5s ease-in-out forwards;
    }
    .stagger {
      opacity: 0;
      animation: fadeIn 0.5s ease-in-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
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

  <g transform="translate(25, 25)">
    <!-- Code Bracket Header Icon -->
    <svg fill="${theme.title_color}" height="20" viewBox="0 0 16 16" version="1.1" width="20" aria-hidden="true">
      <path fill-rule="evenodd" d="M4.72 3.22a.75.75 0 011.06 1.06L2.06 8l3.72 3.72a.75.75 0 11-1.06 1.06L.47 8.53a.75.75 0 010-1.06l4.25-4.25zm6.56 0a.75.75 0 10-1.06 1.06L13.94 8l-3.72 3.72a.75.75 0 101.06 1.06l4.25-4.25a.75.75 0 000-1.06l-4.25-4.25z"/>
    </svg>
    <text x="30" y="10" class="header" dominant-baseline="central">${escapeXml(title)}</text>
  </g>

  ${
    topLangs.length > 0
      ? `
  <!-- Segmented Progress Bar -->
  <g>
    <defs>
      <clipPath id="bar-clip">
        <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="5" />
      </clipPath>
    </defs>
    <!-- Background track -->
    <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="5" fill="${theme.border_color}" opacity="0.4" />
    <g clip-path="url(#bar-clip)">
      ${barSegments}
    </g>
  </g>

  <!-- Language Grid -->
  <g>
    ${gridItems}
  </g>
  `
      : emptyState
  }
</svg>`;
}
