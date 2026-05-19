'use client'

import { useAuth } from '@/hooks/useAuth'
import { useSchool } from '@/hooks/useSchool'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { useState, useEffect } from 'react'
import { contarNaoLidosResponsavel } from '@/lib/actions/agenda'
import { ChevronDown } from 'lucide-react'

interface PortalItem {
  label: string
  href: string
  icon: string
}

interface PortalGroup {
  key: string
  label: string
  icon: string
  items: PortalItem[]
}

const UNGROUPED_ITEMS: PortalItem[] = [
  { label: 'Painel', href: '/app/responsavel/dashboard', icon: '📊' },
]

const PORTAL_GROUPS: PortalGroup[] = [
  {
    key: 'meu-filho',
    label: 'Meu Filho',
    icon: '👤',
    items: [
      { label: 'Notas', href: '/app/responsavel/notas', icon: '📝' },
      { label: 'Frequência', href: '/app/responsavel/frequencia', icon: '✅' },
      { label: 'Boletim', href: '/app/responsavel/boletim', icon: '📄' },
    ],
  },
  {
    key: 'comunicacao',
    label: 'Comunicação',
    icon: '📢',
    items: [
      { label: 'Agenda', href: '/app/responsavel/agenda', icon: '💬' },
      { label: 'Comunicados', href: '/app/responsavel/comunicados', icon: '🔔' },
      { label: 'Calendário', href: '/app/responsavel/calendario', icon: '📅' },
    ],
  },
]

const STANDALONE_ITEMS: PortalItem[] = [
  { label: 'Financeiro', href: '/app/responsavel/financeiro', icon: '💰' },
  { label: 'Solicitações', href: '/app/responsavel/solicitacoes', icon: '📋' },
  { label: 'Meus Dados', href: '/app/responsavel/meus-dados', icon: '👤' },
]

const DESKTOP_ITEMS: PortalItem[] = [
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('portal:grupos')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return { 'meu-filho': true }
  })

  useEffect(() => {
    if (!authLoading && perfil !== 'responsavel') {
      router.push('/app/login')
    }
    contarNaoLidosResponsavel().then((res) => {
      if (res.data) setAgendaNaoLidas(res.data)
    })
  }, [authLoading, perfil, router])

  useEffect(() => {
    localStorage.setItem('portal:grupos', JSON.stringify(openGroups))
  }, [openGroups])

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

  function renderBadge(href: string) {
    if (href === '/app/responsavel/agenda' && agendaNaoLidas > 0) {
      return (
        <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
          {agendaNaoLidas > 9 ? '9+' : agendaNaoLidas}
        </span>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-zab-creme">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/app/responsavel/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zab-verde text-xs font-bold text-white">
              ZAB
            </div>
            <span className="text-sm font-semibold text-zab-verde">
              {config?.nome ?? 'Portal do Responsável'}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {DESKTOP_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative rounded-md px-3 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-zab-verde-claro font-semibold text-zab-verde'
                      : 'text-zab-texto-claro hover:bg-zab-verde-claro/50 hover:text-zab-verde',
                  )}
                >
                  {item.label}
                  {renderBadge(item.href)}
                </Link>
              )
            })}
            <button
              onClick={signOut}
              className="ml-2 rounded-md px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              Sair
            </button>
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-zab-texto md:hidden"
            aria-label="Menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>

        {/* Mobile nav with groups */}
        {menuOpen && (
          <div className="space-y-1 border-t border-stone-200 px-4 py-3 md:hidden">
            {/* Ungrouped: Painel */}
            <Link
              key="/app/responsavel/dashboard"
              href="/app/responsavel/dashboard"
              onClick={() => setMenuOpen(false)}
              className={cn(
                'flex items-center rounded-md px-3 py-2 text-sm',
                pathname === '/app/responsavel/dashboard'
                  ? 'bg-zab-verde-claro font-semibold text-zab-verde'
                  : 'text-zab-texto-claro',
              )}
            >
              <span className="mr-2">📊</span> Painel
            </Link>

            {/* Groups */}
            {PORTAL_GROUPS.map((group) => {
              const isOpen = openGroups[group.key] ?? false
              return (
                <div key={group.key}>
                  <button
                    onClick={() =>
                      setOpenGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))
                    }
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-zab-texto transition-colors hover:bg-zab-verde-claro/50"
                  >
                    <span>{group.icon}</span>
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        'transition-transform duration-200',
                        isOpen ? 'rotate-0' : '-rotate-90',
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-300 ease-in-out',
                      isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0',
                    )}
                  >
                    <div className="ml-4 space-y-0.5 pt-0.5">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            'flex items-center rounded-md px-3 py-2 text-sm',
                            pathname === item.href
                              ? 'bg-zab-verde-claro font-semibold text-zab-verde'
                              : 'text-zab-texto-claro',
                          )}
                        >
                          <span className="mr-2">{item.icon}</span>
                          <span className="flex-1">{item.label}</span>
                          {renderBadge(item.href)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Standalone items */}
            {STANDALONE_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-sm',
                  pathname === item.href
                    ? 'bg-zab-verde-claro font-semibold text-zab-verde'
                    : 'text-zab-texto-claro',
                )}
              >
                <span className="mr-2">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {renderBadge(item.href)}
              </Link>
            ))}

            <button
              onClick={signOut}
              className="w-full rounded-md px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              Sair
            </button>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} Grupo ZAB de Educação. Portal do Responsável.</p>
      </footer>
    </div>
  )
}
