/**
 * Design tokens for Paisa.
 * Mirrors the CSS variables from the PWA version exactly.
 * Dark-first palette with warm cream accent (nods to paper envelope origin).
 */

export const colors = {
  bg:        '#0e0e0e',
  bgElev:    '#161616',
  bgElev2:   '#1f1f1f',
  line:      '#2a2a2a',
  lineSoft:  '#1f1f1f',

  text:      '#f5f1e8',  // warm cream — main text
  textDim:   '#a39d92',
  textFaint: '#6b675f',

  accent:    '#f5f1e8',
  accentInk: '#0e0e0e',

  good:      '#a8d18d',  // under-budget / income
  warn:      '#e8c468',  // approaching budget
  bad:       '#e87b5e',  // over budget / expense
  info:      '#8db4d1',
};

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
