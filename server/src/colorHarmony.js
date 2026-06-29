/**
 * Ensure theme CSS variables stay readable (contrast-safe palettes).
 */

const LIGHT_TEXT = '#e6ebff'
const DARK_TEXT = '#1c1917'
const LIGHT_SURFACE = 'rgba(255, 252, 247, 0.95)'
const LIGHT_SURFACE_ALT = 'rgba(245, 238, 228, 0.92)'
const DARK_SURFACE = 'rgba(18, 26, 51, 0.88)'
const DARK_SURFACE_ALT = 'rgba(26, 35, 66, 0.85)'

export function paletteIsComplete(palette) {
  if (!palette || typeof palette !== 'object') {
    return false
  }

  const background = typeof palette.background === 'string' && palette.background.trim()
  const text = typeof palette.text === 'string' && palette.text.trim()
  const surface = typeof palette.surface === 'string' && palette.surface.trim()
  const accent = typeof palette.accent === 'string' && palette.accent.trim()

  return Boolean(background && text && (surface || accent))
}

export function harmonizeThemeVars(vars) {
  const next = { ...vars }
  const bgIsLight = isLightContext(next)

  if (bgIsLight) {
    next.colorScheme = next.colorScheme || 'light'
    next.surface = coerceSurface(next.surface, true)
    next.surfaceAlt = coerceSurface(next.surfaceAlt, true, true)
    next.backgroundAlt = next.backgroundAlt || shadeHex(next.background, -0.06) || '#ebe4d8'
    next.edge = next.edge || 'rgba(120, 90, 60, 0.22)'
    next.text = ensureContrast(next.text, next.surfaceAlt, DARK_TEXT, LIGHT_TEXT)
    next.muted = ensureContrast(next.muted, next.surfaceAlt, '#57534e', '#a8b0d0')
    next.primaryBtnText = next.primaryBtnText || '#ffffff'
    next.bodyBackground =
      next.bodyBackground ||
      `linear-gradient(180deg, ${next.background || '#faf7f2'} 0%, ${next.backgroundAlt} 100%)`
  } else {
    next.colorScheme = next.colorScheme || 'dark'
    next.surface = coerceSurface(next.surface, false)
    next.surfaceAlt = coerceSurface(next.surfaceAlt, false, true)
    next.backgroundAlt = next.backgroundAlt || shadeHex(next.background, 0.08) || '#0c1226'
    next.edge = next.edge || 'rgba(36, 48, 86, 0.92)'
    next.text = ensureContrast(next.text, next.surfaceAlt, DARK_TEXT, LIGHT_TEXT)
    next.muted = ensureContrast(next.muted, next.surfaceAlt, '#6b7280', '#8b93b8')
    next.primaryBtnText = next.primaryBtnText || '#0b1228'
  }

  next.text = ensureContrast(next.text, next.surfaceAlt, DARK_TEXT, LIGHT_TEXT)
  next.primaryBtnText = ensureContrast(next.primaryBtnText, next.accent, '#0b1228', '#ffffff')

  return next
}

function isLightContext(vars) {
  if (vars.colorScheme === 'light') {
    return true
  }
  if (vars.colorScheme === 'dark') {
    return false
  }

  const bg = vars.background || vars.bodyBackground || ''
  if (typeof bg === 'string' && /gradient|#[ef][0-9a-f]{5}|#f[0-9a-f]{5}|rgb\(\s*2[0-4]/i.test(bg)) {
    if (relativeLuminance(parseColor(bg) || [120, 120, 120]) > 0.55) {
      return true
    }
  }

  const sample = parseColor(vars.background) || parseColor(vars.bodyBackground)
  if (sample) {
    return relativeLuminance(sample) > 0.55
  }

  return false
}

function coerceSurface(value, light, alt = false) {
  const parsed = parseColor(value)
  if (!parsed) {
    return light ? (alt ? LIGHT_SURFACE_ALT : LIGHT_SURFACE) : alt ? DARK_SURFACE_ALT : DARK_SURFACE
  }

  const lum = relativeLuminance(parsed)
  if (light && lum < 0.65) {
    return alt ? LIGHT_SURFACE_ALT : LIGHT_SURFACE
  }
  if (!light && lum > 0.35) {
    return alt ? DARK_SURFACE_ALT : DARK_SURFACE
  }
  return value
}

function ensureContrast(fg, bg, darkFallback, lightFallback) {
  const bgColor = parseColor(bg) || [18, 26, 51]
  const bgLight = relativeLuminance(bgColor) > 0.5
  const fallback = bgLight ? darkFallback : lightFallback
  const fgColor = parseColor(fg)

  if (!fgColor) {
    return fallback
  }

  if (contrastRatio(fgColor, bgColor) < 4.5) {
    return fallback
  }

  return fg
}

export function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg)
  const l2 = relativeLuminance(bg)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function parseColor(input) {
  const raw = String(input || '').trim()
  if (!raw) {
    return null
  }

  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    let value = hex[1]
    if (value.length === 3) {
      value = value
        .split('')
        .map((ch) => ch + ch)
        .join('')
    }
    return [
      Number.parseInt(value.slice(0, 2), 16),
      Number.parseInt(value.slice(2, 4), 16),
      Number.parseInt(value.slice(4, 6), 16),
    ]
  }

  const rgb = raw.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  }

  return null
}

function shadeHex(hex, amount) {
  const rgb = parseColor(hex)
  if (!rgb) {
    return null
  }

  const factor = amount < 0 ? 1 + amount : 1 + amount
  const base = amount < 0 ? 0 : 255
  const shaded = rgb.map((channel) =>
    Math.max(0, Math.min(255, Math.round(channel + (base - channel) * Math.abs(amount)))),
  )

  return `#${shaded.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}
