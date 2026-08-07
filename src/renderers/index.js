import fs from 'node:fs';
import path from 'node:path';
import { themes, getTheme } from './theme.js';
import { renderOverallStatsCard } from './overallStatsCard.js';
import { renderTopLangsCard } from './topLangsCard.js';
import { renderStreakCard } from './streakCard.js';

export {
  themes,
  getTheme,
  renderOverallStatsCard,
  renderTopLangsCard,
  renderStreakCard,
};

/**
 * Generates all SVG cards and exports them to specified output directory.
 * @param {object} data User stats payload containing overallStats, streakStats, topLanguages, user
 * @param {string} outputDir Path to directory where SVGs will be saved
 * @param {object} [options] Custom rendering options (e.g. theme)
 * @returns {object} Paths of generated SVG files
 */
export function exportSVGCards(data, outputDir, options = {}) {
  const themeName = options.theme || 'dark';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Overall Stats Card -> github-stats.svg
  const overallStatsSvg = renderOverallStatsCard(data, themeName, options);
  const overallStatsPath = path.join(outputDir, 'github-stats.svg');
  fs.writeFileSync(overallStatsPath, overallStatsSvg, 'utf-8');

  // 2. Top Languages Card -> top-langs.svg
  const topLangsSvg = renderTopLangsCard(data, themeName, options);
  const topLangsPath = path.join(outputDir, 'top-langs.svg');
  fs.writeFileSync(topLangsPath, topLangsSvg, 'utf-8');

  // 3. Streak Card -> streak.svg
  const streakSvg = renderStreakCard(data, themeName, options);
  const streakPath = path.join(outputDir, 'streak.svg');
  fs.writeFileSync(streakPath, streakSvg, 'utf-8');

  return {
    overallStatsPath,
    topLangsPath,
    streakPath,
    overallStatsSvg,
    topLangsSvg,
    streakSvg,
  };
}
