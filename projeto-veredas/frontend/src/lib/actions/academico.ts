'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'

export async function getTurmasDoProfessor(funcionarioId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('turma_disciplina_professor')
      .select(`
        id,
        carga_horaria_semanal,
        turma_id,
        disciplina_id,
        funcionario_id
      `)
      .eq('funcionario_id', funcionarioId)

    if (error) return { data: null, error: error.message }

    // Fetch related turma, disciplina, and matricula counts
    const turmaIds = [...new Set((data ?? []).map((r: Record<string, unknown>) => r.turma_id as string))]
    const disciplinaIds = [...new Set((data ?? []).map((r: Record<string, unknown>) => r.disciplina_id as string))]

    const [turmasRes, discRes, matCountRes] = await Promise.all([
      supabase.from('turmas').select('*').in('id', turmaIds),
      supabase.from('disciplinas').select('*').in('id', disciplinaIds),
      supabase.from('matriculas').select('turma_id, id', { count: 'exact', head: false }).in('turma_id', turmaIds).eq('status', 'ativa'),
    ])

    // Count students per turma
    const matCounts: Record<string, number> = {}
    for (const row of (matCountRes.data ?? []) as Record<string, unknown>[]) {
      const tid = row.turma_id as string
      matCounts[tid] = (matCounts[tid] ?? 0) + 1
    }

    const turmasMap = new Map((turmasRes.data ?? []).map((t: Record<string, unknown>) => [t.id, t]))
    const discMap = new Map((discRes.data ?? []).map((d: Record<string, unknown>) => [d.id, d]))

    const result = (data ?? []).map((row: Record<string, unknown>) => {
      const turma = turmasMap.get(row.turma_id as string) as Record<string, unknown> | undefined
      const disciplina = discMap.get(row.disciplina_id as string) as Record<string, unknown> | undefined
      return {
        id: row.id,
        turma_id: row.turma_id,
        disciplina_id: row.disciplina_id,
        funcionario_id: row.funcionario_id,
        carga_horaria_semanal: row.carga_horaria_semanal,
        turma_codigo: (turma?.codigo as string) ?? '',
        turma_serie: (turma?.serie as string) ?? '',
        turma_turno: (turma?.turno as string) ?? '',
        disciplina_nome: (disciplina?.nome as string) ?? '',
        disciplina_codigo: (disciplina?.codigo as string) ?? '',
        qtd_alunos: matCounts[row.turma_id as string] ?? 0,
      }
    })

    return { data: result, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar turmas do professor' }
  }
}

export async function getAlunosDaTurma(turmaId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('matriculas')
      .select('id, aluno_id, alunos!inner(*)')
      .eq('turma_id', turmaId)
      .eq('status', 'ativa')

    if (error) return { data: null, error: error.message }
    return {
      data: (data ?? []).map((r: Record<string, unknown>) => ({
        matricula_id: r.id,
        ...((r.alunos as Record<string, unknown>) ?? {}),
      })),
      error: null,
    }
  } catch {
    return { data: null, error: 'Erro ao carregar alunos da turma' }
  }
}

type GradeRow = {
  matricula_id: string
  periodo_id: string
  valor: number | string
  tipo: string
}

export async function salvarNotas(turmaDisciplinaId: string, notas: GradeRow[]): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()

    // Get current user's funcionario id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Usuário não autenticado' }

    const { data: func } = await supabase
      .from('funcionarios')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    if (!func) return { data: null, error: 'Funcionário não encontrado' }

    const rows = notas.map((n) => ({
      matricula_id: n.matricula_id,
      turma_disciplina_id: turmaDisciplinaId,
      periodo_id: n.periodo_id,
      valor: typeof n.valor === 'string' ? parseFloat(n.valor) : n.valor,
      tipo: n.tipo,
      lancado_por: func.id,
    }))

    const { error } = await supabase.from('notas').upsert(rows, {
      onConflict: 'matricula_id, turma_disciplina_id, periodo_id, tipo',
      ignoreDuplicates: false,
    })

    if (error) return { data: null, error: error.message }
    revalidatePath('/app/professor/notas')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao salvar notas' }
  }
}

export async function getNotas(turmaDisciplinaId: string, periodoId?: string) {
  try {
    const supabase = await createClient()
    let query = supabase.from('notas').select('*').eq('turma_disciplina_id', turmaDisciplinaId)
    if (periodoId) query = query.eq('periodo_id', periodoId)
    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data: data ?? [], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar notas' }
  }
}

type FreqRow = {
  matricula_id: string
  data_aula: string
  presenca: boolean
}

export async function salvarFrequencias(turmaDisciplinaId: string, dataAula: string, frequencias: FreqRow[]): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Usuário não autenticado' }

    const { data: func } = await supabase
      .from('funcionarios')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    if (!func) return { data: null, error: 'Funcionário não encontrado' }

    // Delete existing entries for this date
    await supabase
      .from('frequencias')
      .delete()
      .eq('turma_disciplina_id', turmaDisciplinaId)
      .eq('data_aula', dataAula)

    // Insert new ones
    const rows = frequencias.map((f) => ({
      matricula_id: f.matricula_id,
      turma_disciplina_id: turmaDisciplinaId,
      data_aula: dataAula,
      presenca: f.presenca,
      lancado_por: func.id,
    }))

    const { error } = await supabase.from('frequencias').insert(rows)
    if (error) return { data: null, error: error.message }
    revalidatePath('/app/professor/chamada')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao salvar frequências' }
  }
}

export async function getFrequenciasPorTurmaDisciplina(turmaDisciplinaId: string, periodoId?: string) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('frequencias')
      .select('*')
      .eq('turma_disciplina_id', turmaDisciplinaId)

    if (periodoId) {
      const { data: periodo } = await supabase
        .from('periodos_letivos')
        .select('data_inicio, data_fim')
        .eq('id', periodoId)
        .single()
      if (periodo) {
        query = query
          .gte('data_aula', periodo.data_inicio)
          .lte('data_aula', periodo.data_fim)
      }
    }

    const { data, error } = await query.order('data_aula', { ascending: true })
    if (error) return { data: null, error: error.message }
    return { data: data ?? [], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar frequências' }
  }
}

export async function getFrequencias(turmaDisciplinaId: string, dataAula: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('frequencias')
      .select('*')
      .eq('turma_disciplina_id', turmaDisciplinaId)
      .eq('data_aula', dataAula)
    if (error) return { data: null, error: error.message }
    return { data: data ?? [], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar frequências' }
  }
}

export async function getFuncionarioByUser() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('usuario_id', user.id)
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar funcionário' }
  }
}
