'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'

export interface AlunoConselho {
  alunoId: string
  alunoNome: string
  matricula: string
  mediaAtual: number
  frequenciaPct: number
  totalAulas: number
  totalFaltas: number
  decisao: string | null
  observacoes: string | null
}

export interface ConselhoClasseRow {
  id: string
  aluno_id: string
  decisao: string
  observacoes: string | null
}

export async function listarAlunosParaConselho(
  turmaId: string,
  periodoId: string
): Promise<ActionResult<AlunoConselho[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    // Buscar matrículas ativas da turma
    const { data: matriculas } = await supabase
      .from('matriculas')
      .select('id, aluno_id, alunos!inner(nome_completo, matricula)')
      .eq('turma_id', turmaId)
      .eq('status', 'ativa')

    if (!matriculas || matriculas.length === 0) return { data: [], error: null }

    const alunoIds = matriculas.map((m) => m.aluno_id)
    const matriculaIds = matriculas.map((m) => m.id)

    // Buscar decisões já registradas
    const { data: decisoes } = await supabase
      .from('conselho_classe')
      .select('aluno_id, decisao, observacoes')
      .eq('turma_id', turmaId)
      .eq('periodo_id', periodoId)
      .in('aluno_id', alunoIds)

    const decisaoMap = new Map((decisoes ?? []).map((d) => [d.aluno_id, d]))

    // Buscar notas do período
    const { data: notas } = await supabase
      .from('notas')
      .select('matricula_id, valor, tipo')
      .in('matricula_id', matriculaIds)
      .eq('periodo_id', periodoId)

    // Calcular média por matrícula
    const mediaPorMatricula = new Map<string, number>()
    const notasPorMat = new Map<string, { prova: number[]; trabalho: number[] }>()
    for (const nRaw of (notas ?? [])) {
      const n = nRaw as { matricula_id: string; valor: number; tipo: string }
      if (!notasPorMat.has(n.matricula_id)) notasPorMat.set(n.matricula_id, { prova: [], trabalho: [] })
      const entry = notasPorMat.get(n.matricula_id)!
      if (n.tipo === 'prova' || n.tipo === 'trabalho') entry[n.tipo].push(n.valor)
    }
    for (const [matId, vals] of notasPorMat) {
      const todas = [...vals.prova, ...vals.trabalho]
      mediaPorMatricula.set(matId, todas.length > 0 ? Math.round((todas.reduce((a, b) => a + b, 0) / todas.length) * 10) / 10 : 0)
    }

    // Buscar frequências do período (via período letivo)
    const { data: periodo } = await supabase
      .from('periodos_letivos')
      .select('data_inicio, data_fim')
      .eq('id', periodoId)
      .single()

    let queryFreq = supabase
      .from('frequencias')
      .select('matricula_id, presenca')
      .in('matricula_id', matriculaIds)

    if (periodo) {
      queryFreq = queryFreq
        .gte('data_aula', periodo.data_inicio)
        .lte('data_aula', periodo.data_fim)
    }

    const { data: frequencias } = await queryFreq

    const freqPorMatricula = new Map<string, { total: number; presencas: number }>()
    for (const f of (frequencias ?? [])) {
      if (!freqPorMatricula.has(f.matricula_id)) freqPorMatricula.set(f.matricula_id, { total: 0, presencas: 0 })
      const entry = freqPorMatricula.get(f.matricula_id)!
      entry.total++
      if (f.presenca) entry.presencas++
    }

    // Montar resultado
    const alunos: AlunoConselho[] = matriculas.map((m) => {
      const aluno = m.alunos as unknown as { nome_completo: string; matricula: string }
      const aId = m.aluno_id
      const matId = m.id
      const media = mediaPorMatricula.get(matId) ?? 0
      const freq = freqPorMatricula.get(matId) ?? { total: 0, presencas: 0 }
      const freqPct = freq.total > 0 ? Math.round((freq.presencas / freq.total) * 100) : 100
      const decisao = decisaoMap.get(aId)

      return {
        alunoId: aId,
        alunoNome: aluno.nome_completo,
        matricula: aluno.matricula,
        mediaAtual: media,
        frequenciaPct: freqPct,
        totalAulas: freq.total,
        totalFaltas: freq.total - freq.presencas,
        decisao: decisao?.decisao ?? null,
        observacoes: decisao?.observacoes ?? null,
      }
    })

    return { data: alunos, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar alunos para conselho' }
  }
}

export async function salvarDecisaoConselho(
  turmaId: string,
  periodoId: string,
  alunoId: string,
  decisao: string,
  observacoes: string
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const { data: func } = await supabase
      .from('funcionarios')
      .select('id')
      .eq('usuario_id', user?.id)
      .single()

    const { error } = await supabase
      .from('conselho_classe')
      .upsert({
        escola_id: escolaId,
        turma_id: turmaId,
        periodo_id: periodoId,
        aluno_id: alunoId,
        decisao,
        observacoes: observacoes || null,
        registrado_por: func?.id ?? null,
      }, { onConflict: 'turma_id, periodo_id, aluno_id' })

    if (error) return { data: null, error: error.message }
    revalidatePath('/coordenador/conselho')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao salvar decisão' }
  }
}

export async function salvarDecisoesEmLote(
  turmaId: string,
  periodoId: string,
  decisoes: { alunoId: string; decisao: string; observacoes: string }[]
): Promise<ActionResult<{ salvos: number }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const { data: func } = await supabase
      .from('funcionarios')
      .select('id')
      .eq('usuario_id', user?.id)
      .single()

    const rows = decisoes.map((d) => ({
      escola_id: escolaId,
      turma_id: turmaId,
      periodo_id: periodoId,
      aluno_id: d.alunoId,
      decisao: d.decisao,
      observacoes: d.observacoes || null,
      registrado_por: func?.id ?? null,
    }))

    let salvos = 0
    for (const row of rows) {
      const { error } = await supabase
        .from('conselho_classe')
        .upsert(row, { onConflict: 'turma_id, periodo_id, aluno_id' })
      if (!error) salvos++
    }

    revalidatePath('/coordenador/conselho')
    return { data: { salvos }, error: null }
  } catch {
    return { data: null, error: 'Erro ao salvar decisões' }
  }
}
