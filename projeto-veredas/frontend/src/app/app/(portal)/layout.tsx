'use client'

import { useAuth } from '@/hooks/useAuth'
import { useSchool } from '@/hooks/useSchool'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { useState, useEffect } from 'react'
import { contarNaoLidosResponsavel } from '@/lib/actions/agenda'

const NAV_ITEMS = [
  { label: 'Painel', href: '/app/responsavel/dashboard', icon: '📊' },
  { label: 'Notas', href: '/app/responsavel/notas', icon: '📝' },
  { label: 'Frequência', href: '/app/responsavel/frequencia', icon: '✅' },
  { label: 'Financeiro', href: '/app/responsavel/financeiro', icon: '💰' },
  { label: 'Boletim', href: '/app/responsavel/boletim', icon: '📄' },
  { label: 'Comunicados', href: '/app/responsavel/comunicados', icon: '🔔' },
  { label: 'Solicitações', href: '/app/responsavel/solicitacoes', icon: '📋' },
  { label: 'Agenda', href: '/app/responsavel/agenda', icon: '💬' },
  { label: 'Calendário', href: '/app/responsavel/calendario', icon: '📅' },
  { label: 'Meus Dados', href: '/app/responsavel/meus-dados', icon: '👤' },
]

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { perfil, user, signOut, isLoading: authLoading } = useAuth()
  const { config } = useSchool()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [agendaNaoLidas, setAgendaNaoLidas] = useState(0)

  useEffect(() => {
    if (!authLoading && perfil !== 'responsavel') {
      router.push('/app/login')
    }
    contarNaoLidosResponsavel().then((res) => {
      if (res.data) setAgendaNaoLidas(res.data)
    })
  }, [authLoading, perfil, router])

  if (authLoading || perfil !== 'responsavel') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zab-creme">
        <div className="animate-pulse text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-zab-verde/20" />
          <p className="mt-4 text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zab-creme">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/app/responsavel/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zab-verde text-white text-xs font-bold">
              ZAB
            </div>
            <span className="text-sm font-semibold text-zab-verde">
              {config?.nome ?? 'Portal do Responsável'}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    'relative px-3 py-1.5 text-sm rounded-md transition-colors',
                    isActive ? 'bg-zab-verde-claro text-zab-verde font-semibold' : 'text-zab-texto-claro hover:text-zab-verde hover:bg-zab-verde-claro/50'
                  )}>
                  {item.label}
                  {item.href === '/app/responsavel/agenda' && agendaNaoLidas > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {agendaNaoLidas > 9 ? '9+' : agendaNaoLidas}
                    </span>
                  )}
                </Link>
              )
            })}
            <button onClick={signOut}
              className="ml-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
              Sair
            </button>
          </nav>

          {/* Mobile toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-zab-texto" aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></svg>
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-stone-200 px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                className={cn(
                  'relative flex items-center px-3 py-2 text-sm rounded-md',
                  pathname === item.href ? 'bg-zab-verde-claro text-zab-verde font-semibold' : 'text-zab-texto-claro'
                )}>
                {item.icon} {item.label}
                {item.href === '/app/responsavel/agenda' && agendaNaoLidas > 0 && (
                  <span className="ml-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {agendaNaoLidas > 9 ? '9+' : agendaNaoLidas}
                  </span>
                )}
              </Link>
            ))}
            <button onClick={signOut} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">
              Sair
            </button>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} Grupo ZAB de Educação. Portal do Responsável.</p>
      </footer>
    </div>
  )
}
