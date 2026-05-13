'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'
import type { EventoCalendario, EventoTipo } from '@/types/entities'

export async function criarEvento(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const { data: func } = await supabase
      .from('funcionarios').select('id').eq('usuario_id', user?.id).single()

    const dados = {
      escola_id: escolaId,
      nome: formData.get('nome') as string,
      descricao: (formData.get('descricao') as string) || null,
      data_inicio: formData.get('data_inicio') as string,
      data_fim: (formData.get('data_fim') as string) || null,
      tipo: formData.get('tipo') as EventoTipo,
      criado_por: func?.id ?? null,
    }

    if (!dados.nome || !dados.data_inicio || !dados.tipo) {
      return { data: null, error: 'Nome, data e tipo são obrigatórios.' }
    }

    const { error } = await supabase.from('eventos_calendario').insert(dados)
    if (error) return { data: null, error: error.message }

    revalidatePath('/calendario')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao criar evento' }
  }
}

export async function listarEventos(params?: {
  mes?: number
  ano?: number
}): Promise<ActionResult<EventoCalendario[]>> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('eventos_calendario')
      .select('*')
      .order('data_inicio', { ascending: true })

    if (params?.mes && params?.ano) {
      const start = `${params.ano}-${String(params.mes).padStart(2, '0')}-01`
      const date = new Date(params.ano, params.mes, 0)
      const end = `${params.ano}-${String(params.mes).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      query = query.gte('data_inicio', start).lte('data_inicio', end)
    }

    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as EventoCalendario[], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar eventos' }
  }
}

export async function excluirEvento(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('eventos_calendario').delete().eq('id', id)
    if (error) return { data: null, error: error.message }
    revalidatePath('/calendario')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao excluir evento' }
  }
}
