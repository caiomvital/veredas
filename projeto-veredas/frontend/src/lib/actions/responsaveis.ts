'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'
import type { Responsavel, AlunoResponsavel } from '@/types/entities'

export async function listarResponsaveis(): Promise<ActionResult<Responsavel[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('responsaveis').select('*').order('nome_completo')
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as Responsavel[], error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao carregar responsáveis' }
  }
}

export async function getResponsavel(id: string): Promise<ActionResult<Responsavel>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('responsaveis').select('*').eq('id', id).single()
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as Responsavel, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao carregar responsável' }
  }
}

export async function getVinculosPorResponsavel(responsavelId: string): Promise<ActionResult<AlunoResponsavel[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('aluno_responsavel')
      .select('*')
      .eq('responsavel_id', responsavelId)

    if (error) return { data: null, error: error.message }
    return { data: data as unknown as AlunoResponsavel[], error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao carregar vínculos' }
  }
}

export async function criarResponsavel(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const dados = {
      escola_id: escolaId,
      nome_completo: formData.get('nome_completo') as string,
      cpf: formData.get('cpf') as string,
      rg: (formData.get('rg') as string) || null,
      email: formData.get('email') as string,
      telefone: (formData.get('telefone') as string) || null,
      profissao: (formData.get('profissao') as string) || null,
    }

    const { error } = await supabase.from('responsaveis').insert(dados)
    if (error) return { data: null, error: error.message }

    revalidatePath('/admin/responsaveis')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao criar responsável' }
  }
}

export async function atualizarResponsavel(id: string, formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const dados = {
      nome_completo: formData.get('nome_completo') as string,
      cpf: formData.get('cpf') as string,
      rg: (formData.get('rg') as string) || null,
      email: formData.get('email') as string,
      telefone: (formData.get('telefone') as string) || null,
      profissao: (formData.get('profissao') as string) || null,
    }

    const { error } = await supabase.from('responsaveis').update(dados).eq('id', id)
    if (error) return { data: null, error: error.message }

    revalidatePath('/admin/responsaveis')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao atualizar responsável' }
  }
}

export async function vincularAluno(responsavelId: string, alunoId: string, grauParentesco: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('aluno_responsavel').insert({
      aluno_id: alunoId,
      responsavel_id: responsavelId,
      grau_parentesco: grauParentesco,
    })
    if (error) return { data: null, error: error.message }

    revalidatePath('/admin/responsaveis')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao vincular aluno' }
  }
}

export async function desvincularAluno(responsavelId: string, alunoId: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('aluno_responsavel')
      .delete()
      .eq('aluno_id', alunoId)
      .eq('responsavel_id', responsavelId)

    if (error) return { data: null, error: error.message }

    revalidatePath('/admin/responsaveis')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao desvincular aluno' }
  }
}
