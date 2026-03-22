import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Signal — Biometric Intelligence',
  description: 'Your body. Decoded.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
