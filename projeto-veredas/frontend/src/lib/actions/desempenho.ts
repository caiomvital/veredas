'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

export interface AlunoDesempenho {
  alunoId: string
  alunoNome: string
  matriculaId: string
  disciplinas: {
    disciplinaId: string
    disciplinaNome: string
    mediaBimestral: number
    notaRecuperacao?: number
    mediaFinal?: number
  }[]
  mediaGeral: number
  frequenciaPct: number
  totalAulas: number
  totalPresencas: number
  situacao: 'aprovado' | 'recuperacao' | 'reprovado' | 'reprovado_falta' | 'em_andamento'
}

export async function calcularDesempenhoTurma(
  turmaId: string,
  periodoId: string
): Promise<ActionResult<AlunoDesempenho[]>> {
  try {
    const supabase = await createClient()

    // Buscar alunos com matrícula ativa na turma
    const { data: matriculas } = await supabase
      .from('matriculas')
      .select('id, aluno_id, alunos!inner(nome_completo)')
      .eq('turma_id', turmaId)
      .eq('status', 'ativa')

    if (!matriculas || matriculas.length === 0) return { data: [], error: null }

    // Buscar TDPs da turma
    const { data: tdps } = await supabase
      .from('turma_disciplina_professor')
      .select('id, disciplina_id, disciplinas!inner(nome)')
      .eq('turma_id', turmaId)

    if (!tdps || tdps.length === 0) return { data: [], error: null }

    const tdpIds = tdps.map((t: any) => t.id)
    const matriculaIds = matriculas.map((m) => m.id)

    // Buscar notas deste período
    const { data: notas } = await supabase
      .from('notas')
      .select('*')
      .in('matricula_id', matriculaIds)
      .in('turma_disciplina_id', tdpIds)
      .eq('periodo_id', periodoId)

    // Buscar frequências
    const { data: frequencias } = await supabase
      .from('frequencias')
      .select('matricula_id, presenca')
      .in('matricula_id', matriculaIds)

    const desempenho: AlunoDesempenho[] = matriculas.map((mat) => {
      const matId = mat.id

      // Notas do aluno por disciplina
      const notasAluno = (notas ?? []).filter((n) => n.matricula_id === matId)
      const disciplinas = tdps.map((tdp: any) => {
        const notasDisc = notasAluno.filter((n) => n.turma_disciplina_id === tdp.id)
        const prova = notasDisc.find((n) => n.tipo === 'prova')?.valor ?? 0
        const trabalho = notasDisc.find((n) => n.tipo === 'trabalho')?.valor ?? 0
        const recuperacao = notasDisc.find((n) => n.tipo === 'recuperacao')?.valor
        const mediaFinal = notasDisc.find((n) => n.tipo === 'media_final')?.valor

        // Média bimestral = (Prova + Trabalho) / 2
        let mediaBimestral = (prova + trabalho) / 2

        // Se houver recuperação e média < 5.0: média = (média + recuperação) / 2
        if (recuperacao !== undefined && mediaBimestral < 5) {
          mediaBimestral = (mediaBimestral + recuperacao) / 2
        }

        return {
          disciplinaId: tdp.disciplina_id,
          disciplinaNome: tdp.disciplinas.nome,
          mediaBimestral: Math.round(mediaBimestral * 10) / 10,
          notaRecuperacao: recuperacao,
          mediaFinal: mediaFinal ?? undefined,
        }
      })

      // Média geral = soma das médias bimestrais / total de disciplinas
      const somaMedias = disciplinas.reduce((acc, d) => acc + d.mediaBimestral, 0)
      const mediaGeral = disciplinas.length > 0 ? Math.round((somaMedias / disciplinas.length) * 10) / 10 : 0

      // Frequência
      const freqAluno = (frequencias ?? []).filter((f) => f.matricula_id === matId)
      const totalAulas = freqAluno.length
      const totalPresencas = freqAluno.filter((f) => f.presenca).length
      const frequenciaPct = totalAulas > 0 ? Math.round((totalPresencas / totalAulas) * 100) : 100

      // Situação
      let situacao: AlunoDesempenho['situacao'] = 'em_andamento'
      if (mediaGeral >= 7 && frequenciaPct >= 75) situacao = 'aprovado'
      else if (frequenciaPct < 75) situacao = 'reprovado_falta'
      else if (mediaGeral >= 5) situacao = 'recuperacao'
      else situacao = 'reprovado'

      return {
        alunoId: mat.aluno_id,
        alunoNome: (mat.alunos as unknown as { nome_completo: string }).nome_completo,
        matriculaId: matId,
        disciplinas,
        mediaGeral,
        frequenciaPct,
        totalAulas,
        totalPresencas,
        situacao,
      }
    })

    return { data: desempenho, error: null }
  } catch (err) {
    return { data: null, error: 'Erro ao calcular desempenho' }
  }
}

export type SituacaoAluno = AlunoDesempenho['situacao']

export const SITUACAO_LABEL: Record<SituacaoAluno, string> = {
  aprovado: 'Aprovado',
  recuperacao: 'Recuperação',
  reprovado: 'Reprovado',
  reprovado_falta: 'Reprovado por Falta',
  em_andamento: 'Em Andamento',
}

export const SITUACAO_COR: Record<SituacaoAluno, string> = {
  aprovado: 'text-green-700 bg-green-50 border-green-200',
  recuperacao: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  reprovado: 'text-red-700 bg-red-50 border-red-200',
  reprovado_falta: 'text-red-700 bg-red-50 border-red-200',
  em_andamento: 'text-blue-700 bg-blue-50 border-blue-200',
}
