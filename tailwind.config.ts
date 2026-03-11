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
        background: '#0A0A0A',
        card: '#1A1A2E',
        accent: '#F5C518',
        cyan: '#00D4FF',
        success: '#00FF88',
        error: '#FF4444',
        bodyText: '#FFFFFF',
        secondary: '#CCCCCC',
        disabled: '#444444',
      },
      fontSize: {
        'body': '18px',
        'btn': '22px',
        'h1': '32px',
        'h2': '24px',
      },
      minHeight: {
        'btn': '60px',
        'upload': '200px',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}

export default config
