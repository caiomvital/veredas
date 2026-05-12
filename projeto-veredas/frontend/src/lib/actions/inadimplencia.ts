'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

export interface InadimplenteInfo {
  lancamentoId: string
  descricao: string
  valor: number
  multa: number
  dataVencimento: string
  diasAtraso: number
  alunoId: string | null
  alunoNome: string | null
  responsavelNome: string | null
  responsavelTelefone: string | null
  mesReferencia: number | null
  anoReferencia: number | null
}

export async function listarInadimplentesDetalhado(): Promise<ActionResult<InadimplenteInfo[]>> {
  try {
    const supabase = await createClient()
    const hoje = new Date().toISOString().split('T')[0]

    const { data: lancamentos } = await supabase
      .from('lancamentos_financeiros')
      .select(`
        id, descricao, valor, multa, data_vencimento, aluno_id, mes_referencia, ano_referencia,
        alunos!left(nome_completo, id)
      `)
      .eq('status', 'pendente')
      .lt('data_vencimento', hoje)
      .order('data_vencimento', { ascending: true })

    if (!lancamentos || lancamentos.length === 0) return { data: [], error: null }

    // Buscar responsáveis pelos alunos
    const alunoIds = lancamentos
      .map((l: any) => l.aluno_id)
      .filter((id: string | null): id is string => id !== null)

    const responsavelMap = new Map<string, { nome: string; telefone: string }>()
    if (alunoIds.length > 0) {
      const { data: vinculos } = await supabase
        .from('responsavel_aluno')
        .select('aluno_id, responsavel_id, responsaveis!inner(nome_completo, telefone)')
        .in('aluno_id', alunoIds)

      for (const v of vinculos ?? []) {
        const r = v.responsaveis as unknown as { nome_completo: string; telefone: string }
        if (!responsavelMap.has(v.aluno_id)) {
          responsavelMap.set(v.aluno_id, { nome: r.nome_completo, telefone: r.telefone ?? '' })
        }
      }
    }

    const inadimplentes: InadimplenteInfo[] = lancamentos.map((l: any) => {
      const alunoNome = l.alunos?.nome_completo ?? null
      const responsavel = l.aluno_id ? responsavelMap.get(l.aluno_id) : null
      const vencimento = l.data_vencimento
      const diff = Math.floor((new Date(hoje).getTime() - new Date(vencimento + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24))

      return {
        lancamentoId: l.id,
        descricao: l.descricao,
        valor: l.valor,
        multa: l.multa,
        dataVencimento: vencimento,
        diasAtraso: Math.max(0, diff),
        alunoId: l.aluno_id,
        alunoNome,
        responsavelNome: responsavel?.nome ?? null,
        responsavelTelefone: responsavel?.telefone ?? null,
        mesReferencia: l.mes_referencia,
        anoReferencia: l.ano_referencia,
      }
    })

    return { data: inadimplentes, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar inadimplentes' }
  }
}
