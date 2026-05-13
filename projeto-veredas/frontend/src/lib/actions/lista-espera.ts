'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'

export interface CandidatoListaEspera {
  id: string
  turma_id: string
  candidato_nome: string
  responsavel_nome: string | null
  telefone: string | null
  data_interesse: string
  notificado: boolean
  created_at: string
}

export async function listarCandidatos(turmaId: string): Promise<ActionResult<CandidatoListaEspera[]>> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('lista_espera')
      .select('*')
      .eq('turma_id', turmaId)
      .order('data_interesse', { ascending: true })

    return { data: (data ?? []) as CandidatoListaEspera[], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar lista de espera' }
  }
}

export async function adicionarCandidato(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const { error } = await supabase.from('lista_espera').insert({
      escola_id: escolaId,
      turma_id: formData.get('turma_id') as string,
      candidato_nome: formData.get('candidato_nome') as string,
      responsavel_nome: (formData.get('responsavel_nome') as string) || null,
      telefone: (formData.get('telefone') as string) || null,
      data_interesse: (formData.get('data_interesse') as string) || new Date().toISOString().split('T')[0],
    })

    if (error) return { data: null, error: error.message }
    revalidatePath('/app/secretaria/lista-espera')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao adicionar candidato' }
  }
}

export async function excluirCandidato(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('lista_espera').delete().eq('id', id)
    if (error) return { data: null, error: error.message }
    revalidatePath('/app/secretaria/lista-espera')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao excluir candidato' }
  }
}

export async function marcarNotificado(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('lista_espera').update({ notificado: true }).eq('id', id)
    if (error) return { data: null, error: error.message }
    revalidatePath('/app/secretaria/lista-espera')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao marcar como notificado' }
  }
}
