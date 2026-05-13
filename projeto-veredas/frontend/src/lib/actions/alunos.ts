'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'
import type { Aluno } from '@/types/entities'

export interface AlunoComTurma extends Aluno {
  matriculas: {
    turmas: { codigo: string; serie: string } | null
  }[]
  aluno_responsavel: {
    grau_parentesco: string
    responsaveis: { nome_completo: string } | null
  }[]
}

export async function listarAlunos(params?: { status?: string; busca?: string }): Promise<ActionResult<AlunoComTurma[]>> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('alunos')
      .select(`
        *,
        matriculas!left(turmas!left(codigo, serie)),
        aluno_responsavel!left(grau_parentesco, responsaveis!left(nome_completo))
      `)
      .order('nome_completo')

    if (params?.status && params.status !== 'todos') {
      query = query.eq('status', params.status)
    }
    if (params?.busca) {
      query = query.or(
        `nome_completo.ilike.%${params.busca}%,matricula.ilike.%${params.busca}%,cpf.ilike.%${params.busca}%`
      )
    }

    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as AlunoComTurma[], error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao carregar alunos' }
  }
}

export async function getAluno(id: string): Promise<ActionResult<Aluno>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('alunos').select('*').eq('id', id).single()
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as Aluno, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao carregar aluno' }
  }
}

export async function criarAluno(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const dados = {
      escola_id: escolaId,
      matricula: formData.get('matricula') as string,
      nome_completo: formData.get('nome_completo') as string,
      data_nascimento: formData.get('data_nascimento') as string,
      cpf: (formData.get('cpf') as string) || null,
      rg: (formData.get('rg') as string) || null,
      orgao_emissor: (formData.get('orgao_emissor') as string) || null,
      naturalidade: (formData.get('naturalidade') as string) || null,
      nome_mae: formData.get('nome_mae') as string,
      nome_pai: (formData.get('nome_pai') as string) || null,
      endereco: {
        cep: formData.get('cep') || '',
        rua: formData.get('rua') || '',
        numero: formData.get('numero') || '',
        complemento: formData.get('complemento') || '',
        bairro: formData.get('bairro') || '',
        cidade: formData.get('cidade') || '',
        uf: (formData.get('uf') as string) || '',
      },
      contato_responsavel: {
        telefone: formData.get('telefone') || '',
        email: formData.get('email_responsavel') || '',
      },
      lgpd_autorizacao_imagem: formData.get('lgpd_autorizacao_imagem') === 'on',
      lgpd_autorizacao_dados: formData.get('lgpd_autorizacao_dados') === 'on',
      tipo_sanguineo: (formData.get('tipo_sanguineo') as string) || null,
      alergias: (formData.get('alergias') as string) || null,
      medicamentos: (formData.get('medicamentos') as string) || null,
      plano_saude: (formData.get('plano_saude') as string) || null,
      observacoes_medicas: (formData.get('observacoes_medicas') as string) || null,
      pode_sair_sozinho: formData.get('pode_sair_sozinho') === 'on',
    }

    const { error } = await supabase.from('alunos').insert(dados)
    if (error) return { data: null, error: error.message }

    revalidatePath('/admin/alunos')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao criar aluno' }
  }
}

export async function atualizarAluno(id: string, formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const dados = {
      matricula: formData.get('matricula') as string,
      nome_completo: formData.get('nome_completo') as string,
      data_nascimento: formData.get('data_nascimento') as string,
      cpf: (formData.get('cpf') as string) || null,
      rg: (formData.get('rg') as string) || null,
      orgao_emissor: (formData.get('orgao_emissor') as string) || null,
      naturalidade: (formData.get('naturalidade') as string) || null,
      nome_mae: formData.get('nome_mae') as string,
      nome_pai: (formData.get('nome_pai') as string) || null,
      endereco: {
        cep: formData.get('cep') || '',
        rua: formData.get('rua') || '',
        numero: formData.get('numero') || '',
        complemento: formData.get('complemento') || '',
        bairro: formData.get('bairro') || '',
        cidade: formData.get('cidade') || '',
        uf: (formData.get('uf') as string) || '',
      },
      contato_responsavel: {
        telefone: formData.get('telefone') || '',
        email: formData.get('email_responsavel') || '',
      },
      lgpd_autorizacao_imagem: formData.get('lgpd_autorizacao_imagem') === 'on',
      lgpd_autorizacao_dados: formData.get('lgpd_autorizacao_dados') === 'on',
      status: (formData.get('status') as string) || 'ativo',
      tipo_sanguineo: (formData.get('tipo_sanguineo') as string) || null,
      alergias: (formData.get('alergias') as string) || null,
      medicamentos: (formData.get('medicamentos') as string) || null,
      plano_saude: (formData.get('plano_saude') as string) || null,
      observacoes_medicas: (formData.get('observacoes_medicas') as string) || null,
      pode_sair_sozinho: formData.get('pode_sair_sozinho') === 'on',
    }

    const { error } = await supabase.from('alunos').update(dados).eq('id', id)
    if (error) return { data: null, error: error.message }

    revalidatePath('/admin/alunos')
    revalidatePath(`/admin/alunos/${id}`)
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao atualizar aluno' }
  }
}

export async function excluirAluno(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('alunos').update({ status: 'inativo' }).eq('id', id)
    if (error) return { data: null, error: error.message }

    revalidatePath('/admin/alunos')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao excluir aluno' }
  }
}
