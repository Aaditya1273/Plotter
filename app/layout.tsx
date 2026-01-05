import './globals.css'
import './landing.css'
import type { Metadata } from 'next'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'MetaArmy - Intent-Driven DeFi Automation',
  description: 'Autonomous wealth management powered by MetaMask Advanced Permissions',
  icons: {
    icon: '/new/logo.png',
    shortcut: '/new/logo.png',
    apple: '/new/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  )
}