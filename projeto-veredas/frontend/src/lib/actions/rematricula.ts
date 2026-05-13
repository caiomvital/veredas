'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'

export interface RematriculaAluno {
  matriculaId: string
  alunoId: string
  alunoNome: string
  turmaAtualId: string
  turmaAtualCodigo: string
  serieAtual: string
  situacao: 'aprovado' | 'reprovado' | 'pendente'
  serieSugerida: string
  turmaSugeridaId: string | null
  turmaSugeridaCodigo: string
  jaRematriculado: boolean
}

export async function listarCandidatosRematricula(anoDestino: number): Promise<ActionResult<{
  alunos: RematriculaAluno[]
  seriesOrdem: Record<string, number>
}>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const anoAtual = anoDestino - 1

    // Buscar séries escolares para determinar próxima série
    const { data: seriesData } = await supabase
      .from('series_escolares')
      .select('*')
      .eq('escola_id', escolaId)
      .eq('ativo', true)
      .order('ordem')
    const series = seriesData ?? []
    const seriesOrdem: Record<string, number> = {}
    for (const s of series) seriesOrdem[s.nome] = s.ordem

    function getProximaSerie(serieAtual: string): string {
      const ordemAtual = seriesOrdem[serieAtual]
      if (ordemAtual === undefined) return serieAtual
      const proxima = series.find((s) => s.ordem === ordemAtual + 1)
      return proxima?.nome ?? serieAtual
    }

    // Buscar turmas do ano atual e destino
    const { data: turmasAtuais } = await supabase
      .from('turmas')
      .select('*')
      .eq('ano_letivo', anoAtual)
      .eq('ativa', true)
    const { data: turmasDestino } = await supabase
      .from('turmas')
      .select('*')
      .eq('ano_letivo', anoDestino)
      .eq('ativa', true)
    const turmasDestinoMap = new Map(turmasDestino?.map((t) => [t.serie, t]) ?? [])

    // Buscar matrículas ativas do ano atual
    const { data: matriculas } = await supabase
      .from('matriculas')
      .select('*, alunos!inner(nome_completo, status), turmas!inner(codigo, serie)')
      .in('turma_id', turmasAtuais?.map((t) => t.id) ?? [])
      .eq('status', 'ativa')

    if (!matriculas || matriculas.length === 0) return { data: { alunos: [], seriesOrdem }, error: null }

    // Buscar históricos do ano atual
    const alunoIds = [...new Set(matriculas.map((m) => m.aluno_id))]
    const { data: historicos } = await supabase
      .from('historico_escolar')
      .select('*')
      .in('aluno_id', alunoIds)
      .eq('ano_letivo', anoAtual)

    // Buscar matrículas já existentes no ano destino
    const { data: matriculasDestino } = await supabase
      .from('matriculas')
      .select('aluno_id')
      .in('aluno_id', alunoIds)
      .in('turma_id', turmasDestino?.map((t) => t.id) ?? [])

    const jaRematriculados = new Set(matriculasDestino?.map((m) => m.aluno_id) ?? [])
    const historicoMap = new Map(historicos?.map((h) => [h.aluno_id, h.situacao]) ?? [])

    const alunos: RematriculaAluno[] = matriculas
      .filter((m) => {
        const alunoStatus = (m.alunos as unknown as { status: string }).status
        return !['transferido', 'inativo'].includes(alunoStatus)
      })
      .map((m) => {
        const turmaAtual = m.turmas as unknown as { codigo: string; serie: string }
        const hist = historicoMap.get(m.aluno_id) as string | undefined
        let situacao: 'aprovado' | 'reprovado' | 'pendente' = 'pendente'
        if (hist === 'aprovado') situacao = 'aprovado'
        else if (hist === 'reprovado') situacao = 'reprovado'

        let serieSugerida = turmaAtual.serie
        if (situacao === 'aprovado') {
          serieSugerida = getProximaSerie(turmaAtual.serie)
        }

        const turmaSugerida = turmasDestinoMap.get(serieSugerida)

        return {
          matriculaId: m.id,
          alunoId: m.aluno_id,
          alunoNome: (m.alunos as unknown as { nome_completo: string }).nome_completo,
          turmaAtualId: m.turma_id,
          turmaAtualCodigo: turmaAtual.codigo,
          serieAtual: turmaAtual.serie,
          situacao,
          serieSugerida,
          turmaSugeridaId: turmaSugerida?.id ?? null,
          turmaSugeridaCodigo: turmaSugerida ? `${turmaSugerida.codigo} — ${turmaSugerida.serie}` : `[Criar turma: ${serieSugerida}]`,
          jaRematriculado: jaRematriculados.has(m.aluno_id),
        }
      })

    return { data: { alunos, seriesOrdem }, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar candidatos' }
  }
}

export async function processarRematricula(
  alunos: { alunoId: string; turmaId: string; serieSugerida: string }[],
  anoDestino: number
): Promise<ActionResult<{ processados: number }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    let processados = 0
    for (const a of alunos) {
      if (!a.turmaId) continue

      // Verificar se já existe matrícula para o ano destino
      const { data: existente } = await supabase
        .from('matriculas')
        .select('id')
        .eq('aluno_id', a.alunoId)
        .eq('turma_id', a.turmaId)
        .maybeSingle()

      if (existente) continue

      await supabase.from('matriculas').insert({
        aluno_id: a.alunoId,
        turma_id: a.turmaId,
        data_matricula: `${anoDestino}-01-01`,
        status: 'ativa',
      })
      processados++
    }

    revalidatePath('/secretaria/rematricula')
    return { data: { processados }, error: null }
  } catch {
    return { data: null, error: 'Erro ao processar rematrícula' }
  }
}
