// LegalEase — Premium Design System v4
// Inspired by Ramp, Mercury, Arc Browser — warm midnight + gold accent
// NOT the generic "dev dark mode" — this is designer-grade

export const colors = {
  // ── Backgrounds — warm midnight tones (NOT pure black) ──────
  bgDeep: '#06090F',
  bgPrimary: '#0A0E17',
  bgSecondary: '#10151F',
  bgTertiary: '#171D2B',
  bgSurface: '#1E2638',
  bgOverlay: 'rgba(6, 9, 15, 0.92)',
  backdrop: 'rgba(0, 0, 0, 0.6)',

  // ── Text — warm whites, not clinical ────────────────────────
  textPrimary: '#F0F2F5',
  textSecondary: '#8B95A8',
  textTertiary: '#4A5468',
  textOnAccent: '#FFFFFF',

  // ── Primary accent — cobalt/emerald (less generic than purple) ─────
  accentPrimary: '#0EA5A4',
  accentHover: '#0B8C8A',
  accentMuted: 'rgba(14, 165, 164, 0.10)',
  accentBorder: 'rgba(14, 165, 164, 0.22)',
  accentGlow: 'rgba(14, 165, 164, 0.30)',

  // ── Copper — premium secondary accent ───────────────────────
  gold: '#C98A3A',
  goldMuted: 'rgba(201, 138, 58, 0.10)',
  goldBorder: 'rgba(201, 138, 58, 0.22)',

  // ── AI Identity ──────────────────────────────────────────────
  botGradientStart: '#0EA5A4',
  botGradientEnd: '#22D3EE',

  // ── Message gradients ────────────────────────────────────────
  gradientStart: '#0EA5A4',
  gradientEnd: '#22D3EE',

  // ── Semantic ──────────────────────────────────────────────────
  success: '#34D399',
  successMuted: 'rgba(52, 211, 153, 0.06)',
  successBorder: 'rgba(52, 211, 153, 0.15)',

  warning: '#FBBF24',
  warningMuted: 'rgba(251, 191, 36, 0.06)',
  warningBorder: 'rgba(251, 191, 36, 0.15)',

  error: '#F87171',
  errorMuted: 'rgba(248, 113, 113, 0.06)',
  errorBorder: 'rgba(248, 113, 113, 0.15)',

  // ── Borders ──────────────────────────────────────────────────
  borderColor: 'rgba(255,255,255,0.04)',
  borderMid: 'rgba(255,255,255,0.07)',
  borderFocus: 'rgba(14, 165, 164, 0.45)',
  borderGlass: 'rgba(255,255,255,0.05)',
};

export const gradients = {
  accent: ['#0EA5A4', '#0B8C8A'],
  brand: ['#0EA5A4', '#22D3EE'],
  ai: ['#0EA5A4', '#22D3EE'],
  gold: ['#C98A3A', '#B9792E'],
  surface: ['rgba(14,165,164,0.10)', 'rgba(14,165,164,0.02)'],
  glow: ['rgba(14,165,164,0.24)', 'rgba(14,165,164,0.0)'],
  header: ['rgba(14,165,164,0.07)', 'transparent'],
  card: ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.005)'],
  login: ['#080C18', '#0A0E17', '#06090F'],
  success: ['#34D399', '#10B981'],
  warning: ['#FBBF24', '#F59E0B'],
  error: ['#F87171', '#EF4444'],
  orbAccent: ['rgba(14,165,164,0.28)', 'transparent'],
  orbGold: ['rgba(201,138,58,0.20)', 'transparent'],
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
};

export const typography = {
  display: { fontSize: 34, fontWeight: '800', letterSpacing: -1.5, lineHeight: 40 },
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2, lineHeight: 24 },
  h4: { fontSize: 15, fontWeight: '600', letterSpacing: -0.1, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 24 },
  bodySm: { fontSize: 13, fontWeight: '400', lineHeight: 20 },
  bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  caption: { fontSize: 11, fontWeight: '500', lineHeight: 16 },
  button: { fontSize: 15, fontWeight: '600', letterSpacing: 0.1 },
  mono: { fontSize: 13, fontFamily: 'monospace', fontWeight: '500' },
};

export const shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 3 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.55, shadowRadius: 28, elevation: 14 },
  accent: { shadowColor: '#0EA5A4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 12, elevation: 8 },
  glow: { shadowColor: '#0EA5A4', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 10 },
  gold: { shadowColor: '#C98A3A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
};

export const motion = {
  spring: {
    gentle: { tension: 120, friction: 14 },
    snappy: { tension: 200, friction: 20 },
    bouncy: { tension: 180, friction: 12 },
    stiff: { tension: 300, friction: 25 },
  },
  timing: { fast: 150, normal: 250, slow: 400, enter: 350, exit: 200 },
  stagger: { fast: 50, normal: 80, slow: 120 },
};
