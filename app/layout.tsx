import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Textbook Podcast',
  description: 'Upload a textbook photo and get an AI-generated audio lecture.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Textbook Podcast',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        style={{
          backgroundColor: '#0A0A0A',
          color: '#FFFFFF',
          minHeight: '100vh',
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </body>
    </html>
  )
}
