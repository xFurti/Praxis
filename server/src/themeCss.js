/** Shared Praxis class structure — themes override CSS variables and add flavor. */

export function buildThemeStyleBlock(vars, extras = '') {
  return String.raw`<style>
:root {
  color-scheme: ${vars.colorScheme || 'dark'};
  --praxis-navy: ${vars.background};
  --praxis-navy2: ${vars.backgroundAlt};
  --praxis-surface: ${vars.surface};
  --praxis-surface2: ${vars.surfaceAlt};
  --praxis-edge: ${vars.edge};
  --praxis-cyan: ${vars.accent};
  --praxis-violet: ${vars.accentSecondary};
  --praxis-text: ${vars.text};
  --praxis-muted: ${vars.muted};
  --praxis-glow: ${vars.glow};
  --praxis-window: ${vars.windowShadow};
  --praxis-body-bg: ${vars.bodyBackground};
  --praxis-radius: ${vars.radius || '16px'};
  --praxis-radius-sm: ${vars.radiusSm || '10px'};
  --praxis-font-display: ${vars.fontDisplay || '"Space Grotesk", Inter, system-ui, sans-serif'};
  --praxis-font-body: ${vars.fontBody || 'Inter, system-ui, sans-serif'};
  --praxis-primary-fg: ${vars.primaryBtnText || '#0b1228'};
}
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body.praxis-app {
  font-family: var(--praxis-font-body);
  color: var(--praxis-text);
  background: var(--praxis-body-bg);
}
.praxis-card {
  border: 1px solid var(--praxis-edge);
  background: var(--praxis-surface);
  border-radius: var(--praxis-radius);
  box-shadow: var(--praxis-window);
  backdrop-filter: blur(18px);
  padding: 16px;
}
.praxis-display {
  font-family: var(--praxis-font-display);
  color: var(--praxis-text);
  letter-spacing: -0.03em;
  text-shadow: ${vars.displayShadow || '0 0 18px rgba(139, 92, 246, 0.25)'};
}
.praxis-input {
  width: 100%;
  border: 1px solid var(--praxis-edge);
  background: var(--praxis-navy2);
  color: var(--praxis-text);
  border-radius: var(--praxis-radius-sm);
  padding: 10px 14px;
  outline: none;
}
.praxis-input::placeholder { color: var(--praxis-muted); }
.praxis-input:focus {
  border-color: var(--praxis-cyan);
  box-shadow: var(--praxis-glow);
}
.praxis-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: var(--praxis-radius-sm);
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 120ms ease, filter 120ms ease;
}
.praxis-btn:active { transform: scale(0.98); }
.praxis-btn-primary {
  background: linear-gradient(135deg, var(--praxis-cyan), var(--praxis-violet));
  color: var(--praxis-primary-fg);
  box-shadow: var(--praxis-glow);
}
.praxis-btn-ghost {
  background: var(--praxis-surface2);
  color: var(--praxis-text);
  border: 1px solid var(--praxis-edge);
}
.praxis-btn-ghost:hover {
  filter: brightness(1.08);
}
.praxis-row { display: flex; gap: 12px; align-items: center; }
.praxis-col { display: flex; flex-direction: column; gap: 12px; }
.praxis-grid { display: grid; gap: 12px; }
.praxis-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 9999px;
  border: 1px solid var(--praxis-edge);
  background: var(--praxis-surface2);
  padding: 4px 10px;
  font-size: 12px;
  color: var(--praxis-muted);
}
.praxis-divider {
  height: 1px;
  width: 100%;
  background: linear-gradient(to right, transparent, var(--praxis-edge), transparent);
}
body.praxis-app.praxis-fit {
  min-height: 0;
  height: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 12px;
}
.praxis-readout {
  width: 100%;
  text-align: right;
  font-family: var(--praxis-font-display);
  font-size: clamp(1.5rem, 5vw, 2.25rem);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  color: var(--praxis-text);
  padding: 12px 16px;
  border-radius: var(--praxis-radius-sm);
  background: var(--praxis-surface2);
  border: 1px solid var(--praxis-edge);
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.praxis-calc-pad {
  display: grid;
  gap: 8px;
}
.praxis-calc-pad .praxis-btn-ghost {
  color: var(--praxis-text);
  background: var(--praxis-surface2);
  border: 1px solid var(--praxis-edge);
}
.praxis-calc-pad .praxis-btn-op {
  color: var(--praxis-cyan);
  font-weight: 700;
}
.praxis-calc-pad .praxis-btn-clear {
  color: #f87171;
  font-weight: 700;
}
.praxis-calc-pad .praxis-btn-primary {
  color: var(--praxis-primary-fg);
  font-weight: 700;
}
.praxis-grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.praxis-list { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }
.praxis-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--praxis-radius-sm);
  background: var(--praxis-surface2);
  border: 1px solid var(--praxis-edge);
}
${extras}
</style>`
}
