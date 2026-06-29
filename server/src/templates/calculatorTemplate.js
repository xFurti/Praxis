import { getThemeCssForSpec } from '../styleDirector.js'

const CALC_LAYOUT_CSS = `
body.praxis-app.praxis-fit {
  min-height: 0;
  height: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 12px;
}
.praxis-calc-shell {
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
}
.praxis-readout {
  width: 100%;
  text-align: right;
  font-family: var(--praxis-font-display);
  font-size: 2rem;
  font-variant-numeric: tabular-nums;
  color: var(--praxis-text);
  padding: 14px 16px;
  border-radius: var(--praxis-radius-sm);
  background: var(--praxis-surface2);
  border: 1px solid var(--praxis-edge);
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.praxis-calc-pad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(5, 52px);
  gap: 8px;
}
.praxis-calc-pad .praxis-btn {
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 0;
  margin: 0;
  font-size: 1.05rem;
  border-radius: var(--praxis-radius-sm);
}
.praxis-calc-pad .praxis-btn-ghost {
  color: var(--praxis-text);
  background: var(--praxis-surface2);
  border: 1px solid var(--praxis-edge);
}
.praxis-calc-pad .praxis-btn-op { color: var(--praxis-cyan); font-weight: 700; }
.praxis-calc-pad .praxis-btn-clear { color: #f87171; font-weight: 700; }
.praxis-calc-pad .praxis-btn-primary { color: var(--praxis-primary-fg); font-weight: 700; }
`

/**
 * Deterministic calculator HTML — correct grid layout, themed via spec design.
 * @param {Record<string, unknown>} spec
 */
export function buildCalculatorHtml(spec) {
  const themeCss = getThemeCssForSpec(spec)
  const styleBlock = themeCss.replace('</style>', `${CALC_LAYOUT_CSS}\n</style>`)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${styleBlock}
</head>
<body class="praxis-app praxis-fit">
  <div class="praxis-card praxis-calc-shell">
    <div id="display" class="praxis-readout" aria-live="polite">0</div>
    <div class="praxis-calc-pad" role="group" aria-label="Calculator keypad">
      <button type="button" class="praxis-btn praxis-btn-ghost praxis-btn-clear" data-action="clear" style="grid-area:1/1">C</button>
      <button type="button" class="praxis-btn praxis-btn-ghost praxis-btn-op" data-action="op" data-op="/" style="grid-area:1/2">÷</button>
      <button type="button" class="praxis-btn praxis-btn-ghost praxis-btn-op" data-action="op" data-op="*" style="grid-area:1/3">×</button>
      <button type="button" class="praxis-btn praxis-btn-ghost praxis-btn-op" data-action="op" data-op="-" style="grid-area:1/4">−</button>

      <button type="button" class="praxis-btn praxis-btn-ghost" data-action="digit" data-digit="7" style="grid-area:2/1">7</button>
      <button type="button" class="praxis-btn praxis-btn-ghost" data-action="digit" data-digit="8" style="grid-area:2/2">8</button>
      <button type="button" class="praxis-btn praxis-btn-ghost" data-action="digit" data-digit="9" style="grid-area:2/3">9</button>
      <button type="button" class="praxis-btn praxis-btn-ghost praxis-btn-op" data-action="op" data-op="+" style="grid-row:2/span 2;grid-column:4">+</button>

      <button type="button" class="praxis-btn praxis-btn-ghost" data-action="digit" data-digit="4" style="grid-area:3/1">4</button>
      <button type="button" class="praxis-btn praxis-btn-ghost" data-action="digit" data-digit="5" style="grid-area:3/2">5</button>
      <button type="button" class="praxis-btn praxis-btn-ghost" data-action="digit" data-digit="6" style="grid-area:3/3">6</button>

      <button type="button" class="praxis-btn praxis-btn-ghost" data-action="digit" data-digit="1" style="grid-area:4/1">1</button>
      <button type="button" class="praxis-btn praxis-btn-ghost" data-action="digit" data-digit="2" style="grid-area:4/2">2</button>
      <button type="button" class="praxis-btn praxis-btn-ghost" data-action="digit" data-digit="3" style="grid-area:4/3">3</button>
      <button type="button" class="praxis-btn praxis-btn-primary" data-action="equals" style="grid-row:4/span 2;grid-column:4">=</button>

      <button type="button" class="praxis-btn praxis-btn-ghost" data-action="digit" data-digit="0" style="grid-row:5;grid-column:1/span 2">0</button>
      <button type="button" class="praxis-btn praxis-btn-ghost" data-action="dot" style="grid-area:5/3">.</button>
    </div>
  </div>
  <script>
(function () {
  var display = document.getElementById('display');
  var current = '0';
  var stored = null;
  var pendingOp = null;
  var fresh = true;

  function render() {
    display.textContent = current;
  }

  function inputDigit(d) {
    if (fresh) {
      current = d === '0' ? '0' : d;
      fresh = false;
    } else {
      current = current === '0' ? d : current + d;
    }
    render();
  }

  function inputDot() {
    if (fresh) {
      current = '0.';
      fresh = false;
      render();
      return;
    }
    if (!current.includes('.')) {
      current += '.';
      render();
    }
  }

  function clearAll() {
    current = '0';
    stored = null;
    pendingOp = null;
    fresh = true;
    render();
  }

  function compute(a, b, op) {
    var x = parseFloat(a);
    var y = parseFloat(b);
    if (op === '+') return String(x + y);
    if (op === '-') return String(x - y);
    if (op === '*') return String(x * y);
    if (op === '/') return y === 0 ? 'Error' : String(x / y);
    return b;
  }

  function formatResult(value) {
    if (value === 'Error') return value;
    var n = parseFloat(value);
    if (!isFinite(n)) return 'Error';
    var s = String(Math.round(n * 1e10) / 1e10);
    return s;
  }

  function chooseOp(op) {
    if (pendingOp && !fresh) {
      current = formatResult(compute(stored, current, pendingOp));
    } else if (stored === null) {
      stored = current;
    }
    pendingOp = op;
    fresh = true;
    render();
  }

  function equals() {
    if (!pendingOp) return;
    current = formatResult(compute(stored, current, pendingOp));
    stored = null;
    pendingOp = null;
    fresh = true;
    render();
  }

  document.querySelector('.praxis-calc-pad').addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    if (action === 'digit') inputDigit(btn.getAttribute('data-digit'));
    else if (action === 'dot') inputDot();
    else if (action === 'clear') clearAll();
    else if (action === 'op') chooseOp(btn.getAttribute('data-op'));
    else if (action === 'equals') equals();
  });
})();
  </script>
</body>
</html>`
}

/** Split HTML into chunks for SSE streaming. */
export function chunkHtmlForStream(html) {
  const size = 420
  const chunks = []
  for (let i = 0; i < html.length; i += size) {
    chunks.push(html.slice(i, i + size))
  }
  return chunks
}
