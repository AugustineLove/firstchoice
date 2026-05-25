'use client';
import { createContext, useContext, useState, useEffect } from 'react';

export const themes = {
  forest: {
    name: 'forest',
    green: '#1B5E3B',
    greenMid: '#2D7A54',
    greenLight: '#4CAF78',
    greenPale: '#E8F5EE',
    greenXpale: '#F2FAF5',
    amber: '#E8820C',
    amberLight: '#F5A832',
    amberPale: '#FEF3E2',
    dark: '#0D1F16',
    muted: '#6B7C72',
    border: '#D8E6DE',
  },
  amber: {
    name: 'amber',
    green: '#B85B00',
    greenMid: '#D4680A',
    greenLight: '#E8820C',
    greenPale: '#FEF3E2',
    greenXpale: '#FFF8F0',
    amber: '#1B5E3B',
    amberLight: '#4CAF78',
    amberPale: '#E8F5EE',
    dark: '#1F1005',
    muted: '#7C6B55',
    border: '#E6D8C8',
  },
  slate: {
    name: 'slate',
    green: '#1E3A5F',
    greenMid: '#2B5280',
    greenLight: '#3D75B0',
    greenPale: '#E8F0F8',
    greenXpale: '#F2F6FB',
    amber: '#C07820',
    amberLight: '#E8A030',
    amberPale: '#FEF5E4',
    dark: '#0D1520',
    muted: '#5A6B7C',
    border: '#D0DCE8',
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState('forest');

  useEffect(() => {
    const saved = localStorage.getItem('fc-theme');
    if (saved && themes[saved]) setThemeName(saved);
  }, []);

  const setTheme = (name) => {
    setThemeName(name);
    localStorage.setItem('fc-theme', name);
  };

  const theme = themes[themeName];

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme }}>
      <div
        style={{
          '--green': theme.green,
          '--green-mid': theme.greenMid,
          '--green-light': theme.greenLight,
          '--green-pale': theme.greenPale,
          '--green-xpale': theme.greenXpale,
          '--amber': theme.amber,
          '--amber-light': theme.amberLight,
          '--amber-pale': theme.amberPale,
          '--dark': theme.dark,
          '--muted': theme.muted,
          '--border': theme.border,
          '--radius': '14px',
          '--radius-sm': '8px',
          '--shadow': '0 2px 16px rgba(0,0,0,0.08)',
          fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
          background: '#ffffff',
          color: theme.dark,
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}