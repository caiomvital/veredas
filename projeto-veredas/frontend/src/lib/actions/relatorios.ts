'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

export interface DadosRelatorios {
  alunosPorTurma: { turma: string; total: number; ativos: number; capacidade: number; pct: number }[]
  aprovacaoReprovacao: { turma: string; aprovados: number; reprovados: number; taxaAprovacao: number }[]
  inadimplencia: { pago: number; pendente: number; total: number; pctPago: number }
  frequenciaMedia: { disciplina: string; media: number }[]
  desempenhoDisciplinas: { disciplina: string; mediaGeral: number; periodo1: number; periodo2: number; periodo3: number; periodo4: number }[]
  alunosRisco: { nome: string; turma: string; nota: number | null; frequencia: number | null; motivo: string }[]
  top5: { nome: string; turma: string; media: number }[]
}

export interface DadosProfessor {
  disciplina: string
  turma: string
  desempenho: { nome: string; nota: number; frequencia: number }[]
  frequenciaMedia: number
  alunosAtencao: { nome: string; nota: number | null; frequencia: number | null }[]
}

export async function getRelatoriosAdmin(): Promise<ActionResult<DadosRelatorios>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    // Alunos por turma
    const { data: turmas } = await supabase
      .from('turmas')
      .select('id, codigo, capacidade, serie')
      .eq('ativa', true)
    const turmaIds = turmas?.map((t) => t.id) ?? []
    const { data: matriculas } = await supabase
      .from('matriculas')
      .select('turma_id, status')
      .in('turma_id', turmaIds)

    const matriculasPorTurma = new Map<string, { ativas: number; total: number }>()
    for (const m of matriculas ?? []) {
      const e = matriculasPorTurma.get(m.turma_id) ?? { ativas: 0, total: 0 }
      e.total++
      if (m.status === 'ativa') e.ativas++
      matriculasPorTurma.set(m.turma_id, e)
    }

    const alunosPorTurma = (turmas ?? []).map((t) => {
      const m = matriculasPorTurma.get(t.id) ?? { ativas: 0, total: 0 }
      return {
        turma: `${t.codigo} — ${t.serie}`,
        total: m.total,
        ativos: m.ativas,
        capacidade: t.capacidade,
        pct: t.capacidade > 0 ? Math.round((m.ativas / t.capacidade) * 100) : 0,
      }
    })

    // Aprovação/reprovação por turma
    const anoAtual = new Date().getFullYear()
    const { data: historicos } = await supabase
      .from('historico_escolar')
      .select('*, turmas!inner(codigo, serie)')
      .eq('ano_letivo', anoAtual)

    const histPorTurma = new Map<string, { aprovados: number; reprovados: number }>()
    for (const h of historicos ?? []) {
      const turma = h.turmas as unknown as { codigo: string; serie: string }
      const key = `${turma.codigo} — ${turma.serie}`
      const e = histPorTurma.get(key) ?? { aprovados: 0, reprovados: 0 }
      if (h.situacao === 'aprovado') e.aprovados++
      else if (h.situacao === 'reprovado') e.reprovados++
      histPorTurma.set(key, e)
    }

    const aprovacaoReprovacao = [...histPorTurma.entries()].map(([turma, v]) => ({
      turma,
      aprovados: v.aprovados,
      reprovados: v.reprovados,
      taxaAprovacao: (v.aprovados + v.reprovados) > 0
        ? Math.round((v.aprovados / (v.aprovados + v.reprovados)) * 100) : 100,
    }))

    // Inadimplência
    const { data: lancamentos } = await supabase
      .from('lancamentos_financeiros')
      .select('valor, status')
      .eq('tipo', 'mensalidade')

    const pago = lancamentos?.filter((l) => l.status === 'pago').reduce((s, l) => s + l.valor, 0) ?? 0
    const pendente = lancamentos?.filter((l) => l.status === 'pendente').reduce((s, l) => s + l.valor, 0) ?? 0
    const totalFin = pago + pendente

    // Frequência média por disciplina
    const { data: frequencias } = await supabase
      .from('frequencias')
      .select('presenca, turma_disciplina_professor!inner(disciplina_id, disciplinas!inner(nome))')

    const freqDisc = new Map<string, { total: number; presencas: number }>()
    for (const f of frequencias ?? []) {
      const tdp = f.turma_disciplina_professor as unknown as { disciplinas: { nome: string } }
      const nome = tdp.disciplinas.nome
      const e = freqDisc.get(nome) ?? { total: 0, presencas: 0 }
      e.total++
      if (f.presenca) e.presencas++
      freqDisc.set(nome, e)
    }

    const frequenciaMedia = [...freqDisc.entries()].map(([disciplina, v]) => ({
      disciplina,
      media: v.total > 0 ? Math.round((v.presencas / v.total) * 100) : 100,
    }))

    // Desempenho por disciplina (por período)
    const { data: notas } = await supabase
      .from('notas')
      .select('valor, periodo_id, turma_disciplina_id, turma_disciplina_professor!inner(disciplina_id, disciplinas!inner(nome))')
      .gte('created_at', `${anoAtual}-01-01`)

    const perfDisc = new Map<string, { total: number; sum: number; periodos: Map<string, { sum: number; count: number }> }>()
    for (const n of notas ?? []) {
      const tdp = n.turma_disciplina_professor as unknown as { disciplinas: { nome: string } }
      const nome = tdp.disciplinas.nome
      if (!perfDisc.has(nome)) perfDisc.set(nome, { total: 0, sum: 0, periodos: new Map() })
      const e = perfDisc.get(nome)!
      e.total++
      e.sum += n.valor

      if (n.periodo_id) {
        if (!e.periodos.has(n.periodo_id)) e.periodos.set(n.periodo_id, { sum: 0, count: 0 })
        const p = e.periodos.get(n.periodo_id)!
        p.sum += n.valor
        p.count++
      }
    }

    // Buscar períodos para nomear
    const { data: periodos } = await supabase
      .from('periodos_letivos')
      .select('id, nome, ordem')
      .order('ordem')
    const periodoNomes = (periodos ?? []).map((p) => p.nome)

    const desempenhoDisciplinas = [...perfDisc.entries()].map(([disciplina, v]) => {
      const periodoArray = [1, 2, 3, 4].map((i) => {
        const p = [...v.periodos.entries()]
          .filter((_, idx) => idx === i - 1)
          .map(([_, val]) => val)
        if (p.length > 0) return Math.round((p[0].sum / p[0].count) * 10) / 10
        return 0
      })
      return {
        disciplina,
        mediaGeral: v.total > 0 ? Math.round((v.sum / v.total) * 10) / 10 : 0,
        periodo1: periodoArray[0] ?? 0,
        periodo2: periodoArray[1] ?? 0,
        periodo3: periodoArray[2] ?? 0,
        periodo4: periodoArray[3] ?? 0,
      }
    })

    return {
      data: {
        alunosPorTurma,
        aprovacaoReprovacao,
        inadimplencia: { pago, pendente, total: totalFin, pctPago: totalFin > 0 ? Math.round((pago / totalFin) * 100) : 100 },
        frequenciaMedia,
        desempenhoDisciplinas,
        alunosRisco: [],
        top5: [],
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'Erro ao carregar relatórios' }
  }
}

export async function getRelatoriosCoordenador(): Promise<ActionResult<DadosRelatorios>> {
  try {
    const supabase = await createClient()
    const data = await getRelatoriosAdmin()
    if (data.error || !data.data) return data

    // Alunos em risco
    const result = data.data
    const anoAtual = new Date().getFullYear()

    // Notas baixas
    const { data: notasBaixas } = await supabase
      .from('notas')
      .select('valor, matricula_id, matriculas!inner(aluno_id, alunos!inner(nome_completo), turmas!inner(codigo, serie))')
      .lte('valor', 5)
      .gte('created_at', `${anoAtual}-01-01`)

    const alunosRiscoMap = new Map<string, { nome: string; turma: string; nota: number; freq: number }>()

    for (const n of notasBaixas ?? []) {
      const m = n.matriculas as unknown as {
        aluno_id: string
        alunos: { nome_completo: string }
        turmas: { codigo: string; serie: string }
      }
      if (!alunosRiscoMap.has(m.aluno_id) || n.valor < alunosRiscoMap.get(m.aluno_id)!.nota) {
        alunosRiscoMap.set(m.aluno_id, {
          nome: m.alunos.nome_completo,
          turma: `${m.turmas.codigo} — ${m.turmas.serie}`,
          nota: n.valor,
          freq: 100,
        })
      }
    }

    // Frequência baixa
    const matriculaIds = [...new Set((notasBaixas ?? []).map((n) => n.matricula_id))]
    const { data: freqs } = await supabase
      .from('frequencias')
      .select('presenca, matricula_id')
      .in('matricula_id', matriculaIds.length > 0 ? matriculaIds : ['none'])

    const freqPorMat = new Map<string, { total: number; presencas: number }>()
    for (const f of freqs ?? []) {
      const e = freqPorMat.get(f.matricula_id) ?? { total: 0, presencas: 0 }
      e.total++
      if (f.presenca) e.presencas++
      freqPorMat.set(f.matricula_id, e)
    }

    // Also find alunos with low frequency who might not be in notasBaixas
    const { data: todasFreq } = await supabase
      .from('frequencias')
      .select('presenca, matricula_id, matriculas!inner(aluno_id, alunos!inner(nome_completo), turmas!inner(codigo, serie))')
      .gte('created_at', `${anoAtual}-01-01`)

    const freqAluno = new Map<string, { total: number; presencas: number; nome: string; turma: string }>()
    for (const f of todasFreq ?? []) {
      const m = f.matriculas as unknown as {
        aluno_id: string
        alunos: { nome_completo: string }
        turmas: { codigo: string; serie: string }
      }
      if (!freqAluno.has(m.aluno_id)) {
        freqAluno.set(m.aluno_id, { total: 0, presencas: 0, nome: m.alunos.nome_completo, turma: `${m.turmas.codigo} — ${m.turmas.serie}` })
      }
      const e = freqAluno.get(m.aluno_id)!
      e.total++
      if (f.presenca) e.presencas++
    }

    const alunosRisco: DadosRelatorios['alunosRisco'] = []
    const adicionados = new Set<string>()

    // Add from notas baixas
    for (const [alunoId, info] of alunosRiscoMap) {
      adicionados.add(alunoId)
      alunosRisco.push({
        nome: info.nome,
        turma: info.turma,
        nota: info.nota,
        frequencia: freqAluno.get(alunoId)?.presencas && freqAluno.get(alunoId)?.total
          ? Math.round((freqAluno.get(alunoId)!.presencas / freqAluno.get(alunoId)!.total) * 100) : null,
        motivo: 'nota',
      })
    }

    // Add from baixa frequência
    for (const [alunoId, info] of freqAluno) {
      if (adicionados.has(alunoId)) continue
      const pct = info.total > 0 ? Math.round((info.presencas / info.total) * 100) : 100
      if (pct < 80) {
        alunosRisco.push({
          nome: info.nome,
          turma: info.turma,
          nota: null,
          frequencia: pct,
          motivo: 'frequencia',
        })
      }
    }

    result.alunosRisco = alunosRisco.sort((a, b) => {
      if (a.motivo === 'nota' && b.motivo !== 'nota') return -1
      if (a.motivo !== 'nota' && b.motivo === 'nota') return 1
      return (a.nota ?? 0) - (b.nota ?? 0)
    }).slice(0, 50)

    // Top 5 alunos com melhor desempenho (por turma, aggregate)
    // Simplified: get highest average across all disciplines
    const { data: topNotas } = await supabase
      .from('notas')
      .select('valor, matricula_id, matriculas!inner(aluno_id, alunos!inner(nome_completo), turmas!inner(codigo, serie))')
      .gte('created_at', `${anoAtual}-01-01`)

    const alunoMedia = new Map<string, { sum: number; count: number; nome: string; turma: string }>()
    for (const n of topNotas ?? []) {
      const m = n.matriculas as unknown as {
        aluno_id: string
        alunos: { nome_completo: string }
        turmas: { codigo: string; serie: string }
      }
      if (!alunoMedia.has(m.aluno_id)) {
        alunoMedia.set(m.aluno_id, { sum: 0, count: 0, nome: m.alunos.nome_completo, turma: `${m.turmas.codigo} — ${m.turmas.serie}` })
      }
      const e = alunoMedia.get(m.aluno_id)!
      e.sum += n.valor
      e.count++
    }

    result.top5 = [...alunoMedia.entries()]
      .map(([_, v]) => ({ nome: v.nome, turma: v.turma, media: Math.round((v.sum / v.count) * 10) / 10 }))
      .sort((a, b) => b.media - a.media)
      .slice(0, 5)

    return { data: result, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar relatórios' }
  }
}

export async function getRelatoriosProfessor(): Promise<ActionResult<DadosProfessor[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return { data: null, error: 'Usuário não identificado' }

    const funcionarioId = user.app_metadata?.funcionario_id as string | undefined
    if (!funcionarioId) return { data: null, error: 'Perfil professor não vinculado' }

    const { data: alocacoes } = await supabase
      .from('turma_disciplina_professor')
      .select('*, turmas!inner(codigo, serie, ano_letivo, ativa), disciplinas!inner(nome)')
      .eq('funcionario_id', funcionarioId)

    if (!alocacoes || alocacoes.length === 0) return { data: [], error: null }

    const resultado: DadosProfessor[] = []

    for (const alc of alocacoes) {
      const turma = alc.turmas as unknown as { codigo: string; serie: string; ano_letivo: number; ativa: boolean }
      const disciplina = alc.disciplinas as unknown as { nome: string }

      if (!turma.ativa) continue

      const { data: matriculasTurma } = await supabase
        .from('matriculas')
        .select('id, aluno_id, alunos!inner(nome_completo)')
        .eq('turma_id', alc.turma_id)
        .eq('status', 'ativa')

      const alunos: DadosProfessor['desempenho'] = []
      let freqTotal = 0; let freqCount = 0

      for (const m of matriculasTurma ?? []) {
        const alunoNome = (m.alunos as unknown as { nome_completo: string }).nome_completo

        // Notas
        const { data: notasAluno } = await supabase
          .from('notas')
          .select('valor')
          .eq('matricula_id', m.id)
          .eq('turma_disciplina_id', alc.id)
        const mediaNotas = notasAluno && notasAluno.length > 0
          ? Math.round((notasAluno.reduce((s, n) => s + n.valor, 0) / notasAluno.length) * 10) / 10
          : 0

        // Frequência
        const { data: freqs } = await supabase
          .from('frequencias')
          .select('presenca')
          .eq('matricula_id', m.id)
          .eq('turma_disciplina_id', alc.id)
        let pctFreq = 100
        if (freqs && freqs.length > 0) {
          const presencas = freqs.filter((f) => f.presenca).length
          pctFreq = Math.round((presencas / freqs.length) * 100)
          freqTotal += presencas
          freqCount += freqs.length
        }

        alunos.push({ nome: alunoNome, nota: mediaNotas, frequencia: pctFreq })
      }

      resultado.push({
        disciplina: disciplina.nome,
        turma: `${turma.codigo} — ${turma.serie}`,
        desempenho: alunos.sort((a, b) => b.nota - a.nota),
        frequenciaMedia: freqCount > 0 ? Math.round((freqTotal / freqCount) * 100) : 100,
        alunosAtencao: alunos
          .filter((a) => (a.nota !== null && a.nota < 6) || (a.frequencia !== null && a.frequencia < 80))
          .sort((a, b) => (a.nota ?? 0) - (b.nota ?? 0)),
      })
    }

    return { data: resultado, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar relatórios do professor' }
  }
}
