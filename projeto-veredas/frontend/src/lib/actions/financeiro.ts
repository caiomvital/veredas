'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'
import type { ConfigMensalidade, LancamentoFinanceiro } from '@/types/entities'

// ---- ConfigMensalidade ----

export async function listarConfigMensalidades(anoLetivo?: number): Promise<ActionResult<ConfigMensalidade[]>> {
  try {
    const supabase = await createClient()
    let query = supabase.from('config_mensalidades').select('*').order('serie')
    if (anoLetivo) query = query.eq('ano_letivo', anoLetivo)
    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as ConfigMensalidade[], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar configurações' }
  }
}

export async function salvarConfigMensalidade(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const dados = {
      escola_id: escolaId,
      serie: formData.get('serie') as string,
      ano_letivo: parseInt(formData.get('ano_letivo') as string),
      valor: parseFloat(formData.get('valor') as string),
    }
    const { error } = await supabase.from('config_mensalidades').upsert(dados, {
      onConflict: 'escola_id, serie, ano_letivo',
    })
    if (error) return { data: null, error: error.message }
    revalidatePath('/admin/financeiro')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao salvar configuração' }
  }
}

export async function excluirConfigMensalidade(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('config_mensalidades').delete().eq('id', id)
    if (error) return { data: null, error: error.message }
    revalidatePath('/admin/financeiro')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao excluir configuração' }
  }
}

// ---- LancamentosFinanceiros ----

export async function listarLancamentos(params?: {
  status?: string
  tipo?: string
  aluno_id?: string
}): Promise<ActionResult<LancamentoFinanceiro[]>> {
  try {
    const supabase = await createClient()
    let query = supabase.from('lancamentos_financeiros').select('*').order('data_vencimento', { ascending: false })
    if (params?.status) query = query.eq('status', params.status)
    if (params?.tipo) query = query.eq('tipo', params.tipo)
    if (params?.aluno_id) query = query.eq('aluno_id', params.aluno_id)
    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as LancamentoFinanceiro[], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar lançamentos' }
  }
}

export async function criarLancamentoExtra(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const { data: func } = await supabase
      .from('funcionarios').select('id').eq('usuario_id', user?.id).single()

    const dados = {
      escola_id: escolaId,
      aluno_id: (formData.get('aluno_id') as string) || null,
      tipo: 'extra' as const,
      descricao: formData.get('descricao') as string,
      valor: parseFloat(formData.get('valor') as string),
      data_vencimento: formData.get('data_vencimento') as string,
      criado_por: func?.id ?? null,
    }
    const { error } = await supabase.from('lancamentos_financeiros').insert(dados)
    if (error) return { data: null, error: error.message }
    revalidatePath('/admin/financeiro')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao criar lançamento' }
  }
}

export async function baixarPagamento(id: string, dataPagamento?: string): Promise<ActionResult<{ multa: number; numeroRecibo: string | null }>> {
  try {
    const supabase = await createClient()

    const { data: lancamento, error: fetchError } = await supabase
      .from('lancamentos_financeiros').select('*').eq('id', id).single()
    if (fetchError || !lancamento) return { data: null, error: 'Lançamento não encontrado' }

    const lanc = lancamento as unknown as LancamentoFinanceiro
    if (lanc.status === 'pago') return { data: null, error: 'Lançamento já está pago' }

    const paymentDate = dataPagamento || new Date().toISOString().split('T')[0]
    const multa = paymentDate > lanc.data_vencimento
      ? Math.round(lanc.valor * 0.02 * 100) / 100
      : 0

    const { data: { user } } = await supabase.auth.getUser()
    const { data: func } = await supabase
      .from('funcionarios').select('id').eq('usuario_id', user?.id).single()

    // Gerar número do recibo
    const ano = new Date().getFullYear()
    const { count } = await supabase
      .from('lancamentos_financeiros')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pago')
      .gte('pago_em', `${ano}-01-01`)
    const seq = (count ?? 0) + 1
    const numeroRecibo = `REC-${ano}-${String(seq).padStart(5, '0')}`

    const { error } = await supabase
      .from('lancamentos_financeiros')
      .update({
        status: 'pago',
        data_pagamento: paymentDate,
        multa,
        pago_em: new Date().toISOString(),
        baixado_por: func?.id ?? null,
        numero_recibo: numeroRecibo,
        mes_referencia: new Date(paymentDate + 'T00:00:00').getMonth() + 1,
        ano_referencia: ano,
      })
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    revalidatePath('/admin/financeiro')
    return { data: { multa, numeroRecibo }, error: null }
  } catch {
    return { data: null, error: 'Erro ao registrar pagamento' }
  }
}

export async function listarInadimplentes(): Promise<ActionResult<LancamentoFinanceiro[]>> {
  try {
    const supabase = await createClient()
    const hoje = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('lancamentos_financeiros')
      .select('*')
      .eq('status', 'pendente')
      .lt('data_vencimento', hoje)
      .order('data_vencimento', { ascending: true })
    if (error) return { data: null, error: error.message }
    return { data: data as unknown as LancamentoFinanceiro[], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar inadimplentes' }
  }
}
