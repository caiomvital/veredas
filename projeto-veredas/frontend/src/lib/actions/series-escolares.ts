'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'

export interface SerieEscolar {
  id: string
  escola_id: string
  nivel: 'infantil' | 'fund1' | 'fund2' | 'medio'
  nome: string
  ordem: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export async function listarSeries(): Promise<ActionResult<SerieEscolar[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const { data, error } = await supabase
      .from('series_escolares')
      .select('*')
      .eq('escola_id', escolaId)
      .order('ordem')

    if (error) return { data: null, error: error.message }
    return { data: data as unknown as SerieEscolar[], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar séries' }
  }
}

export async function criarSerie(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const nome = formData.get('nome') as string
    const nivel = formData.get('nivel') as string
    const ordem = parseInt(formData.get('ordem') as string) || 0

    if (!nome || !nivel) return { data: null, error: 'Nome e nível são obrigatórios' }

    const { error } = await supabase.from('series_escolares').insert({
      escola_id: escolaId,
      nome,
      nivel,
      ordem,
    })

    if (error) return { data: null, error: error.message }

    revalidatePath('/app/admin/configuracoes')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao criar série' }
  }
}

export async function atualizarSerie(id: string, formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const nome = formData.get('nome') as string
    const nivel = formData.get('nivel') as string
    const ordem = parseInt(formData.get('ordem') as string) || 0

    if (!nome || !nivel) return { data: null, error: 'Nome e nível são obrigatórios' }

    const { error } = await supabase.from('series_escolares').update({ nome, nivel, ordem }).eq('id', id)
    if (error) return { data: null, error: error.message }

    revalidatePath('/app/admin/configuracoes')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao atualizar série' }
  }
}

export async function excluirSerie(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('series_escolares').update({ ativo: false }).eq('id', id)
    if (error) return { data: null, error: error.message }

    revalidatePath('/app/admin/configuracoes')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao excluir série' }
  }
}

export async function reordenarSerie(id: string, direcao: 'cima' | 'baixo'): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    // Buscar série atual e vizinhas
    const { data: series } = await supabase
      .from('series_escolares')
      .select('id, ordem')
      .eq('escola_id', escolaId)
      .eq('ativo', true)
      .order('ordem')

    if (!series) return { data: null, error: 'Séries não encontradas' }

    const idx = series.findIndex((s) => s.id === id)
    if (idx === -1) return { data: null, error: 'Série não encontrada' }

    const targetIdx = direcao === 'cima' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= series.length) return { data: null, error: 'Já está na extremidade' }

    // Trocar ordens
    const current = series[idx]
    const target = series[targetIdx]
    const tempOrdem = current.ordem

    await supabase.from('series_escolares').update({ ordem: target.ordem }).eq('id', current.id)
    await supabase.from('series_escolares').update({ ordem: tempOrdem }).eq('id', target.id)

    revalidatePath('/app/admin/configuracoes')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao reordenar série' }
  }
}
