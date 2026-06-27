/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: {
          DEFAULT: '#030712',
          card: 'rgba(17, 24, 39, 0.45)',
          border: 'rgba(255, 255, 255, 0.08)',
          hoverBorder: 'rgba(255, 255, 255, 0.15)',
        },
        nexora: {
          blue: '#3b82f6',
          purple: '#a855f7',
          pink: '#ec4899',
          indigo: '#6366f1',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 8px 32px 0 rgba(168, 85, 247, 0.15)',
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.5)',
        'glow-purple': '0 0 15px rgba(168, 85, 247, 0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      }
    },
  },
  plugins: [],
}
