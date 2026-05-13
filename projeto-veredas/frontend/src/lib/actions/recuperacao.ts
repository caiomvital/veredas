'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'

export interface AlunoRecuperacao {
  matriculaId: string
  alunoId: string
  alunoNome: string
  mediaAtual: number
  notaRecuperacao?: number
}

export async function getEscolaMediaMinima(): Promise<number> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return 7

    const { data } = await supabase.from('escolas').select('config_academica').eq('id', escolaId).single()
    const config = data?.config_academica as Record<string, unknown> | undefined
    return (config?.media_minima as number) ?? 7
  } catch {
    return 7
  }
}

export async function listarAlunosRecuperacao(
  turmaDisciplinaId: string,
  periodoId: string,
): Promise<ActionResult<{ alunos: AlunoRecuperacao[]; mediaMinima: number }>> {
  try {
    const supabase = await createClient()
    const mediaMinima = await getEscolaMediaMinima()

    // Get TDP info
    const { data: tdp } = await supabase
      .from('turma_disciplina_professor')
      .select('turma_id')
      .eq('id', turmaDisciplinaId)
      .single()
    if (!tdp) return { data: null, error: 'Turma não encontrada' }

    // Get alunos
    const { data: matriculas } = await supabase
      .from('matriculas')
      .select('id, aluno_id, alunos!inner(nome_completo)')
      .eq('turma_id', tdp.turma_id)
      .eq('status', 'ativa')

    if (!matriculas || matriculas.length === 0) return { data: { alunos: [], mediaMinima }, error: null }

    const matriculaIds = matriculas.map((m) => m.id)

    // Get notas for this period
    const { data: notas } = await supabase
      .from('notas')
      .select('*')
      .in('matricula_id', matriculaIds)
      .eq('turma_disciplina_id', turmaDisciplinaId)
      .eq('periodo_id', periodoId)

    // Get existing recovery notas (paralela and final)
    const { data: recoveryNotas } = await supabase
      .from('notas')
      .select('*')
      .in('matricula_id', matriculaIds)
      .eq('turma_disciplina_id', turmaDisciplinaId)
      .in('tipo', ['recuperacao_paralela', 'recuperacao_final'])

    const recoveryMap = new Map<string, { paralela?: number; final?: number }>()
    for (const r of recoveryNotas ?? []) {
      if (!recoveryMap.has(r.matricula_id)) recoveryMap.set(r.matricula_id, {})
      const e = recoveryMap.get(r.matricula_id)!
      if (r.tipo === 'recuperacao_paralela') e.paralela = r.valor
      if (r.tipo === 'recuperacao_final') e.final = r.valor
    }

    const alunos: AlunoRecuperacao[] = matriculas.map((m) => {
      const notasAluno = (notas ?? []).filter((n) => n.matricula_id === m.id)
      const prova = notasAluno.find((n) => n.tipo === 'prova')?.valor ?? 0
      const trabalho = notasAluno.find((n) => n.tipo === 'trabalho')?.valor ?? 0
      const mediaAtual = Math.round(((prova + trabalho) / 2) * 10) / 10
      const recovery = recoveryMap.get(m.id)

      return {
        matriculaId: m.id,
        alunoId: m.aluno_id,
        alunoNome: (m.alunos as unknown as { nome_completo: string }).nome_completo,
        mediaAtual,
        notaRecuperacao: recovery?.paralela ?? recovery?.final,
      }
    })

    return { data: { alunos, mediaMinima }, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar alunos' }
  }
}

export async function salvarNotasRecuperacao(
  turmaDisciplinaId: string,
  periodoId: string,
  rows: { matriculaId: string; valor: number }[],
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const { data: func } = await supabase
      .from('funcionarios')
      .select('id')
      .eq('usuario_id', user.id)
      .single()
    if (!func) return { data: null, error: 'Funcionário não encontrado' }

    const upsertRows = rows.map((r) => ({
      matricula_id: r.matriculaId,
      turma_disciplina_id: turmaDisciplinaId,
      periodo_id: periodoId,
      valor: r.valor,
      tipo: 'recuperacao_paralela',
      lancado_por: func.id,
    }))

    const { error } = await supabase.from('notas').upsert(upsertRows, {
      onConflict: 'matricula_id, turma_disciplina_id, periodo_id, tipo',
      ignoreDuplicates: false,
    })

    if (error) return { data: null, error: error.message }
    revalidatePath('/app/professor/recuperacao')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao salvar notas de recuperação' }
  }
}

export async function listarDisciplinasRecuperacao(): Promise<ActionResult<{
  id: string; turma_codigo: string; turma_serie: string; disciplina_nome: string
}[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return { data: null, error: 'Não autenticado' }

    const { data: func } = await supabase
      .from('funcionarios')
      .select('id')
      .eq('usuario_id', user.id)
      .single()
    if (!func) return { data: null, error: 'Funcionário não encontrado' }

    const { getTurmasDoProfessor } = await import('./academico')
    return await getTurmasDoProfessor(func.id) as unknown as ActionResult<{
      id: string; turma_codigo: string; turma_serie: string; disciplina_nome: string
    }[]>
  } catch {
    return { data: null, error: 'Erro ao carregar disciplinas' }
  }
}
