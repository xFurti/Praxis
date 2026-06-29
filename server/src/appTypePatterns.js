import { deriveCategory, detectSpecIntentMismatch } from './appCategory.js'

/**
 * @typedef {{
 *   category: string
 *   builderBrief: string
 *   uxNotes?: string
 *   windowSize?: 'small' | 'medium' | 'large'
 * }} AppTypeProfile
 */

/**
 * @param {Record<string, unknown>} spec
 * @returns {AppTypeProfile}
 */
export function getAppTypeProfile(spec) {
  const category = deriveCategory(spec)
  const profile = PATTERNS[category] ?? PATTERNS.general
  return { category, ...profile }
}

/**
 * Merge app-type layout hints into spec before build.
 * @param {Record<string, unknown>} spec
 */
export function enrichSpecForAppType(spec) {
  const { uxNotes, windowSize } = getAppTypeProfile(spec)
  const design = spec.design && typeof spec.design === 'object' ? { ...spec.design } : {}

  if (uxNotes && !design.ux_notes) {
    design.ux_notes = uxNotes
  }

  const next = { ...spec, design }
  if (windowSize && !spec.window_size) {
    next.window_size = windowSize
  }

  return next
}

/** @type {Record<string, Omit<AppTypeProfile, 'category'>>} */
const PATTERNS = {
  calculator: {
    windowSize: 'small',
    uxNotes: 'Calculator: display + keypad. Vary visual style each build — never clone a previous calculator look.',
    builderBrief: `CALCULATOR BLUEPRINT (vary visual execution every time):
- body.praxis-app.praxis-fit, single .praxis-card sized to content (~260–320px wide).
- .praxis-readout for the display (right-aligned, tabular nums).
- .praxis-calc-pad: 4-column CSS grid, 5 rows — digits 0-9, ., C, +, −, ×, ÷, =.
- Tall + button spanning 2 rows; tall = button spanning 2 rows in last column.
- Implement full arithmetic in inline <script>.
- UNIQUE LOOK REQUIRED: vary palette usage, button shapes, display framing, card border, and background treatment.`,
  },
  todo: {
    windowSize: 'small',
    uxNotes: 'Todo list: input row at top, scrollable list below only if many items, clear empty state.',
    builderBrief: `TODO LIST BLUEPRINT:
- body.praxis-app.praxis-fit, single .praxis-card (max-width ~400px).
- Top row: text input + primary "Add" button in .praxis-row.
- List items: each row has label + ghost delete button; use .praxis-divider between groups if needed.
- Empty state message when list is empty.
- Checkbox or strike-through for completed items if spec implies it.`,
  },
  timer: {
    windowSize: 'small',
    uxNotes: 'Timer: large central time display, 2–3 primary controls (start/pause/reset).',
    builderBrief: `TIMER BLUEPRINT:
- body.praxis-app.praxis-fit, centered .praxis-card.
- Hero .praxis-readout or .praxis-display for MM:SS (large, centered).
- Control row: Start/Pause (primary) + Reset (ghost). Optional mode chips if spec mentions pomodoro.
- Use setInterval in script; clear on pause/reset.`,
  },
  spreadsheet: {
    windowSize: 'large',
    uxNotes: 'Table/grid: header row, aligned cells, horizontal scroll only on table wrapper if needed.',
    builderBrief: `SPREADSHEET / TABLE BLUEPRINT:
- body.praxis-app.praxis-fit with .praxis-card filling reasonable width (max ~720px).
- HTML <table> or CSS grid with column headers; monospace or tabular nums for data cells.
- Sticky header row if many rows; zebra striping via custom CSS.
- Editable cells only if spec requires; otherwise static demo data.`,
  },
  form: {
    windowSize: 'medium',
    uxNotes: 'Form: labeled fields stacked, one primary submit, inline validation messages.',
    builderBrief: `FORM BLUEPRINT:
- body.praxis-app.praxis-fit, .praxis-card with .praxis-col layout.
- Each field: label (muted, small) + .praxis-input; group with consistent 12px gap.
- Single .praxis-btn-primary submit at bottom; disable until required fields filled.`,
  },
  dashboard: {
    windowSize: 'large',
    uxNotes: 'Dashboard: grid of stat cards + chart area; scannable hierarchy.',
    builderBrief: `DASHBOARD BLUEPRINT:
- body.praxis-app.praxis-fit, .praxis-card or multiple cards in .praxis-grid (2–3 columns).
- Stat tiles with number + label; chart area using CSS bars or simple SVG (no libraries).
- Clear section headings; avoid cramming — use grid gap 16px.`,
  },
  store: {
    windowSize: 'medium',
    uxNotes: 'Store: product grid or list with image placeholder, title, price, add action.',
    builderBrief: `STORE / SHOP BLUEPRINT:
- Product grid (2 cols on narrow) with card per item: placeholder image area, title, price, Add button.
- Cart summary strip or badge if spec mentions cart.`,
  },
  game: {
    windowSize: 'medium',
    uxNotes: 'Game UI: play area, status/HUD, player actions — match the spec, not a generic template.',
    builderBrief: `GAME BLUEPRINT (adapt to spec — do not copy a fixed template):
- Layout and components must come from the spec's app_name, description, and components[].
- Typical elements when relevant: play/status area, HUD stats, action buttons, match/score readout.
- Simulate behavior in <script> with in-memory state (no network).
- NEVER substitute a calculator keypad or unrelated widget unless the spec is a calculator.`,
  },
  notes: {
    windowSize: 'medium',
    uxNotes: 'Notes: textarea or contenteditable main area, minimal chrome.',
    builderBrief: `NOTES / EDITOR BLUEPRINT:
- Large .praxis-input (textarea) or contenteditable region as main focus.
- Optional toolbar row with ghost buttons for bold/list if spec mentions formatting.`,
  },
  general: {
    builderBrief: `GENERAL UI RULES:
- body.praxis-app.praxis-fit for compact tools; avoid height:100vh / min-height:100vh unless the spec is a full-page experience.
- ONE primary .praxis-card (or clearly separated sections). No meta chips labeling the theme or app name unless the spec asks for branding.
- Match component count from spec — every listed component must appear and work.
- Prefer CSS grid or flex with explicit gaps; align baselines; equal-size controls in grids.
- No nested scroll areas unless the spec needs a long list/table.
- Every build must look visually distinct — vary palette usage, typography, spacing, and control styling.`,
  },
}
