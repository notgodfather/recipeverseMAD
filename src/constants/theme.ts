export const lightTheme = {
  primary: '#E84040',
  primaryLight: '#FFF0F0',
  accent: '#E84040',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAFA',
  text: '#262626',
  textSecondary: '#8E8E8E',
  border: '#DBDBDB',
  borderLight: '#EFEFEF',
  success: '#58C322',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.4)',
  card: '#FFFFFF',
  inputBg: '#EFEFEF',
};

export const darkTheme = {
  primary: '#E84040',
  primaryLight: '#2A1A1A',
  accent: '#E84040',
  background: '#000000',
  surface: '#121212',
  surfaceAlt: '#1A1A1A',
  text: '#F5F5F5',
  textSecondary: '#A0A0A0',
  border: '#2A2A2A',
  borderLight: '#1E1E1E',
  success: '#58C322',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.6)',
  card: '#1A1A1A',
  inputBg: '#262626',
};

export type ThemeColors = typeof lightTheme;

export function getTheme(isDark: boolean): ThemeColors {
  return isDark ? darkTheme : lightTheme;
}
