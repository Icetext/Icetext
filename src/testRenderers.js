import { themes } from './renderers/theme.js';
import {
  renderOverallStatsCard,
  renderTopLangsCard,
  renderStreakCard,
} from './renderers/index.js';

/**
 * Validates XML structure of an SVG string.
 * Checks for well-formed opening/closing tags, valid attributes, and absence of invalid placeholders (NaN, undefined, null).
 * @param {string} svg Raw SVG string
 * @param {string} cardName Name of card for reporting
 * @returns {boolean} True if XML is valid
 */
function validateXmlStructure(svg, cardName) {
  if (!svg || typeof svg !== 'string') {
    throw new Error(`[${cardName}] Output SVG is empty or not a string.`);
  }

  const trimmed = svg.trim();
  if (!trimmed.startsWith('<svg') || !trimmed.endsWith('</svg>')) {
    throw new Error(`[${cardName}] SVG does not start with <svg> or end with </svg>.`);
  }

  // Check for NaN, undefined, or null substrings
  if (/\bNaN\b/.test(svg)) {
    throw new Error(`[${cardName}] Found 'NaN' in SVG string.`);
  }
  if (/\bundefined\b/.test(svg)) {
    throw new Error(`[${cardName}] Found 'undefined' in SVG string.`);
  }
  if (/\bnull\b/.test(svg)) {
    throw new Error(`[${cardName}] Found 'null' in SVG string.`);
  }

  // Simple stack-based tag matching validator for SVG XML
  const tagRegex = /<\/?([a-zA-Z0-9:-]+)([^>]*?)(\/?)>/g;
  const selfClosingTags = new Set([
    'rect', 'circle', 'path', 'line', 'use', 'stop', 'polygon', 'polyline', 'ellipse', 'image'
  ]);

  const stack = [];
  let match;

  while ((match = tagRegex.exec(svg)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    const isSelfClosingAttr = match[3] === '/';

    // Ignore comments or processing instructions / CDATA
    if (fullTag.startsWith('<?') || fullTag.startsWith('<!')) {
      continue;
    }

    const isOpening = !fullTag.startsWith('</');
    const isClosing = fullTag.startsWith('</');

    if (isOpening) {
      if (!isSelfClosingAttr && !selfClosingTags.has(tagName)) {
        stack.push(tagName);
      }
    } else if (isClosing) {
      if (stack.length === 0) {
        throw new Error(`[${cardName}] Unexpected closing tag </${tagName}> without matching opening tag.`);
      }
      const top = stack.pop();
      if (top !== tagName) {
        throw new Error(`[${cardName}] Mismatched tag: expected </${top}> but found </${tagName}>.`);
      }
    }
  }

  if (stack.length > 0) {
    throw new Error(`[${cardName}] Unclosed XML tags remaining: ${stack.join(', ')}.`);
  }

  return true;
}

/**
 * Defines test datasets covering standard usage and edge cases.
 */
const datasets = [
  {
    name: 'Standard Dataset (Icetext)',
    data: {
      user: { login: 'Icetext', name: 'Icetext' },
      overallStats: {
        totalStars: 62,
        totalCommits: 1027,
        totalPRs: 67,
        totalIssues: 32,
        totalReviews: 24,
        contributedTo: 15,
      },
      streakStats: {
        totalContributions: 1027,
        currentStreak: 15,
        longestStreak: 48,
        streakRange: 'Aug 7, 2025 – Aug 7, 2026',
        currentStreakRange: 'Jul 24, 2026 – Aug 7, 2026',
        longestStreakRange: 'Jan 8, 2026 – Feb 24, 2026',
      },
      topLanguages: [
        { name: 'TypeScript', percentage: 40.5, color: '#3178c6', bytes: 250000 },
        { name: 'JavaScript', percentage: 31.0, color: '#f1e05a', bytes: 190000 },
        { name: 'Python', percentage: 14.7, color: '#3572A5', bytes: 90000 },
        { name: 'Rust', percentage: 13.8, color: '#dea584', bytes: 85000 },
      ],
    },
  },
  {
    name: 'Edge Case: Long Username',
    data: {
      user: {
        login: 'very-long-github-username-supercalifragilisticexpialidocious',
        name: 'Very Long Username Test Account',
      },
      overallStats: {
        totalStars: 10,
        totalCommits: 120,
        totalPRs: 5,
        totalIssues: 2,
        totalReviews: 1,
        contributedTo: 3,
      },
      streakStats: {
        totalContributions: 120,
        currentStreak: 5,
        longestStreak: 12,
        streakRange: 'Jan 1, 2026 – Aug 7, 2026',
        currentStreakRange: 'Aug 2, 2026 – Aug 7, 2026',
        longestStreakRange: 'Mar 10, 2026 – Mar 22, 2026',
      },
      topLanguages: [
        { name: 'JavaScript', percentage: 70.0, color: '#f1e05a', bytes: 70000 },
        { name: 'HTML', percentage: 30.0, color: '#e34c26', bytes: 30000 },
      ],
    },
  },
  {
    name: 'Edge Case: Large Counts (15,400 commits, 250 stars)',
    data: {
      user: { login: 'PowerUser', name: 'Power User' },
      overallStats: {
        totalStars: 250,
        totalCommits: 15400,
        totalPRs: 1200,
        totalIssues: 850,
        totalReviews: 450,
        contributedTo: 99,
      },
      streakStats: {
        totalContributions: 15400,
        currentStreak: 365,
        longestStreak: 365,
        streakRange: 'Jan 1, 2025 – Dec 31, 2025',
        currentStreakRange: 'Jan 1, 2025 – Dec 31, 2025',
        longestStreakRange: 'Jan 1, 2025 – Dec 31, 2025',
      },
      topLanguages: [
        { name: 'TypeScript', percentage: 50.0, color: '#3178c6', bytes: 500000 },
        { name: 'Rust', percentage: 50.0, color: '#dea584', bytes: 500000 },
      ],
    },
  },
  {
    name: 'Edge Case: 1 Language',
    data: {
      user: { login: 'SoloDev', name: 'Solo Language Developer' },
      overallStats: {
        totalStars: 5,
        totalCommits: 50,
        totalPRs: 2,
        totalIssues: 1,
        totalReviews: 0,
        contributedTo: 1,
      },
      streakStats: {
        totalContributions: 50,
        currentStreak: 2,
        longestStreak: 10,
        streakRange: 'Jun 1, 2026 – Aug 7, 2026',
        currentStreakRange: 'Aug 6, 2026 – Aug 7, 2026',
        longestStreakRange: 'Jun 10, 2026 – Jun 20, 2026',
      },
      topLanguages: [
        { name: 'JavaScript', percentage: 100.0, color: '#f1e05a', bytes: 100000 },
      ],
    },
  },
  {
    name: 'Edge Case: 6 Languages',
    data: {
      user: { login: 'Polyglot', name: 'Polyglot Developer' },
      overallStats: {
        totalStars: 150,
        totalCommits: 3200,
        totalPRs: 210,
        totalIssues: 90,
        totalReviews: 60,
        contributedTo: 25,
      },
      streakStats: {
        totalContributions: 3200,
        currentStreak: 45,
        longestStreak: 120,
        streakRange: 'Aug 7, 2025 – Aug 7, 2026',
        currentStreakRange: 'Jun 23, 2026 – Aug 7, 2026',
        longestStreakRange: 'Jan 1, 2026 – May 1, 2026',
      },
      topLanguages: [
        { name: 'TypeScript', percentage: 30.0, color: '#3178c6', bytes: 300000 },
        { name: 'JavaScript', percentage: 25.0, color: '#f1e05a', bytes: 250000 },
        { name: 'Python', percentage: 20.0, color: '#3572A5', bytes: 200000 },
        { name: 'Rust', percentage: 15.0, color: '#dea584', bytes: 150000 },
        { name: 'Go', percentage: 6.0, color: '#00ADD8', bytes: 60000 },
        { name: 'HTML', percentage: 4.0, color: '#e34c26', bytes: 40000 },
      ],
    },
  },
  {
    name: 'Edge Case: 0 Languages',
    data: {
      user: { login: 'NoLangsDev', name: 'No Languages Developer' },
      overallStats: {
        totalStars: 0,
        totalCommits: 10,
        totalPRs: 0,
        totalIssues: 0,
        totalReviews: 0,
        contributedTo: 1,
      },
      streakStats: {
        totalContributions: 10,
        currentStreak: 1,
        longestStreak: 2,
        streakRange: 'Aug 6, 2026 – Aug 7, 2026',
        currentStreakRange: 'Aug 7, 2026',
        longestStreakRange: 'Aug 6, 2026 – Aug 7, 2026',
      },
      topLanguages: [],
    },
  },
  {
    name: 'Edge Case: Zero Streaks',
    data: {
      user: { login: 'InactiveDev', name: 'Inactive Developer' },
      overallStats: {
        totalStars: 0,
        totalCommits: 0,
        totalPRs: 0,
        totalIssues: 0,
        totalReviews: 0,
        contributedTo: 0,
      },
      streakStats: {
        totalContributions: 0,
        currentStreak: 0,
        longestStreak: 0,
        streakRange: '',
        currentStreakRange: 'No Active Streak',
        longestStreakRange: '',
      },
      topLanguages: [],
    },
  },
];

const themesToTest = ['dark', 'light', 'tokyonight', 'dracula', 'nord', 'catppuccin'];

function runTests() {
  console.log('====================================================');
  console.log('   SVG Card Renderer Validation Test Suite');
  console.log('====================================================\n');

  let totalTests = 0;
  let passedTests = 0;

  for (const ds of datasets) {
    console.log(`\n--- Dataset: ${ds.name} ---`);

    for (const themeName of themesToTest) {
      const username = ds.data.user?.name || ds.data.user?.login || 'User';

      // 1. Overall Stats Card
      totalTests++;
      const overallCardName = `OverallStatsCard | ${ds.name} | Theme: ${themeName}`;
      try {
        const svg = renderOverallStatsCard(ds.data, themeName, { username });
        validateXmlStructure(svg, overallCardName);
        passedTests++;
        console.log(`  ✔ [PASS] ${overallCardName}`);
      } catch (err) {
        console.error(`  ✖ [FAIL] ${overallCardName}: ${err.message}`);
      }

      // 2. Top Languages Card
      totalTests++;
      const topLangsCardName = `TopLangsCard | ${ds.name} | Theme: ${themeName}`;
      try {
        const svg = renderTopLangsCard(ds.data, themeName, { username });
        validateXmlStructure(svg, topLangsCardName);
        passedTests++;
        console.log(`  ✔ [PASS] ${topLangsCardName}`);
      } catch (err) {
        console.error(`  ✖ [FAIL] ${topLangsCardName}: ${err.message}`);
      }

      // 3. Streak Card
      totalTests++;
      const streakCardName = `StreakCard | ${ds.name} | Theme: ${themeName}`;
      try {
        const svg = renderStreakCard(ds.data, themeName, { username });
        validateXmlStructure(svg, streakCardName);
        passedTests++;
        console.log(`  ✔ [PASS] ${streakCardName}`);
      } catch (err) {
        console.error(`  ✖ [FAIL] ${streakCardName}: ${err.message}`);
      }
    }
  }

  console.log('\n====================================================');
  console.log(`   Validation Results: ${passedTests} / ${totalTests} Passed`);
  console.log('====================================================');

  if (passedTests !== totalTests) {
    console.error(`\nValidation suite failed! (${totalTests - passedTests} failed)`);
    process.exit(1);
  } else {
    console.log('\n✔ ALL SVG CARD RENDERER TESTS PASSED SUCCESSFULLY!\n');
  }
}

runTests();
