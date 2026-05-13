'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

export interface FinanceiroResponsavel {
  alunoId: string
  alunoNome: string
  lancamentos: {
    id: string
    mes: number
    ano: number
    valor: number
    dataVencimento: string
    status: 'pago' | 'pendente'
    multa: number
    dataPagamento: string | null
    descricao: string
  }[]
  resumo: {
    pago: number
    pendente: number
    vencido: number
    totalPendente: number
  }
}

export async function getFinanceiroResponsavel(): Promise<ActionResult<FinanceiroResponsavel[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }
    const escolaId = user?.app_metadata?.escola_id as string | undefined

    const { data: resp } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('usuario_id', user.id)
      .single()
    if (!resp) return { data: null, error: 'Responsável não encontrado' }

    const { data: vinculos } = await supabase
      .from('aluno_responsavel')
      .select('aluno_id, alunos!inner(id, nome_completo)')
      .eq('responsavel_id', resp.id)

    if (!vinculos || vinculos.length === 0) return { data: [], error: null }

    const hoje = new Date().toISOString().split('T')[0]

    const resultado: FinanceiroResponsavel[] = []

    for (const v of vinculos) {
      const aluno = v.alunos as unknown as { id: string; nome_completo: string }
      const { data: lancamentos } = await supabase
        .from('lancamentos_financeiros')
        .select('*')
        .eq('aluno_id', aluno.id)
        .eq('tipo', 'mensalidade')
        .order('data_vencimento', { ascending: false })
        .limit(24)

      const lancs = (lancamentos ?? []).map((l) => ({
        id: l.id,
        mes: l.mes_referencia ?? 0,
        ano: l.ano_referencia ?? 0,
        valor: l.valor,
        dataVencimento: l.data_vencimento,
        status: l.status as 'pago' | 'pendente',
        multa: l.multa ?? 0,
        dataPagamento: l.data_pagamento,
        descricao: l.descricao ?? '',
      }))

      const pago = lancs.filter((l) => l.status === 'pago')
      const pendentes = lancs.filter((l) => l.status === 'pendente')
      const vencidos = pendentes.filter((l) => l.dataVencimento < hoje)

      resultado.push({
        alunoId: aluno.id,
        alunoNome: aluno.nome_completo,
        lancamentos: lancs,
        resumo: {
          pago: pago.length,
          pendente: pendentes.length,
          vencido: vencidos.length,
          totalPendente: pendentes.reduce((s, l) => s + l.valor + l.multa, 0),
        },
      })
    }

    return { data: resultado, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar financeiro' }
  }
}

export async function getChavePixEscola(): Promise<ActionResult<string | null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: null }

    const { data } = await supabase.from('escolas').select('chave_pix').eq('id', escolaId).single()
    return { data: (data?.chave_pix as string) ?? null, error: null }
  } catch {
    return { data: null, error: null }
  }
}

export async function getWhatsAppEscola(): Promise<ActionResult<string | null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: null }

    const { data } = await supabase.from('escolas').select('contato').eq('id', escolaId).single()
    const contato = data?.contato as Record<string, unknown> | undefined
    const redes = contato?.redes_sociais as Array<{ tipo: string; url: string }> | undefined
    const whats = redes?.find((r) => r.tipo === 'whatsapp')
    return { data: whats?.url?.replace(/\D/g, '') ?? null, error: null }
  } catch {
    return { data: null, error: null }
  }
}
