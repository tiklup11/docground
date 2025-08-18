// src/themes/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Theme, themes, getThemeById, getDefaultTheme, FontConfig, defaultFontConfig } from './themes';

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
  fontConfig: FontConfig;
  setFontConfig: (config: FontConfig) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(getDefaultTheme());
  const [fontConfig, setFontConfigState] = useState<FontConfig>(defaultFontConfig);

  useEffect(() => {
    // Load theme and fonts from localStorage on mount
    const savedThemeId = localStorage.getItem('docground-theme');
    if (savedThemeId) {
      const savedTheme = getThemeById(savedThemeId);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
    }

    const savedFontConfig = localStorage.getItem('docground-fonts');
    if (savedFontConfig) {
      try {
        const parsedFontConfig = JSON.parse(savedFontConfig) as FontConfig;
        setFontConfigState(parsedFontConfig);
      } catch (error) {
        console.error('Failed to parse saved font config:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Apply theme and fonts to CSS custom properties
    const root = document.documentElement;
    const { colors } = currentTheme;

    // Background colors
    root.style.setProperty('--nvim-bg', colors.bg);
    root.style.setProperty('--nvim-bg-dark', colors.bgDark);
    root.style.setProperty('--nvim-bg-light', colors.bgLight);
    root.style.setProperty('--theme-surface', colors.surface);

    // Text colors
    root.style.setProperty('--nvim-text', colors.text);
    root.style.setProperty('--nvim-text-bright', colors.textBright);
    root.style.setProperty('--nvim-text-dim', colors.textDim);
    root.style.setProperty('--theme-text-muted', colors.textMuted);

    // UI colors
    root.style.setProperty('--nvim-border', colors.border);
    root.style.setProperty('--theme-border-light', colors.borderLight);
    root.style.setProperty('--theme-selection', colors.selection);

    // Accent colors
    root.style.setProperty('--nvim-blue', colors.primary);
    root.style.setProperty('--nvim-cyan', colors.secondary);
    root.style.setProperty('--nvim-green', colors.success);
    root.style.setProperty('--nvim-yellow', colors.warning);
    root.style.setProperty('--nvim-red', colors.error);

    // Syntax highlighting
    root.style.setProperty('--theme-keyword', colors.keyword);
    root.style.setProperty('--theme-string', colors.string);
    root.style.setProperty('--theme-number', colors.number);
    root.style.setProperty('--theme-comment', colors.comment);
    root.style.setProperty('--theme-function', colors.function);
    root.style.setProperty('--theme-variable', colors.variable);
    root.style.setProperty('--theme-operator', colors.operator);

    // Font configurations
    root.style.setProperty('--font-ui', fontConfig.uiFont);
    root.style.setProperty('--font-code', fontConfig.codeFont);
    root.style.setProperty('--font-markdown', fontConfig.markdownFont);

    // Legacy color mappings for compatibility
    root.style.setProperty('--primary-green', colors.primary);
    root.style.setProperty('--dark-bg', colors.bg);
    root.style.setProperty('--darker-bg', colors.bgDark);
    root.style.setProperty('--text-color', colors.text);
    root.style.setProperty('--border-color', colors.border);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors.bg);
    }
  }, [currentTheme, fontConfig]);

  const setTheme = (themeId: string) => {
    const theme = getThemeById(themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('docground-theme', themeId);
    }
  };

  const setFontConfig = (config: FontConfig) => {
    setFontConfigState(config);
    localStorage.setItem('docground-fonts', JSON.stringify(config));
  };

  const value = {
    currentTheme,
    setTheme,
    availableThemes: themes,
    fontConfig,
    setFontConfig,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};