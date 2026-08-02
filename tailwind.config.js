/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0B1220',
        primary: '#4F8CFF',
        secondary: '#7C3AED',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        surface: '#0b1726'
      },
      borderRadius: {
        'xl-20': '20px'
      },
      boxShadow: {
        'glow-md': '0 10px 30px rgba(79,140,255,0.08), inset 0 1px 0 rgba(255,255,255,0.02)'
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui']
      },
      transitionDuration: {
        DEFAULT: '300'
      }
    }
  },
  plugins: []
}
