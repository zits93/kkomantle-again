/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        excel: {
          header: '#107c41',
          headerDark: '#0b5a2f',
          ribbon: '#f3f2f1',
          ribbonBorder: '#d2d0ce',
          gridBorder: '#e1dfdd',
          cellSelected: '#107c41',
          cellBg: '#ffffff',
          cellHeaderBg: '#f8f9fa',
          cellHeaderText: '#5f6368',
        },
        glass: {
          bg: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.16)',
          card: 'rgba(20, 24, 38, 0.65)',
        }
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'monospace'],
        excel: ['Calibri', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'glass-glow': '0 0 25px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'excel-active': 'inset 0 0 0 2px #107c41',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
