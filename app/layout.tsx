import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BenPodcast — Textbook to Sports Debate',
  description: 'Turn your textbook into a sports debate podcast',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#0A0A0A', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
