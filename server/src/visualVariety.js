import { deriveCategory } from './appCategory.js'
import { getThemeById, pickAutoTheme } from './themes.js'

const LAYOUT_TWISTS = [
  'asymmetric spacing with a strong visual anchor',
  'centered hero element with supporting controls below',
  'dense utility layout with tight vertical rhythm',
  'airy layout with generous whitespace',
  'split emphasis between display and primary controls',
  'stacked sections with clear visual separators',
  'horizontal band layout with accent stripe',
]

const COMPOSITION_DIRECTIVES = [
  'Lead with a distinctive header treatment — do not use a plain default title bar.',
  'Vary button shapes (pill vs rounded rect vs square) within the theme.',
  'Give the main readout or hero element a unique frame or background treatment.',
  'Introduce a subtle background pattern or gradient wash behind the card.',
  'Use asymmetric padding — more breathing room on one axis.',
  'Group controls in visually distinct clusters rather than one flat grid.',
  'Use a single bold accent stripe or corner detail — not an all-over glow.',
]

export const CALCULATOR_VARIANTS = ['classic', 'pill', 'minimal', 'retro', 'glass', 'compact', 'bold']

const AESTHETIC_FAMILIES = [
  {
    id: 'warm-editorial',
    label: 'Warm Editorial',
    themeId: 'warm-editorial',
    personality: 'Refined magazine — cream paper, serif headlines, amber accents, no glow effects',
    layout: 'Editorial column with calm vertical rhythm',
  },
  {
    id: 'soft-pastel',
    label: 'Soft Pastel',
    themeId: 'soft-pastel',
    personality: 'Gentle pastel light UI — soft lavender and mint, rounded friendly controls',
    layout: 'Centered soft card with airy padding',
  },
  {
    id: 'brutalist',
    label: 'Brutalist',
    themeId: 'brutalist',
    personality: 'Raw brutalist — thick borders, monochrome, one sharp accent, zero glow',
    layout: 'Hard-edged grid with loud hierarchy',
  },
  {
    id: 'terminal-green',
    label: 'Retro Terminal',
    themeId: 'terminal-green',
    personality: 'Phosphor terminal — black background, green monospace, CRT scanline hint',
    layout: 'Dense utility grid, monospace readout',
  },
  {
    id: 'ocean-depth',
    label: 'Ocean Depth',
    themeId: 'ocean-depth',
    personality: 'Deep ocean calm — teal on navy, subtle gradients, professional instrument feel',
    layout: 'Wide calm panel with clear sections',
  },
  {
    id: 'sunset-glass',
    label: 'Sunset Glass',
    themeId: 'sunset-glass',
    personality: 'Warm sunset glass — coral and gold on dusk purple, soft blur surfaces',
    layout: 'Layered glass card with warm gradient wash',
  },
  {
    id: 'light-sand',
    label: 'Light Sand',
    personality: 'Bright daylight tool — warm sand background, chocolate text, terracotta accent',
    layout: 'Compact centered card, high contrast, no dark mode',
    palette: {
      color_scheme: 'light',
      background: '#f4efe6',
      background_alt: '#ebe3d6',
      surface: '#fffdf9',
      text: '#2c2419',
      muted: '#6b5d4f',
      accent: '#c2410c',
      accent_secondary: '#9a3412',
      edge: 'rgba(120, 90, 60, 0.22)',
    },
  },
  {
    id: 'mint-office',
    label: 'Mint Office',
    personality: 'Clean office light mode — cool mint and slate, professional and flat',
    layout: 'Structured grid, crisp labels, no decorative effects',
    palette: {
      color_scheme: 'light',
      background: '#f0f7f4',
      background_alt: '#e3eee8',
      surface: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
      accent: '#0d9488',
      accent_secondary: '#0f766e',
      edge: 'rgba(15, 118, 110, 0.18)',
    },
  },
  {
    id: 'neon-arcade',
    label: 'Neon Arcade',
    themeId: 'neon-arcade',
    personality: 'Neon arcade cabinet — pink and cyan glow on deep black',
    layout: 'Bold centered panel with chunky glowing controls',
  },
  {
    id: 'praxis-core',
    label: 'Praxis Core',
    themeId: 'praxis-core',
    personality: 'Dark navy OS — cyan-violet tech gradient accents, restrained glow',
    layout: 'Single centered card with clear hierarchy',
  },
]

const recentAestheticFamilies = []

const STYLE_KEYWORD_RE =
  /\b(neon|cyber|cyberpunk|futurist|futuristic|dark mode|light mode|minimal|minimalist|retro|vintage|pastel|warm|cool|brutalist|elegant|modern|terminal|arcade|glass|flat|skeuomorph|colorful|monochrome|navy|pink|cyan|purple|orange|cream|white|black|scuro|chiaro|elegante|moderno|colorato|pastello|minimalista|futuristico|futurista)\b/i

export function userSpecifiedVisualStyle(spec, sourcePrompt = '') {
  const design = spec.design && typeof spec.design === 'object' ? spec.design : {}
  if (design.style_source === 'user') {
    return true
  }

  const prompt = String(sourcePrompt || spec._source_prompt || '').trim()
  if (!prompt) {
    return false
  }

  return STYLE_KEYWORD_RE.test(prompt)
}

export function applyGenerationVariety(spec) {
  const category = deriveCategory(spec)
  const sourcePrompt = String(spec._source_prompt || '')
  const design =
    spec.design && typeof spec.design === 'object' ? { ...spec.design } : { style_source: 'auto' }

  if (design.generation_nonce) {
    if (!design.composition_directive) {
      design.composition_directive = pickOne(COMPOSITION_DIRECTIVES)
    }
    if (!design.visual_variant) {
      design.visual_variant = pickVisualVariant(category)
    }
    return { ...spec, design }
  }

  const userChoseStyle = userSpecifiedVisualStyle(spec, sourcePrompt)

  if (!userChoseStyle) {
    applyForcedAesthetic(design, category)
  } else if (
    design.style_source !== 'user' &&
    (!design.palette || Object.keys(design.palette).length < 4)
  ) {
    if (!design.theme_id) {
      const theme = pickAutoTheme()
      design.theme_id = theme.id
      design.theme_name = theme.name
      design.personality = design.personality || theme.personality
      design.layout = design.layout || theme.defaultLayout
      design.ux_notes = design.ux_notes || theme.uxNotes
    }
    if (!design.palette || Object.keys(design.palette).length < 4) {
      design.palette = synthesizePalette()
    }
  }

  design.composition_directive =
    design.composition_directive || pickOne(COMPOSITION_DIRECTIVES)
  design.visual_variant = design.visual_variant || pickVisualVariant(category)
  design.generation_nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  design.avoid_cliches = userChoseStyle
    ? undefined
    : 'Do NOT default to neon cyberpunk, purple/cyan glow, dark sci-fi grids, or "Neon [Name]" branding unless this aesthetic family is neon-arcade.'

  return { ...spec, design }
}

function applyForcedAesthetic(design, category) {
  const family = pickAestheticFamily()
  const layoutTwist = pickOne(LAYOUT_TWISTS)

  design.aesthetic_family = family.id
  design.personality = family.personality
  design.layout = `${family.layout || 'Balanced single-card layout'}. ${layoutTwist}.`
  design.composition_directive = pickOne(COMPOSITION_DIRECTIVES)

  if (family.palette) {
    design.style_source = 'inferred'
    design.theme_id = 'custom'
    design.theme_name = family.label
    design.palette = { ...family.palette }
  } else if (family.themeId) {
    const theme = getThemeById(family.themeId)
    design.style_source = 'auto'
    design.theme_id = theme.id
    design.theme_name = theme.name
    design.ux_notes = theme.uxNotes
    design.palette = undefined
  } else {
    design.style_source = 'inferred'
    design.palette = synthesizePalette()
  }

  if (category === 'calculator') {
    design.calc_variant = pickCalculatorVariant()
  }
}

function pickAestheticFamily() {
  const blocked = new Set(recentAestheticFamilies.slice(-4))
  let pool = AESTHETIC_FAMILIES.filter((family) => !blocked.has(family.id))

  if (!pool.length) {
    pool = AESTHETIC_FAMILIES.filter((family) => family.id !== recentAestheticFamilies.at(-1))
  }

  const picked = pool[Math.floor(Math.random() * pool.length)] ?? AESTHETIC_FAMILIES[0]
  recentAestheticFamilies.push(picked.id)
  if (recentAestheticFamilies.length > 8) {
    recentAestheticFamilies.shift()
  }
  return picked
}

export function pickCalculatorVariant() {
  return pickOne(CALCULATOR_VARIANTS)
}

function pickVisualVariant(category) {
  if (category === 'calculator') {
    return pickCalculatorVariant()
  }
  const generic = ['studio', 'compact', 'expressive', 'minimal', 'layered', 'bold', 'soft']
  return `${category}-${pickOne(generic)}`
}

function synthesizePalette() {
  const recentDark = recentAestheticFamilies
    .slice(-3)
    .some((id) => ['neon-arcade', 'terminal-green', 'ocean-depth', 'praxis-core'].includes(id))
  const dark = recentDark ? Math.random() > 0.75 : Math.random() > 0.45
  const hue = pickOne([25, 45, 155, 185, 205, 235, 265, 295, 330])

  const accent = hslToHex(hue, 72, dark ? 62 : 48)
  const accent2 = hslToHex((hue + 55) % 360, 68, dark ? 58 : 45)

  if (dark) {
    return {
      color_scheme: 'dark',
      background: hslToHex(hue, 28, 9),
      background_alt: hslToHex(hue, 24, 13),
      surface: hslToHex(hue, 22, 18, 0.88),
      text: hslToHex(hue, 18, 94),
      muted: hslToHex(hue, 14, 68),
      accent,
      accent_secondary: accent2,
      edge: hslToHex(hue, 20, 32, 0.7),
    }
  }

  return {
    color_scheme: 'light',
    background: hslToHex(hue, 22, 96),
    background_alt: hslToHex(hue, 18, 92),
    surface: hslToHex(hue, 16, 99, 0.95),
    text: hslToHex(hue, 22, 16),
    muted: hslToHex(hue, 12, 42),
    accent,
    accent_secondary: accent2,
    edge: hslToHex(hue, 14, 78, 0.55),
  }
}

function hslToHex(h, s, l, alpha = 1) {
  const sat = s / 100
  const lit = l / 100
  const c = (1 - Math.abs(2 * lit - 1)) * sat
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lit - c / 2
  let r = 0
  let g = 0
  let b = 0

  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]

  const toByte = (n) => Math.round((n + m) * 255)
  const hex = [toByte(r), toByte(g), toByte(b)]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')

  if (alpha < 1) {
    return `rgba(${toByte(r)}, ${toByte(g)}, ${toByte(b)}, ${alpha.toFixed(2)})`
  }
  return `#${hex}`
}

export function buildVarietyContext(spec) {
  const design =
    spec.design && typeof spec.design === 'object' ? spec.design : {}

  return [
    BUILDER_VARIETY_HINT,
    design.aesthetic_family
      ? `Assigned aesthetic family: ${design.aesthetic_family} — commit fully to this look.`
      : null,
    design.generation_nonce ? `Build id: ${design.generation_nonce} — one-off custom UI.` : null,
    design.composition_directive ? `Composition: ${design.composition_directive}` : null,
    design.visual_variant ? `Visual variant: ${design.visual_variant}` : null,
    design.personality ? `Personality: ${design.personality}` : null,
    design.layout ? `Layout: ${design.layout}` : null,
    design.avoid_cliches ? `Avoid: ${design.avoid_cliches}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

export const INTERPRETER_VARIETY_HINT = `VISUAL VARIETY (required):
- If the user does NOT name a specific style, mood, or colors, set design.style_source to "auto" with minimal design fields — the server assigns a unique aesthetic per build.
- Do NOT default to neon, cyberpunk, purple/cyan glow, or dark sci-fi for calculators/tools unless the user explicitly asks.
- If the user DOES specify a style, use design.style_source "user" or "inferred" with a complete palette.
- Never reuse the same palette, personality, or "Neon [Name]" branding across builds.`

export const BUILDER_VARIETY_HINT = `UNIQUENESS (required):
- Follow the assigned aesthetic family and personality exactly — do not drift back to generic neon cyberpunk.
- Vary composition, typography scale, spacing rhythm, and control shapes.
- Same app type ≠ same visual design. No "Neon Prism/Grid/Flux" naming unless the aesthetic family is neon-arcade.`

function pickOne(items) {
  return items[Math.floor(Math.random() * items.length)]
}
