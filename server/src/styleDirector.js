import { buildThemeStyleBlock } from './themeCss.js'
import { getThemeById } from './themes.js'
import { BUILDER_BASE_PROMPT, UX_SKILL_PROMPT } from './praxisPrompts.js'
import { buildBuilderLearningSection } from './learningContext.js'
import { harmonizeThemeVars, paletteIsComplete } from './colorHarmony.js'
import { applyGenerationVariety, BUILDER_VARIETY_HINT, userSpecifiedVisualStyle } from './visualVariety.js'
import { getAppTypeProfile } from './appTypePatterns.js'

const STYLE_SOURCES = new Set(['user', 'inferred', 'auto'])

/**
 * After interpreter output: fill theme when auto, normalize user/inferred design.
 * @param {Record<string, unknown>} spec
 */
export function enrichSpecDesign(spec) {
  const design = normalizeDesign(spec.design)
  const userChoseStyle = userSpecifiedVisualStyle(spec)

  if (
    userChoseStyle &&
    (design.style_source === 'user' || design.style_source === 'inferred') &&
    paletteIsComplete(design.palette)
  ) {
    return applyGenerationVariety({
      ...spec,
      design: {
        ...design,
        theme_id: design.theme_id || 'custom',
        theme_name: design.theme_name || (design.style_source === 'user' ? 'User directed' : 'Context inferred'),
      },
    })
  }

  if (userChoseStyle && design.theme_id) {
    const theme = getThemeById(design.theme_id)
    return applyGenerationVariety({
      ...spec,
      design: {
        ...design,
        style_source: design.style_source || 'auto',
        theme_name: design.theme_name || theme.name,
        layout: design.layout || theme.defaultLayout,
        personality: design.personality || theme.personality,
        ux_notes: design.ux_notes || theme.uxNotes,
        palette: design.palette,
      },
    })
  }

  return applyGenerationVariety(spec)
}

/**
 * @param {Record<string, unknown>} spec
 * @param {{ providerId?: string }} [options]
 */
export async function buildBuilderSystemPrompt(spec, options = {}) {
  const design = normalizeDesign(spec.design)
  const { css, brief } = resolveThemeForBuild(design)
  const learning = await buildBuilderLearningSection(spec, options)
  const profile = getAppTypeProfile(spec)

  const uxFromSpec = design.ux_notes ? `SPEC UX NOTES:\n${design.ux_notes}` : ''

  const sections = [
    BUILDER_BASE_PROMPT,
    UX_SKILL_PROMPT,
    BUILDER_VARIETY_HINT,
    learning,
    uxFromSpec,
    `APP TYPE BLUEPRINT (${profile.category} — structural guide only, vary visual execution):\n${profile.builderBrief}`,
    `VISUAL DIRECTION:\n${brief}`,
    design.aesthetic_family ? `AESTHETIC FAMILY: ${design.aesthetic_family}` : null,
    design.avoid_cliches ? `STYLE AVOID: ${design.avoid_cliches}` : null,
    design.composition_directive ? `COMPOSITION:\n${design.composition_directive}` : null,
    design.visual_variant ? `VISUAL VARIANT: ${design.visual_variant}` : null,
    `DESIGN SYSTEM (embed this <style> in the document):\n${css}`,
  ].filter(Boolean)

  return sections.join('\n\n')
}

/**
 * Theme CSS block for templated or manual builds.
 * @param {Record<string, unknown>} spec
 */
export function getThemeCssForSpec(spec) {
  const design = normalizeDesign(spec.design)
  return resolveThemeForBuild(design).css
}

function resolveThemeForBuild(design) {
  if (design.style_source === 'user' || design.style_source === 'inferred') {
    return {
      css: buildCustomThemeCss(design),
      brief: buildCustomBrief(design),
    }
  }

  const theme = getThemeById(design.theme_id || 'praxis-core')
  return {
    css: theme.css,
    brief: [
      `Theme: ${theme.name} (${design.style_source})`,
      design.aesthetic_family ? `Aesthetic family: ${design.aesthetic_family}` : null,
      `Personality: ${design.personality || theme.personality}`,
      `Layout: ${design.layout || theme.defaultLayout}`,
      design.ux_notes ? `UX notes: ${design.ux_notes}` : `UX notes: ${theme.uxNotes}`,
      design.avoid_cliches ? design.avoid_cliches : null,
      'Make this app feel distinct — vary composition and control styling. Do not copy a generic template.',
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

function buildCustomBrief(design) {
  const lines = [
    `Style source: ${design.style_source} — honor the user's or inferred visual direction faithfully.`,
    design.aesthetic_family ? `Aesthetic family: ${design.aesthetic_family}` : null,
    design.personality ? `Personality: ${design.personality}` : null,
    design.layout ? `Layout: ${design.layout}` : null,
    design.ux_notes ? `UX notes: ${design.ux_notes}` : null,
    design.palette
      ? `Palette: background ${design.palette.background || '—'}, accent ${design.palette.accent || '—'}, text ${design.palette.text || '—'}`
      : null,
    design.avoid_cliches ? design.avoid_cliches : null,
    'Use .praxis-* classes but override CSS variables and add custom rules to match this direction.',
    'Prioritize visual fidelity to the described style over generic Praxis defaults.',
  ]
  return lines.filter(Boolean).join('\n')
}

function buildCustomThemeCss(design) {
  const palette = design.palette || {}
  const vars = {
    background: palette.background || '#070b1a',
    backgroundAlt: palette.background_alt || palette.background || '#0c1226',
    surface: palette.surface || 'rgba(18, 26, 51, 0.82)',
    surfaceAlt: palette.surface_alt || 'rgba(26, 35, 66, 0.72)',
    edge: palette.edge || 'rgba(36, 48, 86, 0.92)',
    accent: palette.accent || '#22d3ee',
    accentSecondary: palette.accent_secondary || '#8b5cf6',
    text: palette.text || '#e6ebff',
    muted: palette.muted || '#8b93b8',
    glow: palette.glow || '0 0 24px rgba(34, 211, 238, 0.35)',
    windowShadow:
      palette.window_shadow ||
      '0 18px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(36, 48, 86, 0.8)',
    bodyBackground:
      palette.body_background ||
      `radial-gradient(900px 500px at 50% 0%, ${palette.accent_secondary || '#8b5cf6'}22, transparent 60%), ${palette.background || '#070b1a'}`,
    fontDisplay: palette.font_display,
    fontBody: palette.font_body,
    radius: palette.radius,
    radiusSm: palette.radius_sm,
    primaryBtnText: palette.primary_btn_text,
    colorScheme: palette.color_scheme,
  }

  const extras = design.custom_css ? String(design.custom_css) : ''
  return buildThemeStyleBlock(harmonizeThemeVars(vars), extras)
}

function normalizeDesign(design) {
  if (!design || typeof design !== 'object') {
    return { style_source: 'auto' }
  }

  const source = STYLE_SOURCES.has(design.style_source) ? design.style_source : 'auto'
  return {
    style_source: source,
    theme_id: typeof design.theme_id === 'string' ? design.theme_id : undefined,
    theme_name: typeof design.theme_name === 'string' ? design.theme_name : undefined,
    layout: typeof design.layout === 'string' ? design.layout : undefined,
    personality: typeof design.personality === 'string' ? design.personality : undefined,
    ux_notes: typeof design.ux_notes === 'string' ? design.ux_notes : undefined,
    composition_directive:
      typeof design.composition_directive === 'string' ? design.composition_directive : undefined,
    visual_variant: typeof design.visual_variant === 'string' ? design.visual_variant : undefined,
    aesthetic_family: typeof design.aesthetic_family === 'string' ? design.aesthetic_family : undefined,
    avoid_cliches: typeof design.avoid_cliches === 'string' ? design.avoid_cliches : undefined,
    generation_nonce: typeof design.generation_nonce === 'string' ? design.generation_nonce : undefined,
    calc_variant: typeof design.calc_variant === 'string' ? design.calc_variant : undefined,
    palette: normalizePalette(design.palette),
    custom_css: typeof design.custom_css === 'string' ? design.custom_css : undefined,
  }
}

function normalizePalette(palette) {
  if (!palette || typeof palette !== 'object') {
    return undefined
  }

  const entries = Object.entries(palette).filter(([, value]) => typeof value === 'string')
  return entries.length ? Object.fromEntries(entries) : undefined
}
