export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
}

export interface ThemeGradients {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  surface: string;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  glow: string;
  glowPrimary: string;
  glowAccent: string;
}

export interface ThemeBlur {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  mode: "light" | "dark";
  colors: ThemeColors;
  gradients: ThemeGradients;
  shadows: ThemeShadows;
  blur: ThemeBlur;
}

export interface ThemeContextValue {
  theme: ThemeConfig;
  themeId: string;
  setTheme: (themeId: string) => void;
  setCustomAccent: (color: string) => void;
  previewTheme: (themeId: string) => void;
  commitPreview: () => void;
  cancelPreview: () => void;
  isPreviewMode: boolean;
  availableThemes: ThemeConfig[];
}
