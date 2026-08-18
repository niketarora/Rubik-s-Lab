/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#F7F7F8',
        surface: '#FFFFFF',
        code: '#0F172A',
        subtle: '#E5E7EB',
        primary: '#111827',
        secondary: '#6B7280',
        muted: '#9CA3AF',
        'on-dark': '#F8FAFC',
        
        // Accents
        'accent-blue': '#2563EB',
        'accent-blue-bg': '#DBEAFE',
        'accent-green': '#16A34A',
        'accent-green-bg': '#DCFCE7',
        'accent-red': '#DC2626',
        'accent-red-bg': '#FEE2E2',
        'accent-orange': '#EA580C',
        'accent-black': '#0F172A',

        // Cube Face Sticker Colors
        'cube-yellow': '#FFD500',
        'cube-white': '#FFFFFF',
        'cube-orange': '#FF5900',
        'cube-green': '#00A638',
        'cube-red': '#DC2626',
        'cube-blue': '#0045FF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      borderRadius: {
        'card': '12px',
        'btn': '8px',
      }
    },
  },
  plugins: [],
}
