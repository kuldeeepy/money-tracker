/**
 * Design tokens for Paisa.
 * Supports dark and light palettes.
 */

export const darkColors = {
  bg:         '#0e0e0e',
  bgElev:     '#161616',
  bgElev2:    '#1f1f1f',
  line:       '#2a2a2a',
  lineSoft:   '#242424',
  text:       '#f5f1e8',
  textDim:    '#a39d92',
  textFaint:  '#6b675f',
  accent:     '#e8b84b',
  accentInk:  '#1a1400',
  good:       '#a8d18d',
  warn:       '#e8c468',
  bad:        '#e87b5e',
  info:       '#8db4d1',
  goodSubtle: 'rgba(168,209,141,0.15)',
  warnSubtle: 'rgba(232,196,104,0.15)',
  badSubtle:  'rgba(232,123,94,0.15)',
};

export const lightColors = {
  bg:         '#faf9f6',
  bgElev:     '#f2f0eb',
  bgElev2:    '#e8e5de',
  line:       '#d4d0c8',
  lineSoft:   '#dedad2',
  text:       '#1a1814',
  textDim:    '#5c584f',
  textFaint:  '#9c9890',
  accent:     '#c4951a',
  accentInk:  '#ffffff',
  good:       '#3a7d28',
  warn:       '#b8880a',
  bad:        '#c94a2a',
  info:       '#2a6d9e',
  goodSubtle: 'rgba(58,125,40,0.12)',
  warnSubtle: 'rgba(184,136,10,0.12)',
  badSubtle:  'rgba(201,74,42,0.12)',
};

// Backward-compat: any file that still imports `colors` gets the dark palette
export const colors = darkColors;

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

/**
 * Font families — these are loaded via expo-font in App.tsx.
 * Use these constants everywhere instead of hardcoded strings.
 */
export const fonts = {
  display:        'Fraunces',           // serif, for amounts & headers
  displayMedium:  'Fraunces_500Medium', // optional weight variant
  body:           'InterTight',         // sans, for UI text
  bodyMedium:     'InterTight_500Medium',
  bodySemiBold:   'InterTight_600SemiBold',
};

// Curated icons + colors — same as the PWA, used in envelope picker
export const ICON_SET = [
  '🍜','🛒','🚗','🏠','💡','📱','☕','🎬',
  '👕','💊','🎓','✈️','🎁','🧾','🚌','⛽',
  '🍕','🏥','💪','📚','🎮','🐶','🌱','💼',
  '💰','🎯','💳','🛍️','🧴','✂️','🚿','🍺',
];

export const COLOR_SET = [
  '#a8d18d', '#e8c468', '#e87b5e', '#8db4d1',
  '#c89bd1', '#d18d8d', '#8dd1c5', '#d1b88d',
];
