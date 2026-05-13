import type { Metadata } from 'next'
import './globals.css'
import { SchoolProvider } from '@/hooks/useSchool'
import { ToastProvider } from '@/components/ui/toast-provider'
import { InstallBanner } from '@/components/pwa/install-banner'

export const metadata: Metadata = {
  title: 'Veredas - Gestão Escolar',
  description: 'Sistema de gestão escolar conectada para escolas, professores e famílias.',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Veredas" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
      </head>
      <body>
        <SchoolProvider>
          {children}
          <InstallBanner />
          <ToastProvider />
        </SchoolProvider>
      </body>
    </html>
  )
}
