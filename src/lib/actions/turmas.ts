'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'
import type { Turma, Disciplina, TurmaDisciplinaProfessor } from '@/types/entities'

// ---- Turmas ----

export async function listarTurmas(params?: { ano_letivo?: number }): Promise<ActionResult<Turma[]>> {
  try {
    const supabase = await createClient()
    let query = supabase.from('turmas').select('*').eq('ativa', true).order('codigo')

    if (params?.ano_letivo) {
      query = query.eq('ano_letivo', params.ano_letivo)
    }

    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as Turma[], error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao carregar turmas' }
  }
}

export async function getTurma(id: string): Promise<ActionResult<Turma>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('turmas').select('*').eq('id', id).single()
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as Turma, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao carregar turma' }
  }
}

export async function criarTurma(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const dados = {
      codigo: formData.get('codigo') as string,
      serie: formData.get('serie') as string,
      turno: formData.get('turno') as string,
      ano_letivo: parseInt(formData.get('ano_letivo') as string),
      capacidade: parseInt(formData.get('capacidade') as string) || 40,
    }

    const { error } = await supabase.from('turmas').insert(dados)
    if (error) return { data: null, error: error.message }

    revalidatePath('/admin/turmas')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao criar turma' }
  }
}

export async function atualizarTurma(id: string, formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const dados = {
      codigo: formData.get('codigo') as string,
      serie: formData.get('serie') as string,
      turno: formData.get('turno') as string,
      ano_letivo: parseInt(formData.get('ano_letivo') as string),
      capacidade: parseInt(formData.get('capacidade') as string) || 40,
    }

    const { error } = await supabase.from('turmas').update(dados).eq('id', id)
    if (error) return { data: null, error: error.message }

    revalidatePath('/admin/turmas')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao atualizar turma' }
  }
}

export async function excluirTurma(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('turmas').update({ ativa: false }).eq('id', id)
    if (error) return { data: null, error: error.message }

    revalidatePath('/admin/turmas')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao excluir turma' }
  }
}

// ---- Disciplinas ----

export async function listarDisciplinas(): Promise<ActionResult<Disciplina[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('disciplinas').select('*').order('nome')
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as Disciplina[], error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao carregar disciplinas' }
  }
}

export async function criarDisciplina(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const dados = {
      nome: formData.get('nome') as string,
      codigo: formData.get('codigo') as string,
      area_conhecimento: formData.get('area_conhecimento') as string,
    }

    const { error } = await supabase.from('disciplinas').insert(dados)
    if (error) return { data: null, error: error.message }

    revalidatePath('/admin/disciplinas')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao criar disciplina' }
  }
}

export async function excluirDisciplina(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('disciplinas').delete().eq('id', id)
    if (error) return { data: null, error: error.message }

    revalidatePath('/admin/disciplinas')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao excluir disciplina' }
  }
}

// ---- Alocação ----

export async function listarAlocacoes(turmaId?: string): Promise<ActionResult<TurmaDisciplinaProfessor[]>> {
  try {
    const supabase = await createClient()
    let query = supabase.from('turma_disciplina_professor').select('*')
    if (turmaId) query = query.eq('turma_id', turmaId)

    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as TurmaDisciplinaProfessor[], error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao carregar alocações' }
  }
}
