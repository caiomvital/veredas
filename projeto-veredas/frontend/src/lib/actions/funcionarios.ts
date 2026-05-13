'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'
import type { Funcionario } from '@/types/entities'

export async function listarFuncionarios(): Promise<ActionResult<Funcionario[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .order('nome_completo')

    if (error) return { data: null, error: error.message }
    return { data: data as unknown as Funcionario[], error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao carregar funcionários' }
  }
}

export async function getFuncionario(id: string): Promise<ActionResult<Funcionario>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as unknown as Funcionario, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao carregar funcionário' }
  }
}

export async function criarFuncionario(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const dados = {
      escola_id: escolaId,
      nome_completo: formData.get('nome_completo') as string,
      cpf: formData.get('cpf') as string,
      rg: formData.get('rg') as string || null,
      orgao_emissor: formData.get('orgao_emissor') as string || null,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string || null,
      cargo: formData.get('cargo') as string,
      formacao: formData.get('formacao') as string || null,
      data_admissao: formData.get('data_admissao') as string || null,
    }

    const { error } = await supabase.from('funcionarios').insert(dados)
    if (error) return { data: null, error: error.message }

    revalidatePath('/app/admin/funcionarios')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao criar funcionário' }
  }
}

export async function atualizarFuncionario(id: string, formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const dados = {
      nome_completo: formData.get('nome_completo') as string,
      cpf: formData.get('cpf') as string,
      rg: formData.get('rg') as string || null,
      orgao_emissor: formData.get('orgao_emissor') as string || null,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string || null,
      cargo: formData.get('cargo') as string,
      formacao: formData.get('formacao') as string || null,
      data_admissao: formData.get('data_admissao') as string || null,
    }

    const { error } = await supabase.from('funcionarios').update(dados).eq('id', id)
    if (error) return { data: null, error: error.message }

    revalidatePath('/app/admin/funcionarios')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao atualizar funcionário' }
  }
}

export async function excluirFuncionario(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('funcionarios').update({ ativo: false }).eq('id', id)
    if (error) return { data: null, error: error.message }

    revalidatePath('/app/admin/funcionarios')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao excluir funcionário' }
  }
}
