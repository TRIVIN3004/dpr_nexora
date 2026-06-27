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
          DEFAULT: '#f8fafc',
          card: 'rgba(255, 255, 255, 0.45)',
          border: 'rgba(0, 0, 0, 0.06)',
          hoverBorder: 'rgba(0, 0, 0, 0.12)',
        },
        nexora: {
          blue: '#2563eb',
          purple: '#9333ea',
          pink: '#db2777',
          indigo: '#4f46e5',
        },
        slate: {
          50: '#0f172a',
          100: '#1e293b',
          200: '#334155',
          300: '#475569',
          400: '#64748b',
          500: '#94a3b8',
          600: '#cbd5e1',
          700: '#e2e8f0',
          800: '#f1f5f9',
          900: '#f8fafc',
          950: '#ffffff',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
        'glass-hover': '0 8px 32px 0 rgba(147, 51, 234, 0.08)',
        'glow-blue': '0 0 12px rgba(37, 99, 235, 0.25)',
        'glow-purple': '0 0 12px rgba(147, 51, 234, 0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 100%)',
      }
    },
  },
  plugins: [],
}
