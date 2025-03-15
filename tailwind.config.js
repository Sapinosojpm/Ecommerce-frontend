/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        fadeIn: 'fadeIn 1s ease-out', // Fade-in animation
        slideInUp: 'slideInUp 0.5s ease-out', // Slide up animation
        bounce: 'bounce 2s infinite', // Bounce animation
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' }, // Start from invisible and translate from bottom
          '100%': { opacity: '1', transform: 'translateY(0)' }, // End with full opacity and no translation
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' }, // Start from below and invisible
          '100%': { opacity: '1', transform: 'translateY(0)' }, // End at normal position
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' }, // Bounce back to normal position
          '50%': { transform: 'translateY(-20px)' }, // Bounce upwards
        },
      },
      // Add scrollbar styling here
      scrollbar: {
        DEFAULT: 'scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-gray-300', // Define the default scrollbar styles
      },
    },
  },
  plugins: [require('tailwind-scrollbar')],
}
