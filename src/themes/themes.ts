// src/themes/themes.ts
export interface FontConfig {
  uiFont: string;
  codeFont: string;
  markdownFont: string;
}

export interface Theme {
  name: string;
  id: string;
  type: 'dark' | 'light';
  colors: {
    // Background colors
    bg: string;
    bgDark: string;
    bgLight: string;
    surface: string;
    
    // Text colors
    text: string;
    textBright: string;
    textDim: string;
    textMuted: string;
    
    // UI colors
    border: string;
    borderLight: string;
    selection: string;
    
    // Accent colors
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    
    // Syntax highlighting
    keyword: string;
    string: string;
    number: string;
    comment: string;
    function: string;
    variable: string;
    operator: string;
  };
}

// Font options
export const fontOptions = {
  ui: [
    { name: 'IBM Plex Mono', value: "'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, 'Courier New', monospace" },
    { name: 'JetBrains Mono', value: "'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'SF Mono', Consolas, 'Courier New', monospace" },
    { name: 'Fira Code', value: "'Fira Code', 'IBM Plex Mono', 'JetBrains Mono', 'SF Mono', Consolas, 'Courier New', monospace" },
    { name: 'SF Mono', value: "'SF Mono', 'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace" },
    { name: 'Cascadia Code', value: "'Cascadia Code', 'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace" },
    { name: 'Source Code Pro', value: "'Source Code Pro', 'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace" },
    { name: 'Inter', value: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif" },
    { name: 'System UI', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif" },
  ],
  code: [
    { name: 'IBM Plex Mono', value: "'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, 'Courier New', monospace" },
    { name: 'JetBrains Mono', value: "'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'SF Mono', Consolas, 'Courier New', monospace" },
    { name: 'Fira Code', value: "'Fira Code', 'IBM Plex Mono', 'JetBrains Mono', 'SF Mono', Consolas, 'Courier New', monospace" },
    { name: 'SF Mono', value: "'SF Mono', 'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace" },
    { name: 'Cascadia Code', value: "'Cascadia Code', 'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace" },
    { name: 'Source Code Pro', value: "'Source Code Pro', 'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace" },
    { name: 'Consolas', value: "'Consolas', 'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Courier New', monospace" },
    { name: 'Monaco', value: "'Monaco', 'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace" },
  ],
  markdown: [
    { name: 'IBM Plex Mono', value: "'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, 'Courier New', monospace" },
    { name: 'JetBrains Mono', value: "'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'SF Mono', Consolas, 'Courier New', monospace" },
    { name: 'Inter', value: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif" },
    { name: 'System UI', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif" },
    { name: 'Georgia', value: "'Georgia', 'Times New Roman', Times, serif" },
    { name: 'Charter', value: "'Charter', 'Bitstream Charter', 'Sitka Text', Cambria, serif" },
    { name: 'Iowan Old Style', value: "'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', P052, serif" },
    { name: 'Source Serif Pro', value: "'Source Serif Pro', 'Iowan Old Style', 'Apple Garamond', 'Baskerville', 'Times New Roman', serif" },
  ],
};

export const defaultFontConfig: FontConfig = {
  uiFont: "'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, 'Courier New', monospace",
  codeFont: "'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, 'Courier New', monospace",
  markdownFont: "'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, 'Courier New', monospace",
};

export const themes: Theme[] = [
  // Current Neovim theme
  {
    name: 'Neovim Dark',
    id: 'neovim-dark',
    type: 'dark',
    colors: {
      bg: '#000000',
      bgDark: '#000000',
      bgLight: '#0a0a0a',
      surface: '#252a2f',
      text: '#e0e0e0',
      textBright: '#ffffff',
      textDim: '#c0c0c0',
      textMuted: '#8fa1b3',
      border: '#808080',
      borderLight: '#404040',
      selection: 'rgba(181, 232, 83, 0.3)',
      primary: '#b5e853',
      secondary: '#5fb3a3',
      success: '#a3c7a3',
      warning: '#d4a574',
      error: '#e55e5e',
      keyword: '#b5e853',
      string: '#a3c7a3',
      number: '#d4a574',
      comment: '#6c7680',
      function: '#5fb3a3',
      variable: '#e55e5e',
      operator: '#b39bc8',
    },
  },
  // Nord theme
  {
    name: 'Nord',
    id: 'nord',
    type: 'dark',
    colors: {
      bg: '#2e3440',
      bgDark: '#2e3440',
      bgLight: '#3b4252',
      surface: '#434c5e',
      text: '#d8dee9',
      textBright: '#eceff4',
      textDim: '#e5e9f0',
      textMuted: '#4c566a',
      border: '#4c566a',
      borderLight: '#434c5e',
      selection: 'rgba(136, 192, 208, 0.3)',
      primary: '#88c0d0',
      secondary: '#81a1c1',
      success: '#a3be8c',
      warning: '#ebcb8b',
      error: '#bf616a',
      keyword: '#81a1c1',
      string: '#a3be8c',
      number: '#b48ead',
      comment: '#616e88',
      function: '#88c0d0',
      variable: '#d8dee9',
      operator: '#81a1c1',
    },
  },
  // Dracula theme
  {
    name: 'Dracula',
    id: 'dracula',
    type: 'dark',
    colors: {
      bg: '#282a36',
      bgDark: '#21222c',
      bgLight: '#44475a',
      surface: '#44475a',
      text: '#f8f8f2',
      textBright: '#ffffff',
      textDim: '#f8f8f2',
      textMuted: '#6272a4',
      border: '#6272a4',
      borderLight: '#44475a',
      selection: 'rgba(68, 71, 90, 0.8)',
      primary: '#bd93f9',
      secondary: '#8be9fd',
      success: '#50fa7b',
      warning: '#f1fa8c',
      error: '#ff5555',
      keyword: '#ff79c6',
      string: '#f1fa8c',
      number: '#bd93f9',
      comment: '#6272a4',
      function: '#50fa7b',
      variable: '#f8f8f2',
      operator: '#ff79c6',
    },
  },
  // One Dark Pro theme
  {
    name: 'One Dark Pro',
    id: 'one-dark-pro',
    type: 'dark',
    colors: {
      bg: '#282c34',
      bgDark: '#21252b',
      bgLight: '#2c313c',
      surface: '#3e4451',
      text: '#abb2bf',
      textBright: '#ffffff',
      textDim: '#abb2bf',
      textMuted: '#5c6370',
      border: '#3e4451',
      borderLight: '#2c313c',
      selection: 'rgba(97, 175, 239, 0.3)',
      primary: '#61afef',
      secondary: '#56b6c2',
      success: '#98c379',
      warning: '#e5c07b',
      error: '#e06c75',
      keyword: '#c678dd',
      string: '#98c379',
      number: '#d19a66',
      comment: '#5c6370',
      function: '#61afef',
      variable: '#e06c75',
      operator: '#56b6c2',
    },
  },
  // GitHub Dark theme
  {
    name: 'GitHub Dark',
    id: 'github-dark',
    type: 'dark',
    colors: {
      bg: '#0d1117',
      bgDark: '#010409',
      bgLight: '#161b22',
      surface: '#21262d',
      text: '#e6edf3',
      textBright: '#f0f6fc',
      textDim: '#e6edf3',
      textMuted: '#7d8590',
      border: '#30363d',
      borderLight: '#21262d',
      selection: 'rgba(56, 139, 253, 0.3)',
      primary: '#238636',
      secondary: '#1f6feb',
      success: '#238636',
      warning: '#d29922',
      error: '#da3633',
      keyword: '#ff7b72',
      string: '#a5d6ff',
      number: '#79c0ff',
      comment: '#8b949e',
      function: '#d2a8ff',
      variable: '#ffa657',
      operator: '#ff7b72',
    },
  },
  // GitHub Light theme
  {
    name: 'GitHub Light',
    id: 'github-light',
    type: 'light',
    colors: {
      bg: '#ffffff',
      bgDark: '#f6f8fa',
      bgLight: '#ffffff',
      surface: '#f6f8fa',
      text: '#24292f',
      textBright: '#24292f',
      textDim: '#656d76',
      textMuted: '#656d76',
      border: '#d0d7de',
      borderLight: '#d8dee4',
      selection: 'rgba(9, 105, 218, 0.3)',
      primary: '#0969da',
      secondary: '#218bff',
      success: '#1a7f37',
      warning: '#9a6700',
      error: '#cf222e',
      keyword: '#cf222e',
      string: '#0a3069',
      number: '#0550ae',
      comment: '#6e7781',
      function: '#8250df',
      variable: '#953800',
      operator: '#cf222e',
    },
  },
  // Solarized Dark theme
  {
    name: 'Solarized Dark',
    id: 'solarized-dark',
    type: 'dark',
    colors: {
      bg: '#002b36',
      bgDark: '#002b36',
      bgLight: '#073642',
      surface: '#073642',
      text: '#839496',
      textBright: '#fdf6e3',
      textDim: '#93a1a1',
      textMuted: '#586e75',
      border: '#586e75',
      borderLight: '#073642',
      selection: 'rgba(88, 110, 117, 0.3)',
      primary: '#268bd2',
      secondary: '#2aa198',
      success: '#859900',
      warning: '#b58900',
      error: '#dc322f',
      keyword: '#268bd2',
      string: '#2aa198',
      number: '#d33682',
      comment: '#586e75',
      function: '#268bd2',
      variable: '#cb4b16',
      operator: '#859900',
    },
  },
  // Tokyo Night theme
  {
    name: 'Tokyo Night',
    id: 'tokyo-night',
    type: 'dark',
    colors: {
      bg: '#1a1b26',
      bgDark: '#16161e',
      bgLight: '#24283b',
      surface: '#292e42',
      text: '#c0caf5',
      textBright: '#c0caf5',
      textDim: '#a9b1d6',
      textMuted: '#565f89',
      border: '#3b4261',
      borderLight: '#292e42',
      selection: 'rgba(115, 138, 219, 0.3)',
      primary: '#7aa2f7',
      secondary: '#7dcfff',
      success: '#9ece6a',
      warning: '#e0af68',
      error: '#f7768e',
      keyword: '#bb9af7',
      string: '#9ece6a',
      number: '#ff9e64',
      comment: '#565f89',
      function: '#7aa2f7',
      variable: '#f7768e',
      operator: '#89ddff',
    },
  },
];

export const getThemeById = (id: string): Theme | undefined => {
  return themes.find(theme => theme.id === id);
};

export const getDefaultTheme = (): Theme => {
  return themes[0]; // Neovim Dark
};