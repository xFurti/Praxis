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
      },
      animation: {
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
