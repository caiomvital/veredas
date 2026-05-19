'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSchool } from '@/hooks/useSchool'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils/cn'
import { Avatar } from '@/components/ui/avatar'
import type { Perfil } from '@/types/school'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  GraduationCap,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bell,
  Calendar,
  DollarSign,
  MessageCircle,
  Settings,
  Database,
  Cake,
  RefreshCw,
  MessageSquare,
  Image,
  ChevronDown,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { getContagemPendentes } from '@/lib/actions/avisos-whatsapp'
import { contarNaoLidosProfessor } from '@/lib/actions/agenda'
import { getAniversariantesHoje } from '@/lib/actions/aniversariantes'
import { contarSolicitacoesAbertas } from '@/lib/actions/solicitacoes'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  perfis: Perfil[]
}

interface NavGroup {
  key: string
  label: string
  icon: React.ReactNode
  items: NavItem[]
}

const UNGROUPED_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/app/admin', icon: <LayoutDashboard size={20} />, perfis: ['admin', 'coordenador', 'secretaria', 'professor'] },
]

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'pessoas',
    label: 'Pessoas',
    icon: <Users size={20} />,
    items: [
      { label: 'Alunos', href: '/app/admin/alunos', icon: <Users size={20} />, perfis: ['admin', 'secretaria', 'coordenador'] },
      { label: 'Responsáveis', href: '/app/admin/responsaveis', icon: <Users size={20} />, perfis: ['admin', 'secretaria'] },
      { label: 'Funcionários', href: '/app/admin/funcionarios', icon: <Users size={20} />, perfis: ['admin', 'secretaria', 'coordenador'] },
    ],
  },
  {
    key: 'escola',
    label: 'Escola',
    icon: <BookOpen size={20} />,
    items: [
      { label: 'Turmas', href: '/app/admin/turmas', icon: <BookOpen size={20} />, perfis: ['admin', 'coordenador'] },
      { label: 'Disciplinas', href: '/app/admin/disciplinas', icon: <BookOpen size={20} />, perfis: ['admin'] },
      { label: 'Períodos Letivos', href: '/app/admin/periodos', icon: <Calendar size={20} />, perfis: ['admin', 'coordenador'] },
      { label: 'Professores', href: '/app/coordenador/professores', icon: <GraduationCap size={20} />, perfis: ['admin'] },
      { label: 'Aniversariantes', href: '/app/admin/aniversariantes', icon: <Cake size={20} />, perfis: ['admin', 'coordenador'] },
    ],
  },
  {
    key: 'secretaria',
    label: 'Secretaria',
    icon: <ClipboardList size={20} />,
    items: [
      { label: 'Matrículas', href: '/app/secretaria/matriculas', icon: <ClipboardList size={20} />, perfis: ['admin', 'secretaria'] },
      { label: 'Rematrícula', href: '/app/secretaria/rematricula', icon: <RefreshCw size={20} />, perfis: ['admin', 'secretaria'] },
      { label: 'Lista de Espera', href: '/app/secretaria/lista-espera', icon: <Users size={20} />, perfis: ['admin', 'secretaria'] },
      { label: 'Histórico Escolar', href: '/app/secretaria/historico', icon: <FileText size={20} />, perfis: ['admin', 'secretaria'] },
      { label: 'Transferência', href: '/app/secretaria/transferencia', icon: <FileText size={20} />, perfis: ['admin', 'secretaria'] },
      { label: 'Ficha do Aluno', href: '/app/secretaria/ficha-aluno', icon: <FileText size={20} />, perfis: ['admin', 'secretaria'] },
      { label: 'Declarações', href: '/app/secretaria/declaracoes', icon: <FileText size={20} />, perfis: ['admin', 'secretaria'] },
      { label: 'Contratos', href: '/app/secretaria/contratos', icon: <FileText size={20} />, perfis: ['admin', 'secretaria'] },
      { label: 'Justificativas', href: '/app/secretaria/justificativas', icon: <ClipboardList size={20} />, perfis: ['admin', 'secretaria'] },
      { label: 'Solicitações', href: '/app/secretaria/solicitacoes', icon: <MessageSquare size={20} />, perfis: ['admin', 'secretaria'] },
      { label: 'Censo Escolar', href: '/app/admin/censo', icon: <Database size={20} />, perfis: ['admin', 'secretaria'] },
      { label: 'Justificativas de Frequência', href: '/app/secretaria/frequencia-critica', icon: <ClipboardList size={20} />, perfis: ['admin', 'secretaria'] },
    ],
  },
  {
    key: 'academico',
    label: 'Acadêmico',
    icon: <BarChart3 size={20} />,
    items: [
      { label: 'Boletins', href: '/app/professor/boletins', icon: <FileText size={20} />, perfis: ['admin', 'coordenador'] },
      { label: 'Desempenho', href: '/app/coordenador/desempenho', icon: <BarChart3 size={20} />, perfis: ['coordenador'] },
      { label: 'Conselho de Classe', href: '/app/coordenador/conselho', icon: <ClipboardList size={20} />, perfis: ['coordenador'] },
      { label: 'Diários', href: '/app/coordenador/diarios', icon: <FileText size={20} />, perfis: ['coordenador'] },
      { label: 'Relatórios', href: '/app/admin/relatorios', icon: <BarChart3 size={20} />, perfis: ['admin'] },
      { label: 'Relatórios', href: '/app/coordenador/relatorios', icon: <BarChart3 size={20} />, perfis: ['coordenador'] },
    ],
  },
  {
    key: 'financeiro',
    label: 'Financeiro',
    icon: <DollarSign size={20} />,
    items: [
      { label: 'Financeiro', href: '/app/secretaria/financeiro', icon: <DollarSign size={20} />, perfis: ['admin', 'secretaria'] },
      { label: 'Inadimplência', href: '/app/admin/inadimplencia', icon: <DollarSign size={20} />, perfis: ['admin', 'secretaria'] },
      { label: 'Rel. Financeiro', href: '/app/admin/financeiro/relatorio', icon: <BarChart3 size={20} />, perfis: ['admin', 'secretaria'] },
      { label: 'Avisos WhatsApp', href: '/app/secretaria/avisos-whatsapp', icon: <MessageCircle size={20} />, perfis: ['admin', 'secretaria'] },
    ],
  },
  {
    key: 'comunicacao',
    label: 'Comunicação',
    icon: <Bell size={20} />,
    items: [
      { label: 'Comunicados', href: '/app/comunicados', icon: <Bell size={20} />, perfis: ['admin', 'coordenador', 'secretaria', 'professor'] },
      { label: 'Calendário', href: '/app/calendario', icon: <Calendar size={20} />, perfis: ['admin', 'coordenador', 'secretaria', 'professor'] },
      { label: 'Agenda', href: '/app/coordenador/agenda', icon: <MessageCircle size={20} />, perfis: ['coordenador'] },
    ],
  },
  {
    key: 'sistema',
    label: 'Sistema',
    icon: <Settings size={20} />,
    items: [
      { label: 'Exportação', href: '/app/admin/exportacao', icon: <Database size={20} />, perfis: ['admin', 'coordenador'] },
      { label: 'Galeria de Fotos', href: '/app/admin/fotos', icon: <Image size={20} />, perfis: ['admin'] },
      { label: 'Configurações', href: '/app/admin/configuracoes', icon: <Settings size={20} />, perfis: ['admin', 'coordenador'] },
    ],
  },
  {
    key: 'prof-turmas',
    label: 'Turmas',
    icon: <BookOpen size={20} />,
    items: [
      { label: 'Minhas Turmas', href: '/app/professor/minhas-turmas', icon: <BookOpen size={20} />, perfis: ['professor'] },
      { label: 'Chamada', href: '/app/professor/chamada', icon: <ClipboardList size={20} />, perfis: ['professor'] },
      { label: 'Notas', href: '/app/professor/notas', icon: <BarChart3 size={20} />, perfis: ['professor'] },
      { label: 'Boletins', href: '/app/professor/boletins', icon: <FileText size={20} />, perfis: ['professor'] },
      { label: 'Recuperação', href: '/app/professor/recuperacao', icon: <BarChart3 size={20} />, perfis: ['professor'] },
    ],
  },
  {
    key: 'prof-aulas',
    label: 'Aulas',
    icon: <FileText size={20} />,
    items: [
      { label: 'Registro de Aulas', href: '/app/professor/registro-aulas', icon: <FileText size={20} />, perfis: ['professor'] },
      { label: 'Atividades', href: '/app/professor/atividades', icon: <ClipboardList size={20} />, perfis: ['professor'] },
      { label: 'Planejamento', href: '/app/professor/planejamento', icon: <FileText size={20} />, perfis: ['professor'] },
      { label: 'Diário de Classe', href: '/app/professor/diarios', icon: <FileText size={20} />, perfis: ['professor'] },
    ],
  },
  {
    key: 'prof-alunos',
    label: 'Alunos',
    icon: <Users size={20} />,
    items: [
      { label: 'Agenda', href: '/app/professor/agenda', icon: <MessageCircle size={20} />, perfis: ['professor'] },
      { label: 'Frequência Crítica', href: '/app/professor/frequencia-critica', icon: <ClipboardList size={20} />, perfis: ['professor'] },
    ],
  },
  {
    key: 'prof-relatorios',
    label: 'Relatórios',
    icon: <BarChart3 size={20} />,
    items: [
      { label: 'Relatórios', href: '/app/professor/relatorios', icon: <BarChart3 size={20} />, perfis: ['professor'] },
    ],
  },
]

const PERFIL_GROUP_ORDER: Record<string, string[]> = {
  professor: ['prof-turmas', 'prof-aulas', 'prof-alunos', 'comunicacao', 'prof-relatorios'],
}

function getInitialOpenGroups(): Record<string, boolean> {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('sidebar:grupos')
      if (saved) return JSON.parse(saved)
    } catch {}
  }
  return { pessoas: true }
}

export function Sidebar() {
  const pathname = usePathname()
  const { config } = useSchool()
  const { perfil, user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [avisosCount, setAvisosCount] = useState(0)
  const [agendaNaoLidas, setAgendaNaoLidas] = useState(0)
  const [aniversariantesHoje, setAniversariantesHoje] = useState(0)
  const [solicitacoesCount, setSolicitacoesCount] = useState(0)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getInitialOpenGroups)

  useEffect(() => {
    getContagemPendentes().then((res) => {
      if (res.data) setAvisosCount(res.data.total)
    })
    getAniversariantesHoje().then((res) => {
      if (res.data) setAniversariantesHoje(res.data.total)
    })
    contarSolicitacoesAbertas().then((res) => {
      if (res.data) setSolicitacoesCount(res.data.total)
    })
    if (perfil === 'professor') {
      contarNaoLidosProfessor().then((res) => {
        if (res.data) setAgendaNaoLidas(res.data)
      })
    }
  }, [perfil])

  // Persist open groups to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar:grupos', JSON.stringify(openGroups))
  }, [openGroups])

  // Auto-open group containing the active item
  useEffect(() => {
    if (!perfil) return
    setOpenGroups((prev) => {
      const next = { ...prev }
      let changed = false

      for (const group of NAV_GROUPS) {
        const visibleItems = group.items.filter((item) => item.perfis.includes(perfil))
        const hasActive = visibleItems.some(
          (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
        )
        if (hasActive && !next[group.key]) {
          next[group.key] = true
          changed = true
        }
      }

      return changed ? next : prev
    })
  }, [pathname, perfil])

  const toggleGroup = useCallback((key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  if (!perfil) return null

  const filteredUngrouped = UNGROUPED_ITEMS.filter((item) => item.perfis.includes(perfil))

  const order = PERFIL_GROUP_ORDER[perfil]
  const filteredGroups = NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.perfis.includes(perfil)),
    }))
    .filter((group) => group.items.length > 0)
    .sort((a, b) => {
      if (!order) return 0
      return order.indexOf(a.key) - order.indexOf(b.key)
    })

  function isItemActive(item: NavItem) {
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  function renderBadge(item: NavItem) {
    if (item.href === '/app/secretaria/avisos-whatsapp' && avisosCount > 0) {
      return (
        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
          {avisosCount > 99 ? '99+' : avisosCount}
        </span>
      )
    }
    if (item.href === '/app/professor/agenda' && agendaNaoLidas > 0) {
      return (
        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-500 px-1.5 text-[10px] font-bold text-white">
          {agendaNaoLidas > 99 ? '99+' : agendaNaoLidas}
        </span>
      )
    }
    if (item.href === '/app/admin/aniversariantes' && aniversariantesHoje > 0) {
      return (
        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pink-500 px-1.5 text-[10px] font-bold text-white">
          {aniversariantesHoje}
        </span>
      )
    }
    if (item.href === '/app/secretaria/solicitacoes' && solicitacoesCount > 0) {
      return (
        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-bold text-white">
          {solicitacoesCount > 99 ? '99+' : solicitacoesCount}
        </span>
      )
    }
    return null
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-3 z-50 rounded-md bg-sidebar-bg p-2 text-sidebar-text lg:hidden"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar-bg text-sidebar-text transition-transform lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-white/20 text-sm font-bold">
            {config?.nome?.charAt(0) ?? 'E'}
          </div>
          <span className="truncate text-sm font-semibold">{config?.nome ?? 'Veredas'}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {/* Ungrouped items */}
            {filteredUngrouped.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isItemActive(item)
                      ? 'bg-sidebar-active text-white'
                      : 'text-white/70 hover:bg-sidebar-hover hover:text-white',
                  )}
                >
                  {item.icon}
                  <span className="flex-1 truncate">{item.label}</span>
                  {renderBadge(item)}
                </Link>
              </li>
            ))}

            {/* Divider */}
            {filteredUngrouped.length > 0 && filteredGroups.length > 0 && (
              <li className="border-t border-white/10 pt-1" />
            )}

            {/* Grouped items */}
            {filteredGroups.map((group) => {
              const groupOpen = openGroups[group.key] ?? false
              return (
                <li key={group.key}>
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-sidebar-hover hover:text-white"
                  >
                    {group.icon}
                    <span className="flex-1 truncate text-left">{group.label}</span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        'shrink-0 transition-transform duration-200',
                        groupOpen ? 'rotate-0' : '-rotate-90',
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-300 ease-in-out',
                      groupOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0',
                    )}
                  >
                    <div className="ml-8 space-y-0.5 pt-0.5">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                            isItemActive(item)
                              ? 'bg-sidebar-active text-white'
                              : 'text-white/70 hover:bg-sidebar-hover hover:text-white',
                          )}
                        >
                          <span className="flex-1 truncate">{item.label}</span>
                          {renderBadge(item)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User info */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={user?.email ?? 'U'} size="sm" />
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium">{user?.email}</p>
              <p className="text-xs capitalize text-white/60">{perfil}</p>
            </div>
            <button
              onClick={signOut}
              className="rounded-md p-1 text-white/60 transition-colors hover:bg-sidebar-hover hover:text-white"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
