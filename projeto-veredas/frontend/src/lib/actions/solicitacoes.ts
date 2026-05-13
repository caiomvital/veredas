'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'

export interface Solicitacao {
  id: string
  escola_id: string
  responsavel_id: string
  aluno_id: string | null
  tipo: 'justificativa_falta' | 'pedido_documento' | 'atualizacao_dados' | 'outro'
  documento_tipo: string | null
  assunto: string
  descricao: string | null
  status: 'aberta' | 'em_andamento' | 'resolvida' | 'cancelada'
  resposta: string | null
  respondido_por: string | null
  created_at: string
  updated_at: string
  responsavel_nome?: string
  aluno_nome?: string | null
}

const TIPO_LABEL: Record<string, string> = {
  justificativa_falta: 'Justificativa de Falta',
  pedido_documento: 'Pedido de Documento',
  atualizacao_dados: 'Atualização de Dados',
  outro: 'Outro',
}

const STATUS_LABEL: Record<string, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  resolvida: 'Resolvida',
  cancelada: 'Cancelada',
}

const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'danger'> = {
  aberta: 'warning',
  em_andamento: 'info',
  resolvida: 'success',
  cancelada: 'danger',
}

export { TIPO_LABEL, STATUS_LABEL, STATUS_VARIANT }

export const DOCUMENTO_TIPO_LABEL: Record<string, string> = {
  declaracao_matricula: 'Declaração de Matrícula',
  declaracao_frequencia: 'Declaração de Frequência',
  historico: 'Histórico Escolar',
  contrato: 'Contrato',
}

export async function listarSolicitacoesResponsavel(): Promise<ActionResult<Solicitacao[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const { data: resp } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    if (!resp) return { data: null, error: 'Responsável não encontrado' }

    const { data } = await supabase
      .from('solicitacoes')
      .select('*, alunos!left(nome_completo)')
      .eq('responsavel_id', resp.id)
      .order('created_at', { ascending: false })

    const solicitacoes: Solicitacao[] = (data ?? []).map((s) => ({
      id: s.id,
      escola_id: s.escola_id,
      responsavel_id: s.responsavel_id,
      aluno_id: s.aluno_id,
      tipo: s.tipo,
      documento_tipo: s.documento_tipo ?? null,
      assunto: s.assunto,
      descricao: s.descricao,
      status: s.status,
      resposta: s.resposta,
      respondido_por: s.respondido_por,
      created_at: s.created_at,
      updated_at: s.updated_at,
      aluno_nome: (s.alunos as unknown as { nome_completo: string } | null)?.nome_completo ?? null,
    }))

    return { data: solicitacoes, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar solicitações' }
  }
}

export async function listarSolicitacoesEscola(filtroStatus?: string): Promise<ActionResult<Solicitacao[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    let query = supabase
      .from('solicitacoes')
      .select('*, responsaveis!inner(nome_completo), alunos!left(nome_completo)')
      .eq('escola_id', escolaId)
      .order('created_at', { ascending: false })

    if (filtroStatus) query = query.eq('status', filtroStatus)

    const { data } = await query

    const solicitacoes: Solicitacao[] = (data ?? []).map((s) => ({
      id: s.id,
      escola_id: s.escola_id,
      responsavel_id: s.responsavel_id,
      aluno_id: s.aluno_id,
      tipo: s.tipo,
      documento_tipo: s.documento_tipo ?? null,
      assunto: s.assunto,
      descricao: s.descricao,
      status: s.status,
      resposta: s.resposta,
      respondido_por: s.respondido_por,
      created_at: s.created_at,
      updated_at: s.updated_at,
      responsavel_nome: (s.responsaveis as unknown as { nome_completo: string }).nome_completo,
      aluno_nome: (s.alunos as unknown as { nome_completo: string } | null)?.nome_completo ?? null,
    }))

    return { data: solicitacoes, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar solicitações' }
  }
}

export async function contarSolicitacoesAbertas(): Promise<ActionResult<{ total: number }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const { count } = await supabase
      .from('solicitacoes')
      .select('*', { count: 'exact', head: true })
      .eq('escola_id', escolaId)
      .in('status', ['aberta', 'em_andamento'])

    return { data: { total: count ?? 0 }, error: null }
  } catch {
    return { data: { total: 0 }, error: null }
  }
}

export async function criarSolicitacao(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const { data: resp } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    if (!resp) return { data: null, error: 'Responsável não encontrado' }

    const tipo = formData.get('tipo') as string
    const assunto = formData.get('assunto') as string
    const descricao = formData.get('descricao') as string
    const alunoId = formData.get('aluno_id') as string
    const documentoTipo = formData.get('documento_tipo') as string

    if (!tipo || !assunto) return { data: null, error: 'Tipo e assunto são obrigatórios.' }

    const { data, error } = await supabase
      .from('solicitacoes')
      .insert({
        escola_id: escolaId,
        responsavel_id: resp.id,
        aluno_id: alunoId || null,
        tipo,
        documento_tipo: documentoTipo || null,
        assunto,
        descricao: descricao || null,
        status: 'aberta',
      })
      .select('id')
      .single()

    if (error) return { data: null, error: error.message }
    revalidatePath('/app/responsavel/solicitacoes')
    return { data: { id: data.id }, error: null }
  } catch {
    return { data: null, error: 'Erro ao criar solicitação' }
  }
}

export async function responderSolicitacao(
  id: string,
  resposta: string,
  status: 'resolvida' | 'em_andamento'
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const { data: func } = await supabase
      .from('funcionarios')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    const { error } = await supabase
      .from('solicitacoes')
      .update({
        status,
        resposta,
        respondido_por: func?.id ?? null,
      })
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    revalidatePath('/app/secretaria/solicitacoes')
    revalidatePath('/app/coordenador/solicitacoes')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao responder solicitação' }
  }
}

export async function cancelarSolicitacao(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('solicitacoes')
      .update({ status: 'cancelada' })
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    revalidatePath('/app/responsavel/solicitacoes')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao cancelar solicitação' }
  }
}

export async function getAlunosDoResponsavelParaSolicitacao(): Promise<ActionResult<{ id: string; nome_completo: string }[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const { data: resp } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    if (!resp) return { data: null, error: 'Responsável não encontrado' }

    const { data } = await supabase
      .from('aluno_responsavel')
      .select('aluno_id, alunos!inner(id, nome_completo)')
      .eq('responsavel_id', resp.id)

    const alunos = (data ?? []).map((v) => {
      const a = v.alunos as unknown as { id: string; nome_completo: string }
      return { id: a.id, nome_completo: a.nome_completo }
    })

    return { data: alunos, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar alunos' }
  }
}
