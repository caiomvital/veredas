'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'
import type { HistoricoEscolar } from '@/types/entities'

export async function listarHistoricos(alunoId: string): Promise<ActionResult<HistoricoEscolar[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('historico_escolar')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('ano_letivo', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as HistoricoEscolar[], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar histórico' }
  }
}

export async function getHistorico(id: string): Promise<ActionResult<HistoricoEscolar>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('historico_escolar').select('*').eq('id', id).single()
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as HistoricoEscolar, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar registro' }
  }
}

export async function criarHistorico(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const dados = {
      aluno_id: formData.get('aluno_id') as string,
      turma_id: formData.get('turma_id') as string,
      ano_letivo: parseInt(formData.get('ano_letivo') as string),
      situacao: formData.get('situacao') as string,
      observacoes: (formData.get('observacoes') as string) || null,
    }
    const { error } = await supabase.from('historico_escolar').insert(dados)
    if (error) return { data: null, error: error.message }
    revalidatePath('/secretaria/historico')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao criar registro' }
  }
}

export async function atualizarHistorico(id: string, formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const dados = {
      turma_id: formData.get('turma_id') as string,
      situacao: formData.get('situacao') as string,
      observacoes: (formData.get('observacoes') as string) || null,
    }
    const { error } = await supabase.from('historico_escolar').update(dados).eq('id', id)
    if (error) return { data: null, error: error.message }
    revalidatePath('/secretaria/historico')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao atualizar registro' }
  }
}

export async function excluirHistorico(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('historico_escolar').delete().eq('id', id)
    if (error) return { data: null, error: error.message }
    revalidatePath('/secretaria/historico')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao excluir registro' }
  }
}

export async function getHistoricoCompleto(alunoId: string): Promise<ActionResult<Array<HistoricoEscolar & { turma_codigo: string; turma_serie: string; turma_turno: string }>>> {
  try {
    const supabase = await createClient()
    const { data: historicos, error } = await supabase
      .from('historico_escolar')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('ano_letivo', { ascending: false })
    if (error) return { data: null, error: error.message }

    if (!historicos || historicos.length === 0) return { data: [], error: null }

    const turmaIds = [...new Set((historicos as unknown as HistoricoEscolar[]).map((h) => h.turma_id))]
    const { data: turmas } = await supabase.from('turmas').select('id, codigo, serie, turno').in('id', turmaIds)
    const turmaMap = new Map((turmas ?? []).map((t: Record<string, unknown>) => [t.id, t]))

    const enriched = (historicos as unknown as HistoricoEscolar[]).map((h) => {
      const turma = turmaMap.get(h.turma_id) as Record<string, unknown> | undefined
      return {
        ...h,
        turma_codigo: (turma?.codigo as string) ?? '',
        turma_serie: (turma?.serie as string) ?? '',
        turma_turno: (turma?.turno as string) ?? '',
      }
    })

    return { data: enriched, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar histórico' }
  }
}
