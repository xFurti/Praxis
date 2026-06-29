import { buildThemeStyleBlock } from './themeCss.js'

/** @typedef {{
 *   id: string
 *   name: string
 *   personality: string
 *   defaultLayout: string
 *   uxNotes: string
 *   css: string
 * }} ThemePack */

/** @type {ThemePack[]} */
export const THEME_PACKS = [
  {
    id: 'praxis-core',
    name: 'Praxis Core',
    personality: 'Dark navy OS aesthetic with cyan-to-violet tech-magic gradients.',
    defaultLayout: 'Single centered card with clear vertical hierarchy.',
    uxNotes: 'One primary action, muted secondary labels, generous padding.',
    css: buildThemeStyleBlock({
      background: '#070b1a',
      backgroundAlt: '#0c1226',
      surface: 'rgba(18, 26, 51, 0.82)',
      surfaceAlt: 'rgba(26, 35, 66, 0.72)',
      edge: 'rgba(36, 48, 86, 0.92)',
      accent: '#22d3ee',
      accentSecondary: '#8b5cf6',
      text: '#e6ebff',
      muted: '#8b93b8',
      glow: '0 0 24px rgba(34, 211, 238, 0.35)',
      windowShadow: '0 18px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(36, 48, 86, 0.8)',
      bodyBackground:
        'radial-gradient(1200px 600px at 50% -10%, rgba(139, 92, 246, 0.18), transparent 60%), radial-gradient(900px 500px at 10% 110%, rgba(34, 211, 238, 0.12), transparent 60%), #070b1a',
    }),
  },
  {
    id: 'neon-arcade',
    name: 'Neon Arcade',
    personality: 'Electric arcade cabinet — hot pink and cyan glow on deep black.',
    defaultLayout: 'Bold centered panel with chunky controls and glowing borders.',
    uxNotes: 'Large tap targets, uppercase labels on primary actions, punchy hover glow.',
    css: buildThemeStyleBlock(
      {
        background: '#05050f',
        backgroundAlt: '#0a0a18',
        surface: 'rgba(12, 8, 32, 0.92)',
        surfaceAlt: 'rgba(20, 12, 48, 0.85)',
        edge: 'rgba(236, 72, 153, 0.45)',
        accent: '#22d3ee',
        accentSecondary: '#ec4899',
        text: '#f8fafc',
        muted: '#a5b4fc',
        glow: '0 0 28px rgba(236, 72, 153, 0.5)',
        windowShadow: '0 0 40px rgba(34, 211, 238, 0.15), 0 0 0 1px rgba(236, 72, 153, 0.35)',
        bodyBackground:
          'radial-gradient(ellipse at 50% 0%, rgba(236, 72, 153, 0.2), transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(34, 211, 238, 0.15), transparent 50%), #05050f',
        radius: '12px',
        displayShadow: '0 0 20px rgba(236, 72, 153, 0.4)',
      },
      `.praxis-btn-primary { text-transform: uppercase; letter-spacing: 0.06em; }
.praxis-card { border-color: rgba(34, 211, 238, 0.35); }`,
    ),
  },
  {
    id: 'warm-editorial',
    name: 'Warm Editorial',
    personality: 'Refined magazine layout — cream paper, serif headlines, amber accents.',
    defaultLayout: 'Editorial column with headline, body copy, and understated actions.',
    uxNotes: 'Serif titles, comfortable line-height, subtle dividers between sections.',
    css: buildThemeStyleBlock(
      {
        colorScheme: 'light',
        background: '#f5f0e8',
        backgroundAlt: '#ebe4d8',
        surface: 'rgba(255, 252, 247, 0.95)',
        surfaceAlt: 'rgba(245, 238, 228, 0.9)',
        edge: 'rgba(120, 90, 60, 0.2)',
        accent: '#b45309',
        accentSecondary: '#92400e',
        text: '#1c1917',
        muted: '#78716c',
        glow: '0 4px 20px rgba(180, 83, 9, 0.2)',
        windowShadow: '0 12px 40px rgba(28, 25, 23, 0.12), 0 0 0 1px rgba(120, 90, 60, 0.15)',
        bodyBackground: 'linear-gradient(180deg, #faf7f2 0%, #f0e9de 100%)',
        fontDisplay: 'Georgia, "Times New Roman", serif',
        fontBody: 'Inter, system-ui, sans-serif',
        primaryBtnText: '#fffbeb',
        radius: '8px',
        radiusSm: '6px',
        displayShadow: 'none',
      },
      `.praxis-display { font-weight: 600; letter-spacing: -0.02em; }
.praxis-btn-primary { background: linear-gradient(135deg, #d97706, #b45309); }`,
    ),
  },
  {
    id: 'terminal-green',
    name: 'Terminal Green',
    personality: 'Retro hacker terminal — phosphor green on black with monospace type.',
    defaultLayout: 'Full-width terminal panel with command-line aesthetic.',
    uxNotes: 'Monospace readouts, bracketed prompts, minimal decoration, scanline feel.',
    css: buildThemeStyleBlock(
      {
        background: '#0a0f0a',
        backgroundAlt: '#050805',
        surface: 'rgba(8, 16, 8, 0.95)',
        surfaceAlt: 'rgba(12, 24, 12, 0.9)',
        edge: 'rgba(74, 222, 128, 0.25)',
        accent: '#4ade80',
        accentSecondary: '#22c55e',
        text: '#bbf7d0',
        muted: '#6ee7b7',
        glow: '0 0 16px rgba(74, 222, 128, 0.35)',
        windowShadow: '0 0 0 1px rgba(74, 222, 128, 0.2), inset 0 0 60px rgba(74, 222, 128, 0.03)',
        bodyBackground: '#050805',
        fontDisplay: '"JetBrains Mono", ui-monospace, monospace',
        fontBody: '"JetBrains Mono", ui-monospace, monospace',
        primaryBtnText: '#052e16',
        radius: '4px',
        radiusSm: '4px',
        displayShadow: '0 0 12px rgba(74, 222, 128, 0.3)',
      },
      `body.praxis-app::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px);
  opacity: 0.4;
}
.praxis-card { border-radius: 4px; }
.praxis-btn { font-family: inherit; }`,
    ),
  },
  {
    id: 'soft-pastel',
    name: 'Soft Pastel',
    personality: 'Friendly and airy — lavender, mint, and rounded soft shapes.',
    defaultLayout: 'Rounded card with playful spacing and pill-shaped chips.',
    uxNotes: 'Rounded corners everywhere, soft shadows, encouraging microcopy.',
    css: buildThemeStyleBlock(
      {
        colorScheme: 'light',
        background: '#f5f3ff',
        backgroundAlt: '#ede9fe',
        surface: 'rgba(255, 255, 255, 0.92)',
        surfaceAlt: 'rgba(237, 233, 254, 0.85)',
        edge: 'rgba(167, 139, 250, 0.25)',
        accent: '#8b5cf6',
        accentSecondary: '#a78bfa',
        text: '#3730a3',
        muted: '#7c7aab',
        glow: '0 8px 24px rgba(139, 92, 246, 0.2)',
        windowShadow: '0 16px 48px rgba(139, 92, 246, 0.12), 0 0 0 1px rgba(167, 139, 250, 0.2)',
        bodyBackground: 'linear-gradient(135deg, #faf5ff 0%, #ecfdf5 50%, #f5f3ff 100%)',
        fontDisplay: '"Space Grotesk", Inter, sans-serif',
        primaryBtnText: '#ffffff',
        radius: '20px',
        radiusSm: '14px',
        displayShadow: 'none',
      },
      `.praxis-chip { border-radius: 9999px; }
.praxis-btn { border-radius: 9999px; }`,
    ),
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    personality: 'Raw and bold — thick borders, high contrast, no softness.',
    defaultLayout: 'Asymmetric grid with heavy borders and oversized headings.',
    uxNotes: 'Sharp corners, bold type, stark black/white contrast, no blur effects.',
    css: buildThemeStyleBlock(
      {
        colorScheme: 'light',
        background: '#fafafa',
        backgroundAlt: '#e5e5e5',
        surface: '#ffffff',
        surfaceAlt: '#f5f5f5',
        edge: '#171717',
        accent: '#171717',
        accentSecondary: '#525252',
        text: '#0a0a0a',
        muted: '#525252',
        glow: '4px 4px 0 #171717',
        windowShadow: '6px 6px 0 #171717',
        bodyBackground: '#f5f5f5',
        fontDisplay: '"Space Grotesk", Impact, sans-serif',
        primaryBtnText: '#fafafa',
        radius: '0px',
        radiusSm: '0px',
        displayShadow: 'none',
      },
      `.praxis-card { backdrop-filter: none; border-width: 3px; }
.praxis-btn-primary { background: #171717; box-shadow: 4px 4px 0 #a3a3a3; border: 2px solid #171717; }
.praxis-btn-ghost { border-width: 2px; box-shadow: 3px 3px 0 #d4d4d4; }
.praxis-input { border-width: 2px; border-radius: 0; }`,
    ),
  },
  {
    id: 'sunset-glass',
    name: 'Sunset Glass',
    personality: 'Golden-hour glassmorphism — warm oranges, pinks, and frosted panels.',
    defaultLayout: 'Floating glass card over a warm gradient backdrop.',
    uxNotes: 'Frosted surfaces, soft gradients, warm accent on primary CTA.',
    css: buildThemeStyleBlock(
      {
        background: '#1a0a14',
        backgroundAlt: '#2d1520',
        surface: 'rgba(255, 255, 255, 0.08)',
        surfaceAlt: 'rgba(255, 255, 255, 0.12)',
        edge: 'rgba(251, 146, 60, 0.35)',
        accent: '#fb923c',
        accentSecondary: '#f472b6',
        text: '#fff7ed',
        muted: '#fdba74',
        glow: '0 0 32px rgba(251, 146, 60, 0.35)',
        windowShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(251, 146, 60, 0.2)',
        bodyBackground:
          'radial-gradient(ellipse at 20% 0%, rgba(251, 146, 60, 0.35), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(244, 114, 182, 0.3), transparent 50%), linear-gradient(160deg, #1a0a14, #2d1520)',
        radius: '20px',
        radiusSm: '12px',
      },
      `.praxis-card { backdrop-filter: blur(24px); border-color: rgba(255,255,255,0.15); }`,
    ),
  },
  {
    id: 'ocean-depth',
    name: 'Ocean Depth',
    personality: 'Calm deep-sea minimalism — teal, navy, and quiet precision.',
    defaultLayout: 'Wide calm layout with horizontal sections and breathing room.',
    uxNotes: 'Low visual noise, teal accents on key actions, clear section labels.',
    css: buildThemeStyleBlock(
      {
        background: '#0a1628',
        backgroundAlt: '#0f2137',
        surface: 'rgba(15, 33, 55, 0.88)',
        surfaceAlt: 'rgba(20, 45, 72, 0.8)',
        edge: 'rgba(45, 212, 191, 0.2)',
        accent: '#2dd4bf',
        accentSecondary: '#0ea5e9',
        text: '#e0f2fe',
        muted: '#7dd3fc',
        glow: '0 0 24px rgba(45, 212, 191, 0.25)',
        windowShadow: '0 16px 48px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(45, 212, 191, 0.15)',
        bodyBackground:
          'radial-gradient(ellipse at 50% 100%, rgba(14, 165, 233, 0.15), transparent 60%), linear-gradient(180deg, #0a1628, #0f2137)',
        displayShadow: '0 0 16px rgba(45, 212, 191, 0.2)',
      },
      `.praxis-divider { background: linear-gradient(to right, transparent, rgba(45,212,191,0.3), transparent); }`,
    ),
  },
]

const AUTO_THEME_POOL = THEME_PACKS.filter((theme) => theme.id !== 'praxis-core')

export function getThemeById(id) {
  return THEME_PACKS.find((theme) => theme.id === id) ?? THEME_PACKS[0]
}

/** @type {string[]} */
const recentAutoThemeIds = []

export function pickAutoTheme() {
  const blocked = new Set(recentAutoThemeIds.slice(-3))
  let pool = AUTO_THEME_POOL.filter((theme) => !blocked.has(theme.id))

  if (!pool.length) {
    pool = AUTO_THEME_POOL.filter((theme) => theme.id !== recentAutoThemeIds.at(-1))
  }

  const theme = pool[Math.floor(Math.random() * pool.length)] ?? AUTO_THEME_POOL[0] ?? THEME_PACKS[0]
  recentAutoThemeIds.push(theme.id)
  if (recentAutoThemeIds.length > 6) {
    recentAutoThemeIds.shift()
  }
  return theme
}
