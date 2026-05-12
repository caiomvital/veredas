import type { Metadata } from 'next'
import './globals.css'
import { SchoolProvider } from '@/hooks/useSchool'

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
        </SchoolProvider>
      </body>
    </html>
  )
}
