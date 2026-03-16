import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-main': '#0A0A0A',
        'bg-card': '#1A1A2E',
        'accent': '#F5C518',
        'success': '#00FF88',
        'error': '#FF4444',
        'status': '#00D4FF',
        'text-primary': '#FFFFFF',
        'text-secondary': '#CCCCCC',
        'disabled': '#444444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      lineHeight: {
        'relaxed': '1.6',
      },
    },
  },
  plugins: [],
}
export default config
