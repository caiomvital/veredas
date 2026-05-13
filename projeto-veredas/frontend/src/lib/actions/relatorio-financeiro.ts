'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

export interface RelatorioMensalResumo {
  totalPrevisto: number
  totalRecebido: number
  totalPendente: number
  totalInadimplente: number
  porTurma: RelatorioPorTurma[]
  receitaMensal: { mes: number; ano: number; recebido: number; previsto: number; label: string }[]
}

export interface RelatorioPorTurma {
  turmaCodigo: string
  turmaSerie: string
  alunos: number
  previsto: number
  recebido: number
  pendente: number
  inadimplente: number
  percRecebido: number
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export async function getRelatorioFinanceiro(mes: number, ano: number): Promise<ActionResult<RelatorioMensalResumo>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    // Buscar todos lançamentos do mês
    const { data: lancamentos } = await supabase
      .from('lancamentos_financeiros')
      .select('*, alunos!left(nome_completo, matricula), config_mensalidades!left(serie)')
      .eq('escola_id', escolaId)
      .eq('mes_referencia', mes)
      .eq('ano_referencia', ano)

    const todos = lancamentos ?? []

    // Totais
    const totalPrevisto = todos.reduce((acc, l) => acc + Number(l.valor), 0)
    const totalRecebido = todos.filter((l) => l.status === 'pago').reduce((acc, l) => acc + Number(l.valor), 0)
    const totalPendente = todos.filter((l) => l.status === 'pendente' && new Date(l.data_vencimento) >= new Date()).reduce((acc, l) => acc + Number(l.valor), 0)
    const totalInadimplente = todos.filter((l) => l.status === 'pendente' && new Date(l.data_vencimento) < new Date()).reduce((acc, l) => acc + Number(l.valor), 0)

    // Agrupar por turma - buscar turmas que têm alunos com lançamentos
    const alunosComLancamento = [...new Set(todos.filter(l => l.aluno_id).map(l => l.aluno_id))]
    let { data: matriculas } = await supabase
      .from('matriculas')
      .select('aluno_id, turmas!inner(codigo, serie)')
      .in('aluno_id', alunosComLancamento)
      .eq('status', 'ativa')

    const turmaMap = new Map<string, { codigo: string; serie: string; alunos: Set<string>; previsto: number; recebido: number; pendente: number; inadimplente: number }>()
    for (const m of (matriculas ?? [])) {
      const turma = m.turmas as unknown as { codigo: string; serie: string }
      const key = `${turma.codigo}-${turma.serie}`
      if (!turmaMap.has(key)) turmaMap.set(key, { codigo: turma.codigo, serie: turma.serie, alunos: new Set(), previsto: 0, recebido: 0, pendente: 0, inadimplente: 0 })
      const entry = turmaMap.get(key)!
      entry.alunos.add(m.aluno_id)
      const lancsAluno = todos.filter(l => l.aluno_id === m.aluno_id)
      for (const l of lancsAluno) {
        entry.previsto += Number(l.valor)
        if (l.status === 'pago') entry.recebido += Number(l.valor)
        else if (new Date(l.data_vencimento) >= new Date()) entry.pendente += Number(l.valor)
        else entry.inadimplente += Number(l.valor)
      }
    }

    const porTurma: RelatorioPorTurma[] = Array.from(turmaMap.values()).map((t) => ({
      turmaCodigo: t.codigo,
      turmaSerie: t.serie,
      alunos: t.alunos.size,
      previsto: Math.round(t.previsto * 100) / 100,
      recebido: Math.round(t.recebido * 100) / 100,
      pendente: Math.round(t.pendente * 100) / 100,
      inadimplente: Math.round(t.inadimplente * 100) / 100,
      percRecebido: t.previsto > 0 ? Math.round((t.recebido / t.previsto) * 100) : 0,
    }))

    // Últimos 6 meses
    const receitaMensal: RelatorioMensalResumo['receitaMensal'] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ano, mes - 1 - i, 1)
      const m = d.getMonth() + 1
      const a = d.getFullYear()
      const { data: lm } = await supabase
        .from('lancamentos_financeiros')
        .select('valor, status')
        .eq('escola_id', escolaId)
        .eq('mes_referencia', m)
        .eq('ano_referencia', a)

      const prev = (lm ?? []).reduce((acc, l) => acc + Number(l.valor), 0)
      const rec = (lm ?? []).filter((l) => l.status === 'pago').reduce((acc, l) => acc + Number(l.valor), 0)
      receitaMensal.push({ mes: m, ano: a, recebido: rec, previsto: prev, label: `${MESES[m - 1]}/${a}` })
    }

    return {
      data: {
        totalPrevisto: Math.round(totalPrevisto * 100) / 100,
        totalRecebido: Math.round(totalRecebido * 100) / 100,
        totalPendente: Math.round(totalPendente * 100) / 100,
        totalInadimplente: Math.round(totalInadimplente * 100) / 100,
        porTurma,
        receitaMensal,
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'Erro ao gerar relatório financeiro' }
  }
}
