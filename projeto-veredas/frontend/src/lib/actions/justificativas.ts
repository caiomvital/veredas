'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'

export interface JustificativaFalta {
  id: string
  frequenciaId: string
  responsavelId: string
  responsavelNome: string
  alunoNome: string
  disciplinaNome: string
  dataAula: string
  motivo: string
  descricao: string | null
  status: 'pendente' | 'aceita' | 'recusada'
  created_at: string
}

export async function justificarFalta(
  frequenciaId: string,
  motivo: string,
  descricao?: string,
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const { data: resp } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('usuario_id', user.id)
      .single()
    if (!resp) return { data: null, error: 'Responsável não encontrado' }

    // Check if already justified
    const { data: existing } = await supabase
      .from('justificativas_falta')
      .select('id')
      .eq('frequencia_id', frequenciaId)
      .maybeSingle()
    if (existing) return { data: null, error: 'Esta falta já foi justificada' }

    const { error } = await supabase.from('justificativas_falta').insert({
      escola_id: escolaId,
      frequencia_id: frequenciaId,
      responsavel_id: resp.id,
      motivo,
      descricao: descricao || null,
      status: 'pendente',
    })

    if (error) return { data: null, error: error.message }
    revalidatePath('/app/responsavel/frequencia')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao justificar falta' }
  }
}

export async function listarJustificativasPendentes(): Promise<ActionResult<JustificativaFalta[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const { data } = await supabase
      .from('justificativas_falta')
      .select(`
        *,
        frequencias!inner(
          data_aula,
          matricula_id,
          matriculas!inner(aluno_id, alunos!inner(nome_completo)),
          turma_disciplina_professor!inner(disciplina_id, disciplinas!inner(nome))
        ),
        responsaveis!inner(nome_completo)
      `)
      .eq('escola_id', escolaId)
      .order('created_at', { ascending: false })

    if (!data) return { data: [], error: null }

    const result: JustificativaFalta[] = data.map((j: any) => {
      const freq = j.frequencias as unknown as {
        data_aula: string
        matriculas: { alunos: { nome_completo: string } }
      }
      const tdp = j.frequencias?.turma_disciplina_professor as unknown | undefined as {
        disciplinas: { nome: string }
      } | undefined
      return {
        id: j.id,
        frequenciaId: j.frequencia_id,
        responsavelId: j.responsavel_id,
        responsavelNome: j.responsaveis?.nome_completo ?? '—',
        alunoNome: freq?.matriculas?.alunos?.nome_completo ?? '—',
        disciplinaNome: tdp?.disciplinas?.nome ?? '—',
        dataAula: freq?.data_aula ?? '',
        motivo: j.motivo,
        descricao: j.descricao,
        status: j.status,
        created_at: j.created_at,
      }
    })

    return { data: result, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar justificativas' }
  }
}

export async function analisarJustificativa(
  id: string,
  status: 'aceita' | 'recusada',
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

    const { error } = await supabase
      .from('justificativas_falta')
      .update({
        status,
        analisada_por: func?.id ?? null,
        justificada_em: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    revalidatePath('/app/secretaria/justificativas')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao analisar justificativa' }
  }
}

export async function verificarFaltaJustificada(frequenciaId: string): Promise<ActionResult<boolean>> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('justificativas_falta')
      .select('id')
      .eq('frequencia_id', frequenciaId)
      .eq('status', 'aceita')
      .maybeSingle()
    return { data: data !== null, error: null }
  } catch {
    return { data: false, error: null }
  }
}
