'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'
import type { Matricula } from '@/types/entities'

export async function listarMatriculas(params?: { status?: string; turma_id?: string }): Promise<ActionResult<Matricula[]>> {
  try {
    const supabase = await createClient()
    let query = supabase.from('matriculas').select('*')

    if (params?.status && params.status !== 'todos') {
      query = query.eq('status', params.status)
    }
    if (params?.turma_id) {
      query = query.eq('turma_id', params.turma_id)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as Matricula[], error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao carregar matrículas' }
  }
}

export async function getMatricula(id: string): Promise<ActionResult<Matricula>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('matriculas').select('*').eq('id', id).single()
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as Matricula, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao carregar matrícula' }
  }
}

export async function criarMatricula(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const dados = {
      aluno_id: formData.get('aluno_id') as string,
      turma_id: formData.get('turma_id') as string,
      data_matricula: formData.get('data_matricula') as string || new Date().toISOString().split('T')[0],
    }

    const { error } = await supabase.from('matriculas').insert(dados)
    if (error) return { data: null, error: error.message }

    revalidatePath('/app/secretaria/matriculas')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao realizar matrícula' }
  }
}

export async function cancelarMatricula(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('matriculas')
      .update({
        status: 'cancelada',
        data_cancelamento: new Date().toISOString().split('T')[0],
      })
      .eq('id', id)

    if (error) return { data: null, error: error.message }

    revalidatePath('/app/secretaria/matriculas')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao cancelar matrícula' }
  }
}
