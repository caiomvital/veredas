'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'
import type { PeriodoLetivo } from '@/types/entities'

export async function listarPeriodos(params?: { ano_letivo?: number }): Promise<ActionResult<PeriodoLetivo[]>> {
  try {
    const supabase = await createClient()
    let query = supabase.from('periodos_letivos').select('*').order('ordem')
    if (params?.ano_letivo) query = query.eq('ano_letivo', params.ano_letivo)
    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as PeriodoLetivo[], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar períodos' }
  }
}

export async function getPeriodo(id: string): Promise<ActionResult<PeriodoLetivo>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('periodos_letivos').select('*').eq('id', id).single()
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as PeriodoLetivo, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar período' }
  }
}

export async function criarPeriodo(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const dados = {
      escola_id: escolaId,
      nome: formData.get('nome') as string,
      ordem: parseInt(formData.get('ordem') as string),
      data_inicio: formData.get('data_inicio') as string,
      data_fim: formData.get('data_fim') as string,
      ano_letivo: parseInt(formData.get('ano_letivo') as string),
    }
    const { error } = await supabase.from('periodos_letivos').insert(dados)
    if (error) return { data: null, error: error.message }
    revalidatePath('/admin/periodos')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao criar período' }
  }
}

export async function atualizarPeriodo(id: string, formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const dados = {
      nome: formData.get('nome') as string,
      ordem: parseInt(formData.get('ordem') as string),
      data_inicio: formData.get('data_inicio') as string,
      data_fim: formData.get('data_fim') as string,
    }
    const { error } = await supabase.from('periodos_letivos').update(dados).eq('id', id)
    if (error) return { data: null, error: error.message }
    revalidatePath('/admin/periodos')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao atualizar período' }
  }
}

export async function excluirPeriodo(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('periodos_letivos').delete().eq('id', id)
    if (error) return { data: null, error: error.message }
    revalidatePath('/admin/periodos')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao excluir período' }
  }
}
