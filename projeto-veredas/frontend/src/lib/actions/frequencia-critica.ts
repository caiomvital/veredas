'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

export interface AlunoFrequenciaCritica {
  alunoId: string
  alunoNome: string
  turmaId: string
  turmaCodigo: string
  turmaSerie: string
  disciplinaId: string
  disciplinaNome: string
  totalAulas: number
  presencas: number
  faltas: number
  frequenciaPct: number
  aulasPodeFaltar: number
  nivel: 'critico' | 'atencao'
  responsavelTelefone: string | null
}

export async function listarFrequenciaCritica(): Promise<ActionResult<AlunoFrequenciaCritica[]>> {
  try {
    const supabase = await createClient()

    // Buscar todas as matriculas ativas
    const { data: matriculas } = await supabase
      .from('matriculas')
      .select('id, aluno_id, turma_id, alunos!inner(nome_completo), turmas!inner(codigo, serie)')
      .eq('status', 'ativa')

    if (!matriculas || matriculas.length === 0) return { data: [], error: null }

    const matriculaIds = matriculas.map((m) => m.id)

    // Buscar todas as frequencias
    const { data: frequencias } = await supabase
      .from('frequencias')
      .select('matricula_id, turma_disciplina_id, presenca, turma_disciplina_professor!inner(disciplina_id, disciplinas!inner(nome))')
      .in('matricula_id', matriculaIds)

    if (!frequencias || frequencias.length === 0) return { data: [], error: null }

    // Calcular frequência por aluno + disciplina
    const alunoDiscMap = new Map<string, { total: number; presencas: number }>()

    for (const f of frequencias) {
      const tdp = f.turma_disciplina_professor as unknown as { disciplina_id: string; disciplinas: { nome: string } }
      const key = `${f.matricula_id}_${tdp.disciplina_id}`
      if (!alunoDiscMap.has(key)) alunoDiscMap.set(key, { total: 0, presencas: 0 })
      const entry = alunoDiscMap.get(key)!
      entry.total++
      if (f.presenca) entry.presencas++
    }

    const criticos: AlunoFrequenciaCritica[] = []

    for (const m of matriculas) {
      for (const [key, val] of alunoDiscMap) {
        const [matId, discId] = key.split('_')
        if (matId !== m.id) continue

        // Encontrar o nome da disciplina a partir da primeira frequencia
        const freqAluno = (frequencias ?? []).filter((f) => f.matricula_id === m.id)
        const tdp = freqAluno.find((f) => {
          const t = f.turma_disciplina_professor as unknown as { disciplina_id: string }
          return t.disciplina_id === discId
        })?.turma_disciplina_professor as unknown as { disciplina_id: string; disciplinas: { nome: string } } | undefined

        const pct = val.total > 0 ? Math.round((val.presencas / val.total) * 100) : 100
        if (pct >= 80) continue // Ignorar alunos com frequência ok

        // Quantas aulas pode faltar antes de atingir 75%
        // (presencas + x) / (total + x) >= 0.75 → presencas + x >= 0.75(total + x) → presencas + x >= 0.75*total + 0.75x
        // presencas - 0.75*total >= -0.25x → x >= (0.75*total - presencas) / 0.25
        const aulasPodeFaltar = Math.max(0, Math.floor((0.75 * val.total - val.presencas) / 0.25))

        criticos.push({
          alunoId: m.aluno_id,
          alunoNome: (m.alunos as unknown as { nome_completo: string }).nome_completo,
          turmaId: m.turma_id,
          turmaCodigo: (m.turmas as unknown as { codigo: string }).codigo,
          turmaSerie: (m.turmas as unknown as { serie: string }).serie,
          disciplinaId: discId,
          disciplinaNome: tdp?.disciplinas?.nome ?? '—',
          totalAulas: val.total,
          presencas: val.presencas,
          faltas: val.total - val.presencas,
          frequenciaPct: pct,
          aulasPodeFaltar,
          nivel: pct < 75 ? 'critico' : 'atencao',
          responsavelTelefone: null,
        })
      }
    }

    // Buscar telefone dos responsáveis
    const alunoIds = [...new Set(criticos.map((c) => c.alunoId))]
    const telefoneMap = new Map<string, string | null>()
    if (alunoIds.length > 0) {
      const { data: vinculos } = await supabase
        .from('responsavel_aluno')
        .select('aluno_id, responsaveis!inner(telefone)')
        .in('aluno_id', alunoIds)
      for (const v of vinculos ?? []) {
        const r = v.responsaveis as unknown as { telefone: string | null }
        if (!telefoneMap.has(v.aluno_id)) {
          telefoneMap.set(v.aluno_id, r.telefone ?? null)
        }
      }
    }

    const criticosComTel = criticos.map((c) => ({
      ...c,
      responsavelTelefone: telefoneMap.get(c.alunoId) ?? null,
    }))

    return { data: criticosComTel, error: null }
  } catch (err) {
    return { data: null, error: 'Erro ao calcular frequência crítica' }
  }
}
