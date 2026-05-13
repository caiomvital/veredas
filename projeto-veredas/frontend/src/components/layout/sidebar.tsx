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
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { getContagemPendentes } from '@/lib/actions/avisos-whatsapp'
import { contarNaoLidosProfessor, contarNaoLidosResponsavel } from '@/lib/actions/agenda'
import { getAniversariantesHoje } from '@/lib/actions/aniversariantes'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  perfis: Perfil[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={20} />, perfis: ['admin', 'coordenador', 'secretaria', 'professor'] },
  // Admin / Coordenação
  { label: 'Alunos', href: '/admin/alunos', icon: <Users size={20} />, perfis: ['admin', 'coordenador', 'secretaria'] },
  { label: 'Responsáveis', href: '/admin/responsaveis', icon: <Users size={20} />, perfis: ['admin', 'secretaria'] },
  { label: 'Turmas', href: '/admin/turmas', icon: <BookOpen size={20} />, perfis: ['admin', 'coordenador'] },
  { label: 'Disciplinas', href: '/admin/disciplinas', icon: <BookOpen size={20} />, perfis: ['admin', 'coordenador'] },
  { label: 'Matrículas', href: '/secretaria/matriculas', icon: <ClipboardList size={20} />, perfis: ['admin', 'secretaria'] },
  { label: 'Professores', href: '/coordenador/professores', icon: <GraduationCap size={20} />, perfis: ['admin', 'coordenador'] },
  { label: 'Desempenho', href: '/coordenador/desempenho', icon: <BarChart3 size={20} />, perfis: ['coordenador'] },
  { label: 'Períodos Letivos', href: '/admin/periodos', icon: <Calendar size={20} />, perfis: ['admin', 'coordenador'] },
  // Professor
  { label: 'Minhas Turmas', href: '/professor/minhas-turmas', icon: <BookOpen size={20} />, perfis: ['professor'] },
  { label: 'Notas', href: '/professor/notas', icon: <BarChart3 size={20} />, perfis: ['professor'] },
  { label: 'Chamada', href: '/professor/chamada', icon: <ClipboardList size={20} />, perfis: ['professor'] },
  { label: 'Registro de Aulas', href: '/professor/registro-aulas', icon: <FileText size={20} />, perfis: ['professor'] },
  { label: 'Atividades', href: '/professor/atividades', icon: <ClipboardList size={20} />, perfis: ['professor'] },
  { label: 'Planejamento', href: '/professor/planejamento', icon: <FileText size={20} />, perfis: ['professor'] },
  { label: 'Diários de Classe', href: '/professor/diarios', icon: <FileText size={20} />, perfis: ['professor'] },
  { label: 'Agenda', href: '/professor/agenda', icon: <MessageCircle size={20} />, perfis: ['professor'] },
  { label: 'Diários de Classe', href: '/coordenador/diarios', icon: <FileText size={20} />, perfis: ['coordenador'] },
  { label: 'Agenda', href: '/coordenador/agenda', icon: <MessageCircle size={20} />, perfis: ['coordenador'] },
  // Geral
  { label: 'Boletins', href: '/professor/boletins', icon: <FileText size={20} />, perfis: ['admin', 'coordenador', 'secretaria', 'professor'] },
  { label: 'Declarações', href: '/secretaria/declaracoes', icon: <FileText size={20} />, perfis: ['admin', 'secretaria'] },
  { label: 'Ficha do Aluno', href: '/secretaria/ficha-aluno', icon: <FileText size={20} />, perfis: ['admin', 'secretaria'] },
  { label: 'Aniversariantes', href: '/admin/aniversariantes', icon: <Cake size={20} />, perfis: ['admin', 'coordenador'] },
  { label: 'Censo Escolar', href: '/admin/censo', icon: <Database size={20} />, perfis: ['admin'] },
  { label: 'Frequência Crítica', href: '/secretaria/frequencia-critica', icon: <ClipboardList size={20} />, perfis: ['admin', 'secretaria'] },
  { label: 'Histórico Escolar', href: '/secretaria/historico', icon: <FileText size={20} />, perfis: ['admin', 'secretaria'] },
  { label: 'Transferência', href: '/secretaria/transferencia', icon: <FileText size={20} />, perfis: ['admin', 'secretaria'] },
  { label: 'Financeiro', href: '/admin/financeiro', icon: <DollarSign size={20} />, perfis: ['admin', 'secretaria'] },
  { label: 'Inadimplência', href: '/admin/inadimplencia', icon: <DollarSign size={20} />, perfis: ['admin'] },
  { label: 'Avisos WhatsApp', href: '/secretaria/avisos-whatsapp', icon: <MessageCircle size={20} />, perfis: ['admin', 'secretaria'] },
  { label: 'Comunicados', href: '/comunicados', icon: <Bell size={20} />, perfis: ['admin', 'coordenador', 'secretaria', 'professor'] },
  { label: 'Calendário', href: '/calendario', icon: <Calendar size={20} />, perfis: ['admin', 'coordenador', 'secretaria', 'professor'] },
  { label: 'Configurações', href: '/admin/configuracoes', icon: <Settings size={20} />, perfis: ['admin'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { config } = useSchool()
  const { perfil, user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [avisosCount, setAvisosCount] = useState(0)
  const [agendaNaoLidas, setAgendaNaoLidas] = useState(0)
  const [aniversariantesHoje, setAniversariantesHoje] = useState(0)

  useEffect(() => {
    getContagemPendentes().then((res) => {
      if (res.data) setAvisosCount(res.data.total)
    })
    getAniversariantesHoje().then((res) => {
      if (res.data) setAniversariantesHoje(res.data.total)
    })
    if (perfil === 'professor') {
      contarNaoLidosProfessor().then((res) => {
        if (res.data) setAgendaNaoLidas(res.data)
      })
    } else if (perfil === 'responsavel') {
      contarNaoLidosResponsavel().then((res) => {
        if (res.data) setAgendaNaoLidas(res.data)
      })
    }
  }, [perfil])

  const filteredItems = NAV_ITEMS.filter((item) => perfil && item.perfis.includes(perfil))

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
          isOpen ? 'translate-x-0' : '-translate-x-full'
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
            {filteredItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-active text-white'
                        : 'text-white/70 hover:bg-sidebar-hover hover:text-white'
                    )}
                  >
                    {item.icon}
                    <span className="flex-1 truncate">{item.label}</span>
                    {(item.href === '/secretaria/avisos-whatsapp' && avisosCount > 0) && (
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {avisosCount > 99 ? '99+' : avisosCount}
                      </span>
                    )}
                    {(item.href === '/professor/agenda' && agendaNaoLidas > 0) && (
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-500 px-1.5 text-[10px] font-bold text-white">
                        {agendaNaoLidas > 99 ? '99+' : agendaNaoLidas}
                      </span>
                    )}
                    {(item.href === '/admin/aniversariantes' && aniversariantesHoje > 0) && (
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pink-500 px-1.5 text-[10px] font-bold text-white">
                        {aniversariantesHoje}
                      </span>
                    )}
                  </Link>
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
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-white/60 capitalize">{perfil}</p>
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
