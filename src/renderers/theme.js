/**
 * Theme color palettes for GitHub README stats cards.
 * Supports standard themes matching github-readme-stats aesthetics.
 */

export const themes = {
  dark: {
    bg_color: '#0d1117',
    title_color: '#58a6ff',
    text_color: '#c9d1d9',
    icon_color: '#58a6ff',
    border_color: '#30363d',
    accent_color: '#1f6feb',
    fire_color: '#f0883e',
  },
  light: {
    bg_color: '#ffffff',
    title_color: '#0969da',
    text_color: '#24292f',
    icon_color: '#0969da',
    border_color: '#e1e4e8',
    accent_color: '#0969da',
    fire_color: '#e5534b',
  },
  tokyonight: {
    bg_color: '#1a1b26',
    title_color: '#7aa2f7',
    text_color: '#a9b1d6',
    icon_color: '#7dcfff',
    border_color: '#414868',
    accent_color: '#7aa2f7',
    fire_color: '#ff9e64',
  },
  dracula: {
    bg_color: '#282a36',
    title_color: '#ff79c6',
    text_color: '#f8f8f2',
    icon_color: '#8be9fd',
    border_color: '#44475a',
    accent_color: '#bd93f9',
    fire_color: '#ffb86c',
  },
  nord: {
    bg_color: '#2e3440',
    title_color: '#88c0d0',
    text_color: '#d8dee9',
    icon_color: '#81a1c1',
    border_color: '#4c566a',
    accent_color: '#5e81ac',
    fire_color: '#d08770',
  },
  radical: {
    bg_color: '#141321',
    title_color: '#fe428e',
    text_color: '#a9fef7',
    icon_color: '#f8d847',
    border_color: '#2d2b45',
    accent_color: '#fe428e',
    fire_color: '#f8d847',
  },
  onedark: {
    bg_color: '#282c34',
    title_color: '#e06c75',
    text_color: '#abb2bf',
    icon_color: '#61afef',
    border_color: '#3e4451',
    accent_color: '#98c379',
    fire_color: '#d19a66',
  },
  catppuccin: {
    bg_color: '#1e1e2e',
    title_color: '#94e2d5',
    text_color: '#cdd6f4',
    icon_color: '#cba6f7',
    border_color: '#313244',
    accent_color: '#94e2d5',
    fire_color: '#fab387',
  },
};

/**
 * Resolves a theme object by name or fallback to 'dark'.
 * Accepts custom theme overrides if provided.
 * @param {string|object} themeInput Theme key name or custom theme object
 * @returns {object} Full theme palette object
 */
export function getTheme(themeInput = 'dark') {
  if (typeof themeInput === 'object' && themeInput !== null) {
    return {
      ...themes.dark,
      ...themeInput,
    };
  }

  const nameKey = String(themeInput).toLowerCase();
  if (themes[nameKey]) {
    return themes[nameKey];
  }

  return themes.dark;
}
