import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { getUserStats } from './fetcher.js';
import { exportSVGCards } from './renderers/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function main() {
  console.log('GitHub Profile Stats SVG Generator');
  console.log(`Target Username: ${config.username}`);
  console.log(`Token Present: ${Boolean(config.githubToken)}`);
  console.log(`Theme: ${config.theme.name}\n`);

  const stats = await getUserStats();

  console.log('--- User Metrics ---');
  console.log('User:', stats.user.login);
  console.log('Overall Stats:', stats.overallStats);
  console.log('Streak Stats:', stats.streakStats);
  console.log(
    'Top Languages:',
    stats.topLanguages.map((l) => `${l.name} (${l.percentage}%)`).join(', ')
  );
  console.log('\nGenerating SVG cards...');

  const result = exportSVGCards(stats, ROOT_DIR, {
    theme: config.theme.name,
    username: stats.user?.name || stats.user?.login || config.username,
  });

  console.log('✔ SVG cards generated successfully:');
  console.log(`  - ${result.overallStatsPath}`);
  console.log(`  - ${result.topLangsPath}`);
  console.log(`  - ${result.streakPath}`);
}

main().catch((err) => {
  console.error('Execution error:', err);
  process.exit(1);
});
