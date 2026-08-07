import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_CONFIG_PATH = path.join(ROOT_DIR, 'config.json');

const DEFAULT_CONFIG = {
  username: 'Icetext',
  theme: {
    name: 'default',
    bgColor: '#0d1117',
    titleColor: '#58a6ff',
    textColor: '#c9d1d9',
    iconColor: '#8b949e',
    borderColor: '#30363d',
    accentColor: '#1f6feb',
    borderRadius: 10,
  },
  output: {
    directory: 'output',
    format: 'svg',
    width: 495,
    height: 195,
    padding: 25,
  },
  cards: {
    overview: true,
    stats: true,
    languages: true,
    streak: true,
    repositories: true,
  },
  languageExclusions: ['HTML', 'CSS'],
  commitAuthorAliases: ['Icetext'],
};

/**
 * Loads and parses config.json merged with environment variables.
 * @param {string} [customConfigPath] Optional custom path to config.json
 * @returns {object} Merged configuration object
 */
export function loadConfig(customConfigPath = DEFAULT_CONFIG_PATH) {
  let fileConfig = {};

  if (fs.existsSync(customConfigPath)) {
    try {
      const rawData = fs.readFileSync(customConfigPath, 'utf-8');
      fileConfig = JSON.parse(rawData);
    } catch (err) {
      console.warn(`[Config] Failed to parse ${customConfigPath}, falling back to defaults:`, err.message);
    }
  }

  // Environment variables override file config
  const githubToken = process.env.GITHUB_TOKEN || '';
  const username = process.env.GITHUB_USERNAME || fileConfig.username || DEFAULT_CONFIG.username;

  const mergedConfig = {
    githubToken,
    username,
    theme: {
      ...DEFAULT_CONFIG.theme,
      ...(fileConfig.theme || {}),
    },
    output: {
      ...DEFAULT_CONFIG.output,
      ...(fileConfig.output || {}),
    },
    cards: {
      ...DEFAULT_CONFIG.cards,
      ...(fileConfig.cards || {}),
    },
    languageExclusions: Array.isArray(fileConfig.languageExclusions)
      ? fileConfig.languageExclusions
      : DEFAULT_CONFIG.languageExclusions,
    commitAuthorAliases: Array.isArray(fileConfig.commitAuthorAliases)
      ? fileConfig.commitAuthorAliases
      : DEFAULT_CONFIG.commitAuthorAliases,
  };

  return Object.freeze(mergedConfig);
}

export const config = loadConfig();
export default config;
