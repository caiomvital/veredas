'use client'

import { useEffect, useState } from 'react'
import { listarDiariosCoordenador, getDiario } from '@/lib/actions/aulas'
import { getAlunosDaTurma } from '@/lib/actions/academico'
import { useSchool } from '@/hooks/useSchool'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Card, CardContent } from '@/components/ui/card'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DiarioEnriched {
  id: string
  turma_disciplina_id: string
  periodo_id: string
  data_geracao: string
  pdf_url: string | null
  turma_codigo: string
  turma_serie: string
  disciplina_nome: string
  periodo_nome: string
  turma_id: string
}

type DiarioPDFConteudo = {
  aulas: Array<{ data_aula: string; conteudo: string; observacoes?: string | null; carga_horaria_minutos: number }>
  notas: Array<{ matricula_id: string; valor: number; tipo: string }>
  frequencias: Array<{ matricula_id: string; data_aula: string; presenca: boolean }>
  planejamentos: Array<{ semana_inicio: string; conteudo_planejado: string; objetivos?: string | null; metodologia?: string | null; recursos?: string | null }>
}

export default function CoordenadorDiariosPage() {
  const { config } = useSchool()
  const [diarios, setDiarios] = useState<DiarioEnriched[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      const result = await listarDiariosCoordenador()
      if (result.error) setError(result.error)
      else setDiarios((result.data ?? []) as DiarioEnriched[])
      setIsLoading(false)
    }
    load()
  }, [])

  async function handleDownloadDiario(diario: DiarioEnriched) {
    setIsDownloading(true)
    setError(null)
    try {
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

      // Build alunosNomes map
      let alunosNomes: Record<string, string> = {}
      if (diario.turma_id) {
        const alunosRes = await getAlunosDaTurma(diario.turma_id)
        if (alunosRes.data) {
          for (const a of alunosRes.data as Array<Record<string, unknown>>) {
            alunosNomes[a.matricula_id as string] = a.nome_completo as string
          }
        }
      }

      const { gerarDiarioPDF } = await import('@/lib/pdf/diario')
      const doc = gerarDiarioPDF({
        schoolName: config?.nome ?? 'Escola',
        turmaCodigo: diario.turma_codigo,
        turmaSerie: diario.turma_serie,
        disciplinaNome: diario.disciplina_nome,
        periodoNome: diario.periodo_nome,
        dataGeracao: new Date(diario.data_geracao).toLocaleString('pt-BR'),
        conteudo: {
          aulas: (conteudo.aulas ?? []) as DiarioPDFConteudo['aulas'],
          notas: (conteudo.notas ?? []) as DiarioPDFConteudo['notas'],
          frequencias: (conteudo.frequencias ?? []) as DiarioPDFConteudo['frequencias'],
          planejamentos: (conteudo.planejamentos ?? []) as DiarioPDFConteudo['planejamentos'],
        },
        alunosNomes,
      })
      doc.save(`diario-classe-${diario.turma_codigo}-${diario.periodo_nome}.pdf`)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Erro ao gerar PDF do diário')
    }
    setIsDownloading(false)
  }

  const columns: Column<DiarioEnriched>[] = [
    { key: 'turma_codigo', label: 'Turma', sortable: true },
    { key: 'turma_serie', label: 'Série' },
    { key: 'disciplina_nome', label: 'Disciplina', sortable: true },
    { key: 'periodo_nome', label: 'Período' },
    {
      key: 'data_geracao', label: 'Gerado em', sortable: true,
      render: (row) => row.data_geracao ? new Date(row.data_geracao).toLocaleString('pt-BR') : '—',
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
        <p className="text-sm text-gray-500 mt-1">Acompanhamento dos diários gerados pelos professores.</p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {success && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4 text-sm text-green-700">PDF baixado com sucesso!</CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={diarios}
        keyExtractor={(row) => row.id}
        searchKeys={['turma_codigo', 'turma_serie', 'disciplina_nome']}
        searchPlaceholder="Buscar por turma, série ou disciplina..."
        isLoading={isLoading}
        emptyMessage="Nenhum diário encontrado."
      />
    </div>
  )
}
