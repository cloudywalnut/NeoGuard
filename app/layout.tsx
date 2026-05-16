import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NeoGuard — AI Maternal & Fetal Care',
  description: 'SGA prediction and fetal monitoring platform. Research by Dr. Saw Shier Nee, Universiti Malaya.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}
