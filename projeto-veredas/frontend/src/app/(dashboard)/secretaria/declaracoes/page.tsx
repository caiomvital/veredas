'use client'

import { useEffect, useState } from 'react'
import { listarAlunos } from '@/lib/actions/alunos'
import { getTurma } from '@/lib/actions/turmas'
import { useSchool } from '@/hooks/useSchool'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Download, Search, FileText } from 'lucide-react'
import type { Aluno } from '@/types/entities'

type TabType = 'matricula' | 'frequencia'

export default function DeclaracoesPage() {
  const { config } = useSchool()
  const [tab, setTab] = useState<TabType>('matricula')

  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAlunoId, setSelectedAlunoId] = useState('')
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null)
  const [isLoadingDeclaracao, setIsLoadingDeclaracao] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Matrícula data
  const [declaracaoData, setDeclaracaoData] = useState<{
    matricula: string
    turmaCodigo: string
    turmaSerie: string
    turmaTurno: string
    anoLetivo: number
  } | null>(null)

  // Frequência data
  const [periodos, setPeriodos] = useState<{ id: string; nome: string }[]>([])
  const [selectedPeriodoId, setSelectedPeriodoId] = useState('')
  const [frequenciaData, setFrequenciaData] = useState<{
    totalAulas: number
    totalPresencas: number
    totalFaltas: number
    frequenciaPct: number
    periodoNome: string
    turmaCodigo: string
    turmaSerie: string
    turmaTurno: string
    anoLetivo: number
    matricula: string
  } | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      const result = await listarAlunos()
      if (result.error) setError(result.error)
      else setAlunos(result.data ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  // Load periodos for frequency tab
  useEffect(() => {
    if (tab !== 'frequencia') return
    async function loadPeriodos() {
      const { listarPeriodos } = await import('@/lib/actions/periodos')
      const res = await listarPeriodos()
      if (!res.error) setPeriodos(res.data?.map((p: any) => ({ id: p.id, nome: p.nome })) ?? [])
    }
    loadPeriodos()
  }, [tab])

  useEffect(() => {
    if (!selectedAlunoId) {
      setSelectedAluno(null)
      setDeclaracaoData(null)
      setFrequenciaData(null)
      return
    }

    const aluno = alunos.find((a) => a.id === selectedAlunoId)
    if (!aluno) { setError('Aluno não encontrado'); setIsLoadingDeclaracao(false); return }
    setSelectedAluno(aluno)

    if (tab === 'matricula') {
      loadMatriculaData(aluno)
    } else {
      loadFrequenciaData(aluno)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAlunoId, alunos, tab])

  async function loadMatriculaData(aluno: Aluno) {
    setIsLoadingDeclaracao(true)
    setError(null)
    try {
      const { listarMatriculas } = await import('@/lib/actions/matriculas')
      const matRes = await listarMatriculas({ status: 'ativa' })
      if (matRes.error) { setError(matRes.error); setIsLoadingDeclaracao(false); return }

      const matriculas = (matRes.data ?? []) as unknown as Array<Record<string, unknown>>
      const matricula = matriculas.find((m) => m.aluno_id === aluno.id)
      if (!matricula) {
        setError('Aluno não possui matrícula ativa.')
        setDeclaracaoData(null)
        setIsLoadingDeclaracao(false)
        return
      }

      const turmaRes = await getTurma(matricula.turma_id as string)
      if (turmaRes.error || !turmaRes.data) {
        setError(turmaRes.error ?? 'Erro ao carregar turma')
        setIsLoadingDeclaracao(false)
        return
      }

      const turma = turmaRes.data as unknown as Record<string, unknown>
      setDeclaracaoData({
        matricula: (matricula.id as string).slice(0, 8),
        turmaCodigo: turma.codigo as string,
        turmaSerie: turma.serie as string,
        turmaTurno: turma.turno as string,
        anoLetivo: turma.ano_letivo as number,
      })
    } catch {
      setError('Erro ao carregar dados')
    }
    setIsLoadingDeclaracao(false)
  }

  async function loadFrequenciaData(aluno: Aluno) {
    setIsLoadingDeclaracao(true)
    setError(null)
    try {
      const { getTurmasDoProfessor } = await import('@/lib/actions/academico')
      const { listarMatriculas } = await import('@/lib/actions/matriculas')

      const matRes = await listarMatriculas({ status: 'ativa' })
      if (matRes.error) { setError(matRes.error); setIsLoadingDeclaracao(false); return }

      const matriculas = (matRes.data ?? []) as unknown as Array<Record<string, unknown>>
      const matricula = matriculas.find((m) => m.aluno_id === aluno.id)
      if (!matricula) {
        setError('Aluno não possui matrícula ativa.')
        setIsLoadingDeclaracao(false)
        return
      }

      const supabase = (await import('@/lib/supabase/client')).createClient
      const client = supabase()

      let query = client.from('frequencias').select('presenca').eq('matricula_id', matricula.id as string)
      if (selectedPeriodoId) {
        // Filter by periodo - join with turma_disciplina_professor and then to periodos via registro_aulas or notas
        // Simpler: get only aulas within periodo's date range
        const { data: periodo } = await client.from('periodos_letivos').select('data_inicio, data_fim, nome').eq('id', selectedPeriodoId).single() as unknown as { data: { data_inicio: string; data_fim: string; nome: string } | null; error: any }
        if (periodo) {
          query = query.gte('data_aula', periodo.data_inicio).lte('data_aula', periodo.data_fim)
        }
      }

      const { data: freqData } = await query
      const totalAulas = freqData?.length ?? 0
      const totalPresencas = freqData?.filter((f: any) => f.presenca).length ?? 0
      const totalFaltas = totalAulas - totalPresencas
      const frequenciaPct = totalAulas > 0 ? Math.round((totalPresencas / totalAulas) * 1000) / 10 : 0

      // Get turma info
      const turmaRes = await getTurma(matricula.turma_id as string)
      const turma = turmaRes.data as unknown as Record<string, unknown> | undefined

      // Get periodo name
      let periodoNome = 'Período Letivo'
      if (selectedPeriodoId) {
        const { data: p } = await client.from('periodos_letivos').select('nome').eq('id', selectedPeriodoId).single() as unknown as { data: { nome: string } | null; error: any }
        if (p) periodoNome = p.nome
      } else {
        periodoNome = 'Ano Letivo Completo'
      }

      setFrequenciaData({
        totalAulas,
        totalPresencas,
        totalFaltas,
        frequenciaPct,
        periodoNome,
        turmaCodigo: (turma?.codigo as string) ?? '',
        turmaSerie: (turma?.serie as string) ?? '',
        turmaTurno: (turma?.turno as string) ?? '',
        anoLetivo: (turma?.ano_letivo as number) ?? new Date().getFullYear(),
        matricula: (matricula.id as string).slice(0, 8),
      })
    } catch {
      setError('Erro ao carregar frequência')
    }
    setIsLoadingDeclaracao(false)
  }

  async function handleDownloadPDF() {
    if (!selectedAluno) return
    setIsGeneratingPDF(true)
    setError(null)
    try {
      if (tab === 'matricula' && declaracaoData) {
        const { gerarDeclaracaoPDF } = await import('@/lib/pdf/declaracao')
        const endereco = config?.endereco as Record<string, string> | undefined
        const doc = gerarDeclaracaoPDF({
          schoolName: config?.nome ?? 'Escola',
          schoolCnpj: config?.cnpj ?? undefined,
          schoolEndereco: endereco ? {
            rua: endereco.rua,
            numero: endereco.numero,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            uf: endereco.uf,
          } : undefined,
          templateDeclaracao: (config?.textos as Record<string, string> | undefined)?.template_declaracao ?? undefined,
          alunoNome: selectedAluno.nome_completo,
          alunoMatricula: selectedAluno.matricula,
          turmaCodigo: declaracaoData.turmaCodigo,
          turmaSerie: declaracaoData.turmaSerie,
          turmaTurno: declaracaoData.turmaTurno,
          anoLetivo: declaracaoData.anoLetivo,
          dataAtual: new Date().toLocaleDateString('pt-BR'),
          nomeMae: selectedAluno.nome_mae ?? undefined,
        })
        doc.save(`declaracao-matricula-${selectedAluno.matricula}.pdf`)
      } else if (tab === 'frequencia' && frequenciaData) {
        const { gerarDeclaracaoFrequenciaPDF } = await import('@/lib/pdf/declaracao-frequencia')
        const endereco = config?.endereco as Record<string, string> | undefined
        const doc = gerarDeclaracaoFrequenciaPDF({
          schoolName: config?.nome ?? 'Escola',
          schoolCnpj: config?.cnpj ?? undefined,
          schoolEndereco: endereco ? {
            rua: endereco.rua,
            numero: endereco.numero,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            uf: endereco.uf,
          } : undefined,
          alunoNome: selectedAluno.nome_completo,
          alunoMatricula: selectedAluno.matricula,
          turmaCodigo: frequenciaData.turmaCodigo,
          turmaSerie: frequenciaData.turmaSerie,
          turmaTurno: frequenciaData.turmaTurno,
          anoLetivo: frequenciaData.anoLetivo,
          periodoNome: frequenciaData.periodoNome,
          totalAulas: frequenciaData.totalAulas,
          totalPresencas: frequenciaData.totalPresencas,
          totalFaltas: frequenciaData.totalFaltas,
          frequenciaPct: frequenciaData.frequenciaPct,
          dataAtual: new Date().toLocaleDateString('pt-BR'),
        })
        doc.save(`declaracao-frequencia-${selectedAluno.matricula}.pdf`)
      }
    } catch {
      setError('Erro ao gerar PDF')
    }
    setIsGeneratingPDF(false)
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Declarações</h1>
        <p className="text-sm text-gray-500 mt-1">Selecione o tipo de declaração e o aluno.</p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([{ key: 'matricula', label: 'Matrícula' }, { key: 'frequencia', label: 'Frequência' }] as const).map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setError(null); setFrequenciaData(null); setDeclaracaoData(null) }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t.key ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            <FileText size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Aluno Select */}
      <div className="mb-6">
        <Select
          label="Aluno"
          placeholder="Selecione um aluno..."
          options={alunos
            .filter((a) => a.status === 'ativo')
            .map((a) => ({ value: a.id, label: `${a.nome_completo} (${a.matricula})` }))}
          value={selectedAlunoId}
          onChange={(e) => setSelectedAlunoId(e.target.value)}
        />
      </div>

      {/* Periodo Select (frequencia only) */}
      {tab === 'frequencia' && selectedAlunoId && (
        <div className="mb-6">
          <Select
            label="Período (opcional)"
            placeholder="Ano Letivo Completo"
            options={periodos.map((p) => ({ value: p.id, label: p.nome }))}
            value={selectedPeriodoId}
            onChange={(e) => setSelectedPeriodoId(e.target.value)}
          />
        </div>
      )}

      {isLoadingDeclaracao && (
        <p className="text-sm text-gray-400 text-center py-4">Carregando dados do aluno...</p>
      )}

      {/* Load data when periodo changes */}
      {tab === 'frequencia' && selectedAluno && selectedAlunoId && (
        <div className="mb-4">
          <Button size="sm" variant="outline" onClick={() => loadFrequenciaData(selectedAluno)} isLoading={isLoadingDeclaracao}>
            Carregar Frequência
          </Button>
        </div>
      )}

      {/* Matrícula Data */}
      {tab === 'matricula' && selectedAluno && declaracaoData && !isLoadingDeclaracao && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-[var(--color-primary-800)] mb-4">Dados do Aluno</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Nome:</dt>
                <dd className="font-medium text-gray-800">{selectedAluno.nome_completo}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Matrícula:</dt>
                <dd className="font-medium text-gray-800">{selectedAluno.matricula}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Turma:</dt>
                <dd className="font-medium text-gray-800">{declaracaoData.turmaCodigo} - {declaracaoData.turmaSerie}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Turno:</dt>
                <dd className="font-medium text-gray-800 capitalize">{declaracaoData.turmaTurno}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Ano Letivo:</dt>
                <dd className="font-medium text-gray-800">{declaracaoData.anoLetivo}</dd>
              </div>
              {selectedAluno.nome_mae && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Mãe:</dt>
                  <dd className="font-medium text-gray-800">{selectedAluno.nome_mae}</dd>
                </div>
              )}
            </dl>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleDownloadPDF} isLoading={isGeneratingPDF}>
                <Download size={18} /> Baixar PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frequência Data */}
      {tab === 'frequencia' && selectedAluno && frequenciaData && !isLoadingDeclaracao && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-[var(--color-primary-800)] mb-4">Dados de Frequência</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Nome:</dt>
                <dd className="font-medium text-gray-800">{selectedAluno.nome_completo}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Matrícula:</dt>
                <dd className="font-medium text-gray-800">{selectedAluno.matricula}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Turma:</dt>
                <dd className="font-medium text-gray-800">{frequenciaData.turmaCodigo} - {frequenciaData.turmaSerie}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Período:</dt>
                <dd className="font-medium text-gray-800">{frequenciaData.periodoNome}</dd>
              </div>
              <div className="border-t border-gray-100 my-2" />
              <div className="flex justify-between">
                <dt className="text-gray-500">Total de Aulas:</dt>
                <dd className="font-medium text-gray-800">{frequenciaData.totalAulas}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Presenças:</dt>
                <dd className="font-medium text-green-700">{frequenciaData.totalPresencas}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Faltas:</dt>
                <dd className="font-medium text-red-600">{frequenciaData.totalFaltas}</dd>
              </div>
              <div className="flex justify-between text-base pt-1">
                <dt className="text-gray-600 font-medium">Frequência:</dt>
                <dd className={`font-bold ${frequenciaData.frequenciaPct >= 75 ? 'text-green-700' : 'text-red-600'}`}>
                  {frequenciaData.frequenciaPct.toFixed(1)}%
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleDownloadPDF} isLoading={isGeneratingPDF}>
                <Download size={18} /> Baixar PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedAlunoId && !isLoading && (
        <p className="text-sm text-gray-500 text-center py-8">
          <Search size={40} className="mx-auto mb-2 text-gray-300" />
          Selecione um aluno acima para gerar a declaração.
        </p>
      )}
    </div>
  )
}
