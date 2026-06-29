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
  color: ${vars.primaryBtnText || 'var(--praxis-navy)'};
  box-shadow: var(--praxis-glow);
}
.praxis-btn-ghost {
  background: var(--praxis-surface2);
  color: var(--praxis-text);
  border: 1px solid var(--praxis-edge);
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
${extras}
</style>`
}
