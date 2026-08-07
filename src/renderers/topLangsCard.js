import { getTheme } from './theme.js';

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Render the compact language card used at the bottom of the stats block. */
export function renderTopLangsCard(data = [], themeName = 'dark', options = {}) {
  const theme = getTheme(themeName);
  const languages = Array.isArray(data) ? data : data?.topLanguages || [];
  const width = options.languagesWidth || 330;
  const maxLangs = options.maxLangs || 6;
  const topLangs = languages.slice(0, maxLangs).map((language, index) => ({
    ...language,
    color:
      themeName === 'catppuccin'
        ? ['#89b4fa', '#f9e2af', '#cba6f7', '#fab387', '#94e2d5', '#a6e3a1'][index]
        : language.color || '#858585',
  }));
  const rowCount = Math.max(1, Math.ceil(topLangs.length / 2));
  const height = options.languagesHeight || (topLangs.length ? 108 + rowCount * 24 : 120);
  const borderRadius = options.borderRadius ?? 6;
  const title = options.title || 'Most Used Languages';
  const barX = 27;
  const barY = 65;
  const barWidth = width - 54;
  let segmentX = barX;

  const segments = topLangs.map((language, index) => {
    const segmentWidth = Math.max(0, (Number(language.percentage) || 0) * barWidth / 100);
    const segment = `<rect class="fade" style="animation-delay:${150 + index * 60}ms" x="${segmentX.toFixed(2)}" y="${barY}" width="${segmentWidth.toFixed(2)}" height="8" fill="${language.color}"/>`;
    segmentX += segmentWidth;
    return segment;
  }).join('');

  const items = topLangs.map((language, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = column === 0 ? 27 : width / 2 + 6;
    const y = 101 + row * 24;
    const name = String(language.name || 'Unknown');
    const displayName = name.length > 12 ? `${name.slice(0, 10)}...` : name;
    const percentage = Number(language.percentage) || 0;
    return `<g class="fade" style="animation-delay:${250 + index * 70}ms">
      <circle cx="${x + 5}" cy="${y}" r="5" fill="${language.color}"/>
      <text x="${x + 16}" y="${y}" class="language">${escapeXml(displayName)} ${percentage.toFixed(2)}%</text>
    </g>`;
  }).join('');

  const content = topLangs.length
    ? `<defs><clipPath id="language-bar"><rect x="${barX}" y="${barY}" width="${barWidth}" height="8" rx="4"/></clipPath></defs>
  <rect x="${barX}" y="${barY}" width="${barWidth}" height="8" rx="4" fill="${theme.border_color}"/>
  <g clip-path="url(#language-bar)">${segments}</g>${items}`
    : `<text x="${width / 2}" y="78" class="empty">No language data available</text>`;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(title)}">
  <style>
    .header,.language,.empty { font-family:'Segoe UI',Ubuntu,-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif; dominant-baseline:middle; }
    .header { font-size:18px; font-weight:600; fill:${theme.title_color}; }
    .language { font-size:11px; font-weight:400; fill:${theme.text_color}; }
    .empty { font-size:12px; fill:${theme.text_color}; text-anchor:middle; }
    .fade { opacity:0; animation:fadeIn .45s ease-out forwards; }
    @keyframes fadeIn { to { opacity:1; } }
  </style>
  <rect x=".75" y=".75" width="${width - 1.5}" height="${height - 1.5}" rx="${borderRadius}" fill="${theme.bg_color}" stroke="${theme.text_color}" stroke-width="1.5"/>
  <text x="27" y="34" class="header">${escapeXml(title)}</text>
  ${content}
</svg>`;
}
