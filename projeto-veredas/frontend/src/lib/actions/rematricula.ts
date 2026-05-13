'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'

const NIVEL_ORDER = ['infantil', 'fund1', 'fund2', 'medio']
const NIVEL_LABEL: Record<string, string> = {
  infantil: 'Educação Infantil',
  fund1: 'Ensino Fundamental I',
  fund2: 'Ensino Fundamental II',
  medio: 'Ensino Médio',
}

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
  ehConcluinte: boolean
  semTurmaDisponivel: boolean
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

    // Buscar séries escolares configuradas
    const { data: seriesData } = await supabase
      .from('series_escolares')
      .select('*')
      .eq('escola_id', escolaId)
      .eq('ativo', true)
      .order('ordem')

    const activeSeries: { id: string; nivel: string; nome: string; ordem: number }[] = seriesData ?? []
    const seriesOrdem: Record<string, number> = {}
    for (const s of activeSeries) seriesOrdem[s.nome] = s.ordem

    // Agrupar séries por nível para detectar último ano de cada nível
    const seriesPorNivel = new Map<string, { nome: string; ordem: number }[]>()
    for (const s of activeSeries) {
      if (!seriesPorNivel.has(s.nivel)) seriesPorNivel.set(s.nivel, [])
      seriesPorNivel.get(s.nivel)!.push({ nome: s.nome, ordem: s.ordem })
    }

    // Última série de cada nível
    const ultimaPorNivel = new Map<string, string>()
    for (const [nivel, series] of seriesPorNivel) {
      series.sort((a, b) => b.ordem - a.ordem)
      ultimaPorNivel.set(nivel, series[0].nome)
    }

    // Última série de toda a escola (último nível com maior ordem)
    const todosOsNiveis = [...seriesPorNivel.entries()]
      .map(([nivel, series]) => ({ nivel, ultimaOrdem: Math.max(...series.map(s => s.ordem)), series }))
      .sort((a, b) => b.ultimaOrdem - a.ultimaOrdem)

    // Maior ordem = série final da escola
    let maiorOrdem = -1
    let serieFinalEscola = ''
    for (const s of activeSeries) {
      if (s.ordem > maiorOrdem) {
        maiorOrdem = s.ordem
        serieFinalEscola = s.nome
      }
    }

    function getProximaSerie(serieAtual: string): { serie: string; ehConcluinte: boolean } {
      const ordemAtual = seriesOrdem[serieAtual]
      if (ordemAtual === undefined) return { serie: serieAtual, ehConcluinte: false }

      // Verificar se é a última série da escola
      if (serieAtual === serieFinalEscola) {
        return { serie: 'Concluinte', ehConcluinte: true }
      }

      const proxima = activeSeries.find((s) => s.ordem === ordemAtual + 1)
      if (proxima) return { serie: proxima.nome, ehConcluinte: false }

      // Se não encontrou próxima série (entre níveis), buscar próxima ordem disponível
      const seriesOrdenadas = activeSeries.sort((a, b) => a.ordem - b.ordem)
      for (const s of seriesOrdenadas) {
        if (s.ordem > ordemAtual) return { serie: s.nome, ehConcluinte: false }
      }

      return { serie: 'Concluinte', ehConcluinte: true }
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
        let ehConcluinte = false
        if (situacao === 'aprovado') {
          const prox = getProximaSerie(turmaAtual.serie)
          serieSugerida = prox.serie
          ehConcluinte = prox.ehConcluinte
        }

        const turmaSugerida = turmasDestinoMap.get(serieSugerida)
        const semTurmaDisponivel = !ehConcluinte && !turmaSugerida && serieSugerida !== turmaAtual.serie

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
          turmaSugeridaCodigo: turmaSugerida
            ? `${turmaSugerida.codigo} — ${turmaSugerida.serie}`
            : semTurmaDisponivel
              ? `⚠️ Nenhuma turma em ${turmasDestino?.[0]?.ano_letivo ?? anoDestino} para "${serieSugerida}"`
              : ehConcluinte
                ? 'Concluinte — não requer rematrícula'
                : `[Criar turma: ${serieSugerida}]`,
          jaRematriculado: jaRematriculados.has(m.aluno_id),
          ehConcluinte,
          semTurmaDisponivel,
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
