'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

// ───── Coordenador ─────

export interface CoordenadorData {
  totalAlunos: number
  totalTurmas: number
  totalProfessores: number
  comunicadosMes: number
  eventosProximos: { id: string; nome: string; data_inicio: string; tipo: string }[]
  diariosPendentes: number
}

export async function getCoordenadorDashboard(): Promise<ActionResult<CoordenadorData>> {
  try {
    const supabase = await createClient()
    const hoje = new Date().toISOString().split('T')[0]
    const inicioMes = new Date()
    inicioMes.setDate(1)
    const inicioMesStr = inicioMes.toISOString().split('T')[0]

    const [{ count: totalAlunos }, { count: totalTurmas }, { count: totalProfessores }] = await Promise.all([
      supabase.from('alunos').select('*', { count: 'exact', head: true }),
      supabase.from('turmas').select('*', { count: 'exact', head: true }),
      supabase.from('funcionarios').select('*', { count: 'exact', head: true }).eq('cargo', 'professor'),
    ])

    // Comunicados publicados este mês
    const { count: comunicadosMes } = await supabase
      .from('comunicados').select('*', { count: 'exact', head: true })
      .gte('data_publicacao', inicioMesStr)

    // Eventos nos próximos 7 dias
    const fim = new Date()
    fim.setDate(fim.getDate() + 7)
    const fimStr = fim.toISOString().split('T')[0]
    const { data: eventosProximos } = await supabase
      .from('eventos_calendario')
      .select('id, nome, data_inicio, tipo')
      .gte('data_inicio', hoje)
      .lte('data_inicio', fimStr)
      .order('data_inicio', { ascending: true })
      .limit(5)

    // Diários pendentes: total de professores vinculados a turmas que ainda não geraram diário no período atual
    // Buscar o período ativo mais recente
    const { data: periodoAtivo } = await supabase
      .from('periodos_letivos')
      .select('id')
      .lte('data_inicio', hoje)
      .gte('data_fim', hoje)
      .order('data_inicio', { ascending: false })
      .limit(1)
      .maybeSingle()

    let diariosPendentes = 0
    if (periodoAtivo) {
      const { count: totalTDP } = await supabase
        .from('turma_disciplina_professor').select('*', { count: 'exact', head: true })
      const { count: diariosGerados } = await supabase
        .from('diarios_classe').select('*', { count: 'exact', head: true })
        .eq('periodo_id', periodoAtivo.id)
      diariosPendentes = (totalTDP ?? 0) - (diariosGerados ?? 0)
    }

    return {
      data: {
        totalAlunos: totalAlunos ?? 0,
        totalTurmas: totalTurmas ?? 0,
        totalProfessores: totalProfessores ?? 0,
        comunicadosMes: comunicadosMes ?? 0,
        eventosProximos: (eventosProximos ?? []).map((e) => ({
          id: e.id, nome: e.nome, data_inicio: e.data_inicio, tipo: e.tipo,
        })),
        diariosPendentes: Math.max(0, diariosPendentes),
      },
      error: null,
    }
  } catch (e) {
    return { data: null, error: 'Erro ao carregar dashboard do coordenador' }
  }
}

// ───── Secretaria ─────

export interface SecretariaData {
  totalAlunos: number
  matriculasAtivas: number
  mensalidadesVencidas: number
  mensalidadesVencendo3d: number
  avisosPendentes: number
}

export async function getSecretariaDashboard(): Promise<ActionResult<SecretariaData>> {
  try {
    const supabase = await createClient()
    const hoje = new Date().toISOString().split('T')[0]
    const mais3d = new Date()
    mais3d.setDate(mais3d.getDate() + 3)
    const mais3dStr = mais3d.toISOString().split('T')[0]

    const [{ count: totalAlunos }, { count: matriculasAtivas }] = await Promise.all([
      supabase.from('alunos').select('*', { count: 'exact', head: true }),
      supabase.from('matriculas').select('*', { count: 'exact', head: true }).eq('status', 'ativa'),
    ])

    const { count: mensalidadesVencidas } = await supabase
      .from('lancamentos_financeiros')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')
      .lt('data_vencimento', hoje)

    const { count: mensalidadesVencendo3d } = await supabase
      .from('lancamentos_financeiros')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')
      .gte('data_vencimento', hoje)
      .lte('data_vencimento', mais3dStr)

    const { count: avisosPendentes } = await supabase
      .from('avisos_whatsapp')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')

    return {
      data: {
        totalAlunos: totalAlunos ?? 0,
        matriculasAtivas: matriculasAtivas ?? 0,
        mensalidadesVencidas: mensalidadesVencidas ?? 0,
        mensalidadesVencendo3d: mensalidadesVencendo3d ?? 0,
        avisosPendentes: avisosPendentes ?? 0,
      },
      error: null,
    }
  } catch (e) {
    return { data: null, error: 'Erro ao carregar dashboard da secretaria' }
  }
}

// ───── Professor ─────

export interface MinhaTurma {
  id: string
  turma_codigo: string
  turma_serie: string
  turma_turno: string
  disciplina_nome: string
  qtdAlunos: number
}

export interface ProfessorData {
  minhasTurmas: MinhaTurma[]
  aulasRegistradasMes: number
  atividadesPendentesCorrecao: number
  eventosProximos: { id: string; nome: string; data_inicio: string; tipo: string }[]
}

export async function getProfessorDashboard(): Promise<ActionResult<ProfessorData>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const hoje = new Date().toISOString().split('T')[0]
    const inicioMes = new Date()
    inicioMes.setDate(1)
    const inicioMesStr = inicioMes.toISOString().split('T')[0]
    const fim = new Date()
    fim.setDate(fim.getDate() + 7)
    const fimStr = fim.toISOString().split('T')[0]

    // Buscar funcionario do professor logado
    const { data: func } = await supabase
      .from('funcionarios')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    if (!func) return { data: null, error: 'Funcionário não encontrado' }

    // Minhas turmas via TDP
    const { data: tdps } = await supabase
      .from('turma_disciplina_professor')
      .select(`
        id,
        turma_id,
        disciplina_id,
        turmas!inner(codigo, serie, turno, id),
        disciplinas!inner(nome)
      `)
      .eq('funcionario_id', func.id)

    // Buscar matriculas ativas por turma
    let minhasTurmas: MinhaTurma[] = []
    if (tdps && tdps.length > 0) {
      const turmaIds = [...new Set(tdps.map((t: any) => t.turma_id))]
      const { data: matriculasPorTurma } = await supabase
        .from('matriculas')
        .select('turma_id')
        .in('turma_id', turmaIds)
        .eq('status', 'ativa')

      const countPorTurma: Record<string, number> = {}
      for (const m of matriculasPorTurma ?? []) {
        countPorTurma[m.turma_id] = (countPorTurma[m.turma_id] ?? 0) + 1
      }

      const vistas = new Set<string>()
      for (const t of tdps as any[]) {
        const key = t.turma_id
        if (vistas.has(key)) continue
        vistas.add(key)
        minhasTurmas.push({
          id: t.turma_id,
          turma_codigo: t.turmas.codigo,
          turma_serie: t.turmas.serie,
          turma_turno: t.turmas.turno,
          disciplina_nome: t.disciplinas.nome,
          qtdAlunos: countPorTurma[t.turma_id] ?? 0,
        })
      }
    }

    // Aulas registradas este mês
    const tdpIds = (tdps ?? []).map((t: any) => t.id)
    let aulasRegistradasMes = 0
    if (tdpIds.length > 0) {
      const { count } = await supabase
        .from('registro_aulas')
        .select('*', { count: 'exact', head: true })
        .in('turma_disciplina_id', tdpIds)
        .gte('data_aula', inicioMesStr)
      aulasRegistradasMes = count ?? 0
    }

    // Atividades com entrega pendente de correção
    let atividadesPendentesCorrecao = 0
    if (tdpIds.length > 0) {
      // Atividades cuja data_entrega já passou e têm entregas não corrigidas
      const { data: atividades } = await supabase
        .from('atividades_casa')
        .select('id')
        .in('turma_disciplina_id', tdpIds)
        .lt('data_entrega', hoje)

      if (atividades && atividades.length > 0) {
        const atvIds = atividades.map((a) => a.id)
        // Contar entregas que não têm observacao_professor (não corrigidas)
        // Como atividade_casa_entrega pode não ter registros, contar como pendente se existir atividade vencida
        const { count: entregues } = await supabase
          .from('atividade_casa_entrega')
          .select('*', { count: 'exact', head: true })
          .in('atividade_id', atvIds)
          .eq('entregue', true)
          .is('observacao_professor', null)
        atividadesPendentesCorrecao = entregues ?? 0
      }
    }

    // Eventos próximos
    const { data: eventos } = await supabase
      .from('eventos_calendario')
      .select('id, nome, data_inicio, tipo')
      .gte('data_inicio', hoje)
      .lte('data_inicio', fimStr)
      .order('data_inicio', { ascending: true })
      .limit(5)

    return {
      data: {
        minhasTurmas,
        aulasRegistradasMes,
        atividadesPendentesCorrecao,
        eventosProximos: (eventos ?? []).map((e) => ({
          id: e.id, nome: e.nome, data_inicio: e.data_inicio, tipo: e.tipo,
        })),
      },
      error: null,
    }
  } catch (e) {
    return { data: null, error: 'Erro ao carregar dashboard do professor' }
  }
}

// ───── Admin (mantido) ─────

export async function getDashboardCounts(): Promise<ActionResult<{
  alunos: number; turmas: number; funcionarios: number; matriculas: number; comunicadosNaoLidos: number
}>> {
  try {
    const supabase = await createClient()
    const [{ count: alunos }, { count: turmas }, { count: funcionarios }, { count: matriculas }] = await Promise.all([
      supabase.from('alunos').select('*', { count: 'exact', head: true }),
      supabase.from('turmas').select('*', { count: 'exact', head: true }),
      supabase.from('funcionarios').select('*', { count: 'exact', head: true }),
      supabase.from('matriculas').select('*', { count: 'exact', head: true }),
    ])

    const { data: { user } } = await supabase.auth.getUser()
    let comunicadosNaoLidos = 0
    if (user) {
      const { count: total } = await supabase
        .from('comunicados').select('*', { count: 'exact', head: true })
      const { count: lidos } = await supabase
        .from('comunicado_leitura').select('*', { count: 'exact', head: true })
        .eq('usuario_id', user.id)
      comunicadosNaoLidos = (total ?? 0) - (lidos ?? 0)
    }

    return {
      data: {
        alunos: alunos ?? 0, turmas: turmas ?? 0,
        funcionarios: funcionarios ?? 0, matriculas: matriculas ?? 0,
        comunicadosNaoLidos: Math.max(0, comunicadosNaoLidos),
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'Erro ao carregar dados do dashboard' }
  }
}
