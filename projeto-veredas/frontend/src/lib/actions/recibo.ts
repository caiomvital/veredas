'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

export interface ReciboData {
  numeroRecibo: string
  descricao: string
  valor: number
  multa: number
  valorTotal: number
  dataVencimento: string
  dataPagamento: string
  mesReferencia: number | null
  anoReferencia: number | null
  alunoNome: string | null
  responsavelNome: string | null
  escolaNome: string
  escolaCnpj: string | null
  escolaEndereco: string | null
}

export async function getReciboData(lancamentoId: string): Promise<ActionResult<ReciboData>> {
  try {
    const supabase = await createClient()

    const { data: lanc } = await supabase
      .from('lancamentos_financeiros')
      .select(`
        *,
        alunos!left (nome_completo)
      `)
      .eq('id', lancamentoId)
      .single()

    if (!lanc) return { data: null, error: 'Lançamento não encontrado' }
    if (lanc.status !== 'pago') return { data: null, error: 'Lançamento não está pago' }

    // Buscar responsável
    let responsavelNome: string | null = null
    if (lanc.aluno_id) {
      const { data: vinculo } = await supabase
        .from('responsavel_aluno')
        .select('responsaveis!inner(nome_completo)')
        .eq('aluno_id', lanc.aluno_id)
        .limit(1)
        .maybeSingle()

      if (vinculo) {
        responsavelNome = (vinculo.responsaveis as unknown as { nome_completo: string }).nome_completo
      }
    }

    // Buscar dados da escola
    const { data: escola } = await supabase
      .from('escolas')
      .select('nome, cnpj, endereco')
      .single()

    const lancData = lanc as any

    return {
      data: {
        numeroRecibo: lancData.numero_recibo ?? '—',
        descricao: lancData.descricao,
        valor: lancData.valor,
        multa: lancData.multa ?? 0,
        valorTotal: lancData.valor + (lancData.multa ?? 0),
        dataVencimento: lancData.data_vencimento,
        dataPagamento: lancData.data_pagamento ?? lancData.pago_em?.split('T')[0] ?? '',
        mesReferencia: lancData.mes_referencia,
        anoReferencia: lancData.ano_referencia,
        alunoNome: lancData.alunos?.nome_completo ?? null,
        responsavelNome,
        escolaNome: escola?.nome ?? 'Escola',
        escolaCnpj: escola?.cnpj ?? null,
        escolaEndereco: escola?.endereco ?? null,
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'Erro ao gerar recibo' }
  }
}
