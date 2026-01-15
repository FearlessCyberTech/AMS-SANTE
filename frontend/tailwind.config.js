// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'gradient-shift': 'gradientShift 3s ease infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-in': 'slideIn 0.6s ease-out',
        'ripple': 'ripple 0.6s linear',
        'shimmer': 'shimmer 2s infinite',
        'vibrate': 'vibrate 0.3s ease',
        'shine': 'shine 3s infinite',
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
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'neumorphic': '20px 20px 60px #d9d9d9, -20px -20px 60px #ffffff',
        'neumorphic-inset': 'inset 20px 20px 60px #d9d9d9, inset -20px -20px 60px #ffffff',
        'glow': '0 0 20px rgba(102, 126, 234, 0.5)',
        'glow-lg': '0 0 40px rgba(102, 126, 234, 0.8)',
      },
      textShadow: {
        'sm': '0 2px 10px rgba(0, 0, 0, 0.2)',
        'md': '0 4px 20px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [
    require('tailwindcss-textshadow'),
  ],
}