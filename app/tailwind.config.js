/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        praxis: {
          navy: '#070b1a',
          navy2: '#0c1226',
          surface: '#121a33',
          surface2: '#1a2342',
          edge: '#243056',
          cyan: '#22d3ee',
          violet: '#8b5cf6',
          text: '#e6ebff',
          muted: '#8b93b8',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(34,211,238,0.35)',
        'glow-violet': '0 0 24px rgba(139,92,246,0.35)',
        window: '0 18px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(36,48,86,0.8)',
      },
      backgroundImage: {
        'tech-magic': 'linear-gradient(135deg,#22d3ee 0%,#8b5cf6 100%)',
        'navy-radial':
          'radial-gradient(1200px 600px at 50% -10%, rgba(139,92,246,0.18), transparent 60%), radial-gradient(900px 500px at 10% 110%, rgba(34,211,238,0.12), transparent 60%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%,100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        bob: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        blink: {
          '0%,100%': { opacity: '0.35' },
          '50%': { opacity: '1' },
        },
        jump: {
          '0%': { transform: 'translateX(-50%) translateY(18px) scale(0.92)', opacity: '0' },
          '55%': { transform: 'translateX(-50%) translateY(-10px) scale(1.02)', opacity: '1' },
          '100%': { transform: 'translateX(-50%) translateY(0px) scale(1)', opacity: '1' },
        },
        'upload-reveal': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'upload-pop': {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '70%': { transform: 'scale(1.04)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'prompt-focus': {
          '0%,100%': { boxShadow: '0 0 24px rgba(34,211,238,0.25)' },
          '50%': { boxShadow: '0 0 32px rgba(139,92,246,0.35)' },
        },
        'drag-glow': {
          '0%,100%': { boxShadow: '0 0 20px rgba(139,92,246,0.25)' },
          '50%': { boxShadow: '0 0 36px rgba(34,211,238,0.4)' },
        },
        'generate-ready': {
          '0%,100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        'window-spawn': {
          '0%': { opacity: '0', transform: 'scale(0.94) translateY(12px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'creation-pulse': {
          '0%,100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'creation-pulse-reverse': {
          '0%,100%': { opacity: '0.4' },
          '50%': { opacity: '0.85' },
        },
        'creation-glow': {
          '0%,100%': { opacity: '0.35', transform: 'scale(0.95)' },
          '50%': { opacity: '0.7', transform: 'scale(1.08)' },
        },
        'creation-sigil': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'creation-orbit': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'creation-orbit-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'creation-particle': {
          '0%,100%': { opacity: '0', transform: 'scale(0.5)' },
          '50%': { opacity: '1', transform: 'scale(1.5)' },
        },
        'creation-scan': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '15%': { opacity: '1' },
          '85%': { opacity: '1' },
          '100%': { transform: 'translateY(400%)', opacity: '0' },
        },
        'creation-beam': {
          '0%': { top: '-4rem', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '0.6' },
          '100%': { top: '100%', opacity: '0' },
        },
        'creation-corner': {
          '0%,100%': { opacity: '0.35' },
          '50%': { opacity: '1' },
        },
        'creation-code': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '20%': { opacity: '1', transform: 'translateY(0)' },
          '80%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translateY(-4px)' },
        },
        'creation-dots': {
          '0%,20%': { opacity: '0.2' },
          '40%': { opacity: '1' },
          '60%,100%': { opacity: '0.2' },
        },
        'creation-aura': {
          '0%,100%': { opacity: '0.45', transform: 'scale(0.92)' },
          '50%': { opacity: '0.85', transform: 'scale(1.06)' },
        },
        'creation-grid': {
          '0%,100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
        bob: 'bob 2.2s ease-in-out infinite',
        blink: 'blink 1.2s ease-in-out infinite',
        jump: 'jump 420ms ease-out forwards',
        'upload-reveal': 'upload-reveal 320ms ease-out forwards',
        'upload-pop': 'upload-pop 420ms ease-out forwards',
        'prompt-focus': 'prompt-focus 2.4s ease-in-out infinite',
        'drag-glow': 'drag-glow 1.2s ease-in-out infinite',
        'generate-ready': 'generate-ready 2s ease-in-out infinite',
        'window-spawn': 'window-spawn 480ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'creation-pulse': 'creation-pulse 3.2s ease-in-out infinite',
        'creation-pulse-reverse': 'creation-pulse-reverse 4s ease-in-out infinite',
        'creation-glow': 'creation-glow 2.4s ease-in-out infinite',
        'creation-sigil': 'creation-sigil 18s linear infinite',
        'creation-orbit': 'creation-orbit 6s linear infinite',
        'creation-orbit-reverse': 'creation-orbit-reverse 9s linear infinite',
        'creation-particle': 'creation-particle 2.8s ease-in-out infinite',
        'creation-scan': 'creation-scan 2.4s ease-in-out infinite',
        'creation-beam': 'creation-beam 2.8s ease-in-out infinite',
        'creation-corner': 'creation-corner 1.6s ease-in-out infinite',
        'creation-code': 'creation-code 2.4s ease-in-out forwards',
        'creation-dots': 'creation-dots 1.2s ease-in-out infinite',
        'creation-aura': 'creation-aura 3s ease-in-out infinite',
        'creation-grid': 'creation-grid 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
