'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { listarDiarios, gerarDiario, getDiario } from '@/lib/actions/aulas'
import { getFuncionarioByUser, getTurmasDoProfessor } from '@/lib/actions/academico'
import { listarPeriodos } from '@/lib/actions/periodos'
import { useSchool } from '@/hooks/useSchool'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Download } from 'lucide-react'
import type { PeriodoLetivo } from '@/types/entities'

interface Diario {
  id: string
  turma_disciplina_id: string
  periodo_id: string
  data_geracao: string
  pdf_url: string | null
  conteudo_json?: Record<string, unknown>
}

function ProfessorDiariosPage() {
  const searchParams = useSearchParams()
  const turmaFilter = searchParams.get('turma') ?? ''
  const { config } = useSchool()

  const [diarios, setDiarios] = useState<Diario[]>([])
  const [turmas, setTurmas] = useState<Array<{ value: string; label: string }>>([])
  const [periodos, setPeriodos] = useState<PeriodoLetivo[]>([])
  const [selectedTurma, setSelectedTurma] = useState(turmaFilter)
  const [selectedPeriodo, setSelectedPeriodo] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fetchData = useCallback(async () => {
    if (!selectedTurma) { setIsLoading(false); return }
    setIsLoading(true)
    setError(null)
    const result = await listarDiarios({ turma_disciplina_id: selectedTurma })
    if (result.error) setError(result.error)
    else setDiarios(result.data ?? [])
    setIsLoading(false)
  }, [selectedTurma])

  useEffect(() => {
    async function load() {
      const [funcRes, perRes] = await Promise.all([
        getFuncionarioByUser(),
        listarPeriodos(),
      ])
      if (perRes.data) setPeriodos(perRes.data)

      if (funcRes.error || !funcRes.data) return
      const turmasRes = await getTurmasDoProfessor(funcRes.data.id)
      if (turmasRes.data) {
        setTurmas((turmasRes.data ?? []).map((t: Record<string, unknown>) => ({
          value: t.id as string,
          label: `${t.turma_codigo as string} - ${t.turma_serie as string} - ${t.disciplina_nome as string}`,
        })))
      }
    }
    load()
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleGerarDiario() {
    if (!selectedTurma || !selectedPeriodo) {
      setError('Selecione a turma e o período.')
      return
    }
    setIsGenerating(true)
    setError(null)
    setSuccess(false)
    const result = await gerarDiario(selectedTurma, selectedPeriodo)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      fetchData()
      setTimeout(() => setSuccess(false), 3000)
    }
    setIsGenerating(false)
  }

  async function handleDownloadDiario(diario: Diario) {
    setIsDownloading(true)
    setError(null)
    try {
      // Get full diario data including conteudo_json
      const diarioRes = await getDiario(diario.id)
      if (diarioRes.error || !diarioRes.data) {
        setError(diarioRes.error ?? 'Erro ao carregar diário')
        setIsDownloading(false)
        return
      }

      const fullDiario = diarioRes.data as Record<string, unknown>
      const conteudo = fullDiario.conteudo_json as Record<string, unknown> | undefined

      if (!conteudo) {
        setError('Diário sem conteúdo. Gere o diário novamente.')
        setIsDownloading(false)
        return
      }

      // Get periodo name
      const periodo = periodos.find((p) => p.id === diario.periodo_id)
      const turmaLabel = turmas.find((t) => t.value === diario.turma_disciplina_id)?.label ?? ''

      // Build alunosNomes map by fetching from turma
      const { getAlunosDaTurma } = await import('@/lib/actions/academico')
      const turmaInfo = (await getTurmasDoProfessor(
        (await import('@/lib/actions/academico').then(m => m.getFuncionarioByUser())).data?.id ?? ''
      )).data?.find((t: Record<string, unknown>) => t.id === diario.turma_disciplina_id) as Record<string, unknown> | undefined

      let alunosNomes: Record<string, string> = {}
      if (turmaInfo) {
        const alunosRes = await getAlunosDaTurma(turmaInfo.turma_id as string)
        if (alunosRes.data) {
          for (const a of alunosRes.data as Array<Record<string, unknown>>) {
            alunosNomes[a.matricula_id as string] = a.nome_completo as string
          }
        }
      }

      const { gerarDiarioPDF } = await import('@/lib/pdf/diario')
      const doc = gerarDiarioPDF({
        schoolName: config?.nome ?? 'Escola',
        turmaCodigo: turmaLabel.split(' - ')[0] ?? '',
        turmaSerie: turmaLabel.split(' - ')[1] ?? '',
        disciplinaNome: turmaLabel.split(' - ').slice(2).join(' - ') ?? '',
        periodoNome: periodo ? `${periodo.nome} ${periodo.ano_letivo}` : '',
        dataGeracao: new Date(diario.data_geracao).toLocaleString('pt-BR'),
        conteudo: {
          aulas: (conteudo.aulas ?? []) as DiarioPDFConteudo['aulas'],
          notas: (conteudo.notas ?? []) as DiarioPDFConteudo['notas'],
          frequencias: (conteudo.frequencias ?? []) as DiarioPDFConteudo['frequencias'],
          planejamentos: (conteudo.planejamentos ?? []) as DiarioPDFConteudo['planejamentos'],
        },
        alunosNomes,
      })
      doc.save(`diario-classe-${turmaLabel.split(' - ')[0] ?? 'turma'}-${periodo?.nome ?? 'periodo'}.pdf`)
    } catch {
      setError('Erro ao gerar PDF do diário')
    }
    setIsDownloading(false)
  }

  type DiarioPDFConteudo = {
    aulas: Array<{ data_aula: string; conteudo: string; observacoes?: string | null; carga_horaria_minutos: number }>
    notas: Array<{ matricula_id: string; valor: number; tipo: string }>
    frequencias: Array<{ matricula_id: string; data_aula: string; presenca: boolean }>
    planejamentos: Array<{ semana_inicio: string; conteudo_planejado: string; objetivos?: string | null; metodologia?: string | null; recursos?: string | null }>
  }

  const columns: Column<Diario>[] = [
    {
      key: 'data_geracao', label: 'Gerado em', sortable: true,
      render: (row) => row.data_geracao ? new Date(row.data_geracao).toLocaleString('pt-BR') : '—',
    },
    {
      key: 'periodo_id', label: 'Período',
      render: (row) => {
        const p = periodos.find((per) => per.id === row.periodo_id)
        return p ? `${p.nome} ${p.ano_letivo}` : '—'
      },
    },
    {
      key: 'acoes', label: 'PDF',
      render: (row) => (
        <Button variant="outline" size="sm" onClick={() => handleDownloadDiario(row)} disabled={isDownloading}>
          <Download size={14} /> Baixar
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Diários de Classe</h1>
        <p className="text-sm text-gray-500 mt-1">Visualize e gere diários de classe por turma e período.</p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {success && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4 text-sm text-green-700">Diário gerado com sucesso!</CardContent>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <Select
          label="Turma / Disciplina"
          options={[{ value: '', label: 'Selecione...' }, ...turmas]}
          value={selectedTurma}
          onChange={(e) => setSelectedTurma(e.target.value)}
          className="w-full max-w-md"
        />
        <Select
          label="Período"
          options={[{ value: '', label: 'Selecione...' }, ...periodos.map((p) => ({ value: p.id, label: `${p.nome} ${p.ano_letivo}` }))]}
          value={selectedPeriodo}
          onChange={(e) => setSelectedPeriodo(e.target.value)}
          className="w-56"
        />
        <Button
          onClick={handleGerarDiario}
          isLoading={isGenerating}
          disabled={!selectedTurma || !selectedPeriodo}
        >
          <Plus size={18} /> Gerar Diário
        </Button>
      </div>

      {selectedTurma ? (
        <DataTable
          columns={columns}
          data={diarios}
          keyExtractor={(row) => row.id}
          searchable={false}
          isLoading={isLoading}
          emptyMessage="Nenhum diário gerado para esta turma."
        />
      ) : (
        <p className="text-sm text-gray-500">Selecione uma turma acima para ver os diários.</p>
      )}
    </div>
  )
}

export default function ProfessorDiariosPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-400">Carregando...</div>}>
      <ProfessorDiariosPage />
    </Suspense>
  )
}
