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
        cyber: {
          bg: '#090D16',
          panel: '#0F172A',
          card: '#161F36',
          border: '#1E293B',
          green: '#10B981',
          blue: '#38BDF8',
          purple: '#8B5CF6',
          rose: '#F43F5E',
          amber: '#F59E0B',
        },
      },
      fontFamily: {
        mono: ['"Fira Code"', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(56, 189, 248, 0.2), inset 0 0 5px rgba(56, 189, 248, 0.1)' },
          '100%': { boxShadow: '0 0 15px rgba(56, 189, 248, 0.5), inset 0 0 10px rgba(56, 189, 248, 0.2)' },
        },
      },
    },
  },
  plugins: [],
}
