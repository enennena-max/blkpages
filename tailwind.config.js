/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js",
    "./assets/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'poppins': ['Poppins', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        'neon-pink': '#FF3CAC',
        'neon-purple': '#784BA0',
        'neon-blue': '#2B86C5',
        'neon-green': '#4ADE80',
        'charcoal': '#121212',
        'dark-grey': '#1A1A1A',
        'light-grey': '#E5E5E5',
        'gold': '#D4AF37',
        'gold-dark': '#B8941F',
        'black': '#000000',
        'white': '#FFFFFF',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(255, 60, 172, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(255, 60, 172, 0.6)' }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}