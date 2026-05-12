import type { Metadata } from 'next'
import './globals.css'
import { SchoolProvider } from '@/hooks/useSchool'
import { ToastProvider } from '@/components/ui/toast-provider'

export const metadata: Metadata = {
  title: 'Veredas - Gestão Escolar',
  description: 'Sistema de gestão escolar',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <SchoolProvider>
          {children}
          <ToastProvider />
        </SchoolProvider>
      </body>
    </html>
  )
}
