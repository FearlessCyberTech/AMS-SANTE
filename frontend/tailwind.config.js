// tailwind.config.js
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class', // Active le mode sombre via une classe
  theme: {
    extend: {
      // Intégration de vos variables CSS personnalisées
      colors: {
        primary: {
          blue: 'var(--primary-blue)',
          'blue-dark': 'var(--primary-blue-dark)',
          'blue-light': 'var(--primary-blue-light)',
        },
        secondary: {
          teal: 'var(--secondary-teal)',
          'teal-light': 'var(--secondary-teal-light)',
        },
        success: {
          green: 'var(--success-green)',
          'green-light': 'var(--success-green-light)',
        },
        warning: {
          orange: 'var(--warning-orange)',
          'orange-light': 'var(--warning-orange-light)',
        },
        error: {
          red: 'var(--error-red)',
          'red-light': 'var(--error-red-light)',
        },
        info: {
          blue: 'var(--info-blue)',
          'blue-light': 'var(--info-blue-light)',
        },
        gray: {
          50: 'var(--gray-50)',
          100: 'var(--gray-100)',
          200: 'var(--gray-200)',
          300: 'var(--gray-300)',
          400: 'var(--gray-400)',
          500: 'var(--gray-500)',
          600: 'var(--gray-600)',
          700: 'var(--gray-700)',
          800: 'var(--gray-800)',
          900: 'var(--gray-900)',
        }
      },
      fontFamily: {
        primary: ['Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        'full': 'var(--radius-full)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
      },
      transitionDuration: {
        'fast': 'var(--transition-fast)',
        'normal': 'var(--transition-normal)',
        'slow': 'var(--transition-slow)',
      },
      zIndex: {
        'dropdown': 'var(--z-dropdown)',
        'sticky': 'var(--z-sticky)',
        'fixed': 'var(--z-fixed)',
        'modal': 'var(--z-modal)',
        'popover': 'var(--z-popover)',
        'tooltip': 'var(--z-tooltip)',
      },
      // Ajout des animations de votre fichier
      animation: {
        'gradient-shift': 'gradientShift 3s ease infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-in': 'slideIn 0.6s ease-out',
        'ripple': 'ripple 0.6s linear',
        'shimmer': 'shimmer 2s infinite',
        'vibrate': 'vibrate 0.3s ease',
        'shine': 'shine 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn var(--transition-normal)',
        'slide-in-left': 'slideInLeft var(--transition-normal)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'secondary-gradient': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'success-gradient': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'warning-gradient': 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
    },
  },
  plugins: [
    require('tailwindcss-textshadow'),
    // Plugin pour les animations personnalisées
    plugin(function({ addUtilities, theme }) {
      const newUtilities = {
        '.animate-gradient-x': {
          backgroundSize: '200% 200%',
          animation: 'gradient-x 3s ease infinite',
        },
        '.animate-pulse-slow': {
          animation: 'pulse-slow 2s ease-in-out infinite',
        },
        '.animate-shimmer': {
          animation: 'shimmer 2s infinite',
        },
        '.animate-slide-up': {
          animation: 'slide-up 0.5s ease-out',
        },
        '.glass-effect': {
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        },
        '.hover-lift': {
          transition: 'transform 0.2s ease',
        },
        '.hover-lift:hover': {
          transform: 'translateY(-2px)',
        },
      }
      addUtilities(newUtilities)
    })
  ],
}