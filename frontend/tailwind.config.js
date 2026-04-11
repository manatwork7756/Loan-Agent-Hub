/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        head: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        navy:  { DEFAULT: '#0F172A', light: '#1E293B', mid: '#334155' },
        brand: { DEFAULT: '#3B82F6', dark: '#2563EB' },
      },
      animation: {
        'fade-up': 'fadeUp 0.3s ease',
        'slide-in': 'slideIn 0.3s ease',
        'blink': 'blink 1.2s infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        blink:   { '0%,80%,100%': { opacity: 0.3 }, '40%': { opacity: 1 } },
      },
    },
  },
  plugins: [],
}
