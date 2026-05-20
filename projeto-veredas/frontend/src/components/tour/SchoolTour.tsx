'use client'

import { useEffect, useRef, useCallback } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useRouter } from 'next/navigation'

type Perfil = 'admin' | 'coordenador' | 'secretaria' | 'professor' | 'responsavel'

interface SchoolTourProps {
  perfil: Perfil | undefined
  autoStart?: boolean
}

const STORAGE_PREFIX = 'tour:'
const STORAGE_SUFFIX = ':concluido'

export function resetTourStorage(perfil: string) {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`${STORAGE_PREFIX}${perfil}${STORAGE_SUFFIX}`)
  }
}

function isTourConcluido(perfil: string): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(`${STORAGE_PREFIX}${perfil}${STORAGE_SUFFIX}`) === 'true'
}

function marcarConcluido(perfil: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${STORAGE_PREFIX}${perfil}${STORAGE_SUFFIX}`, 'true')
  }
}

export function SchoolTour({ perfil, autoStart = true }: SchoolTourProps) {
  const router = useRouter()
  const driverRef = useRef<ReturnType<typeof driver> | null>(null)
  const deveNavegar = useRef(false)
  const destinoNavegacao = useRef<string | null>(null)
  const startedRef = useRef(false)

  const abrirGrupo = useCallback((sel: string) => {
    const btn = document.querySelector<HTMLElement>(`[data-tour="${sel}"]`)
    if (btn && btn.getAttribute('data-group-open') === 'false') btn.click()
  }, [])

  const startTour = useCallback(() => {
    if (!perfil || typeof window === 'undefined') return
    deveNavegar.current = false
    destinoNavegacao.current = null

    const isMobile = window.innerWidth < 1024

    interface StepDef {
      element?: string
      popover: {
        title: string
        description: string
        side?: 'top' | 'right' | 'bottom' | 'left' | 'center' | 'over'
        doneBtnText?: string
      }
      onHighlightStarted?: () => void
    }

    let steps: StepDef[] = []

    if (perfil === 'admin' || perfil === 'coordenador') {
      steps = [
        { popover: { title: 'Bem-vindo ao Veredas!', description: 'Vamos te mostrar o sistema em 1 minuto.', side: 'center' } },
        { element: '[data-tour="sidebar"]', popover: { title: 'Menu Lateral', description: 'Aqui estão todos os módulos, organizados por categoria.', side: 'right' } },
        { element: '[data-tour="dashboard-content"]', popover: { title: 'Dashboard', description: 'Seu painel mostra os números mais importantes da escola.', side: 'bottom' } },
        { element: '[data-tour="group-pessoas"]', popover: { title: 'Pessoas', description: 'Cadastre alunos, responsáveis e funcionários aqui.', side: 'right' }, onHighlightStarted: () => abrirGrupo('group-pessoas') },
        { element: '[data-tour="group-secretaria"]', popover: { title: 'Secretaria', description: 'Matrículas, declarações e documentos ficam aqui.', side: 'right' }, onHighlightStarted: () => abrirGrupo('group-secretaria') },
        { element: '[data-tour="group-financeiro"]', popover: { title: 'Financeiro', description: 'Controle mensalidades e inadimplência nesta seção.', side: 'right' }, onHighlightStarted: () => abrirGrupo('group-financeiro') },
        { element: '[data-tour="group-comunicacao"]', popover: { title: 'Comunicação', description: 'Envie comunicados e gerencie o calendário escolar.', side: 'right' }, onHighlightStarted: () => abrirGrupo('group-comunicacao') },
        {
          element: '[data-tour="nav-configuracoes"]',
          popover: { title: 'Configurações', description: 'Configure os dados da sua escola aqui. Comece por aqui!', side: 'right', doneBtnText: 'Ir para Configurações' },
          onHighlightStarted: () => {
            abrirGrupo('group-sistema')
            deveNavegar.current = true
            destinoNavegacao.current = '/app/admin/configuracoes'
          },
        },
      ]
    } else if (perfil === 'secretaria') {
      steps = [
        { popover: { title: 'Bem-vinda(o) ao Veredas!', description: 'Vamos te mostrar o sistema em 1 minuto.', side: 'center' } },
        { element: '[data-tour="sidebar"]', popover: { title: 'Menu Lateral', description: 'Aqui estão todos os módulos da secretaria.', side: 'right' } },
        { element: '[data-tour="dashboard-content"]', popover: { title: 'Dashboard', description: 'Aqui você vê os cards com os números financeiros mais importantes.', side: 'bottom' } },
        { element: '[data-tour="group-secretaria"]', popover: { title: 'Secretaria', description: 'Foco em Matrículas — cadastre e gerencie matrículas aqui.', side: 'right' }, onHighlightStarted: () => abrirGrupo('group-secretaria') },
        { element: '[data-tour="group-financeiro"]', popover: { title: 'Financeiro', description: 'Controle financeiro e avisos de WhatsApp para cobranças.', side: 'right' }, onHighlightStarted: () => abrirGrupo('group-financeiro') },
        { popover: { title: 'Pronto!', description: 'Qualquer dúvida, fale com a coordenação.', side: 'center' } },
      ]
    } else if (perfil === 'professor') {
      steps = [
        { popover: { title: 'Bem-vindo(a) ao Veredas!', description: 'Vamos te mostrar o sistema em 1 minuto.', side: 'center' } },
        { element: '[data-tour="group-prof-turmas"]', popover: { title: 'Turmas', description: 'Suas turmas e alunos ficam aqui.', side: 'right' }, onHighlightStarted: () => abrirGrupo('group-prof-turmas') },
        { element: '[data-tour="nav-chamada"]', popover: { title: 'Chamada', description: 'Lance a frequência diária aqui.', side: 'right' }, onHighlightStarted: () => abrirGrupo('group-prof-turmas') },
        { element: '[data-tour="nav-notas"]', popover: { title: 'Notas', description: 'Registre as notas por bimestre aqui.', side: 'right' }, onHighlightStarted: () => abrirGrupo('group-prof-turmas') },
        { element: '[data-tour="group-prof-aulas"]', popover: { title: 'Aulas', description: 'Registre suas aulas e atividades aqui.', side: 'right' }, onHighlightStarted: () => abrirGrupo('group-prof-aulas') },
        { element: '[data-tour="nav-agenda-prof"]', popover: { title: 'Agenda', description: 'Troque recados com os responsáveis aqui.', side: 'right' }, onHighlightStarted: () => abrirGrupo('group-prof-alunos') },
      ]
    } else if (perfil === 'responsavel') {
      steps = [
        { popover: { title: 'Bem-vindo ao portal da escola!', description: 'Aqui você acompanha seu filho.', side: 'center' } },
        { element: '[data-tour="aluno-card"]', popover: { title: 'Seu Filho', description: 'Aqui você vê as informações do seu filho.', side: 'bottom' } },
        { element: '[data-tour="notas-freq"]', popover: { title: 'Notas e Frequência', description: 'Acompanhe as notas e a frequência escolar.', side: 'bottom' } },
        { element: '[data-tour="portal-agenda"]', popover: { title: 'Agenda', description: 'Troque recados com os professores aqui.', side: 'bottom' } },
        { element: '[data-tour="portal-financeiro"]', popover: { title: 'Financeiro', description: 'Acompanhe as mensalidades aqui.', side: 'bottom' } },
        { popover: { title: 'Pronto!', description: 'Você já pode explorar o portal.', side: 'center' } },
      ]
    }

    if (steps.length === 0) return

    // On mobile, clear element selectors so popovers render centered
    if (isMobile) {
      steps = steps.map((s) => {
        const { element, ...rest } = s
        return rest
      })
    }

    if (driverRef.current) driverRef.current.destroy()

    const d = driver({
      steps: steps as any,
      animate: false,
      allowClose: true,
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      doneBtnText: 'Concluir',
      progressText: '{{current}} de {{total}}',
      popoverClass: 'veredas-tour',
      onDestroyed: () => {
        marcarConcluido(perfil)
        if (deveNavegar.current && destinoNavegacao.current) {
          router.push(destinoNavegacao.current)
        }
        deveNavegar.current = false
        destinoNavegacao.current = null
      },
    })

    driverRef.current = d
    d.drive()
  }, [perfil, router, abrirGrupo])

  // Auto-start on mount
  useEffect(() => {
    if (!perfil || !autoStart) return
    if (startedRef.current) return
    if (isTourConcluido(perfil)) return

    startedRef.current = true
    const timer = setTimeout(startTour, 600)
    return () => clearTimeout(timer)
  }, [perfil, autoStart, startTour])

  // Listen for manual restart
  useEffect(() => {
    const handler = () => {
      startedRef.current = true
      const timer = setTimeout(startTour, 300)
      return () => clearTimeout(timer)
    }
    window.addEventListener('school:tour:restart', handler)
    return () => window.removeEventListener('school:tour:restart', handler)
  }, [startTour])

  // Cleanup driver on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) driverRef.current.destroy()
    }
  }, [])

  return null
}
