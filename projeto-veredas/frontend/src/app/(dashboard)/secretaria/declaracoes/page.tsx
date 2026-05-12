'use client'

import { useEffect, useState } from 'react'
import { listarAlunos } from '@/lib/actions/alunos'
import { getMatricula } from '@/lib/actions/matriculas'
import { getTurma } from '@/lib/actions/turmas'
import { useSchool } from '@/hooks/useSchool'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Download, Search } from 'lucide-react'
import type { Aluno } from '@/types/entities'

export default function DeclaracoesPage() {
  const { config } = useSchool()

  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAlunoId, setSelectedAlunoId] = useState('')
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null)
  const [declaracaoData, setDeclaracaoData] = useState<{
    matricula: string
    turmaCodigo: string
    turmaSerie: string
    turmaTurno: string
    anoLetivo: number
  } | null>(null)
  const [isLoadingDeclaracao, setIsLoadingDeclaracao] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

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

  useEffect(() => {
    if (!selectedAlunoId) {
      setSelectedAluno(null)
      setDeclaracaoData(null)
      return
    }

    async function loadDeclaracao() {
      setIsLoadingDeclaracao(true)
      setError(null)

      const aluno = alunos.find((a) => a.id === selectedAlunoId)
      if (!aluno) { setError('Aluno não encontrado'); setIsLoadingDeclaracao(false); return }
      setSelectedAluno(aluno)

      // Find active matricula
      const { listarMatriculas } = await import('@/lib/actions/matriculas')
      const matRes = await listarMatriculas({ status: 'ativa' })
      if (matRes.error) { setError(matRes.error); setIsLoadingDeclaracao(false); return }

      const matriculas = (matRes.data ?? []) as unknown as Array<Record<string, unknown>>
      const matricula = matriculas.find((m) => m.aluno_id === selectedAlunoId)

      if (!matricula) {
        setError('Aluno não possui matrícula ativa.')
        setDeclaracaoData(null)
        setIsLoadingDeclaracao(false)
        return
      }

      // Get turma info
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
      setIsLoadingDeclaracao(false)
    }
    loadDeclaracao()
  }, [selectedAlunoId, alunos])

  async function handleDownloadPDF() {
    if (!selectedAluno || !declaracaoData) return
    setIsGeneratingPDF(true)
    setError(null)
    try {
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
    } catch {
      setError('Erro ao gerar PDF')
    }
    setIsGeneratingPDF(false)
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Declarações de Matrícula</h1>
        <p className="text-sm text-gray-500 mt-1">Selecione o aluno para gerar a declaração de matrícula.</p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

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

      {isLoadingDeclaracao && (
        <p className="text-sm text-gray-400 text-center py-4">Carregando dados do aluno...</p>
      )}

      {selectedAluno && declaracaoData && !isLoadingDeclaracao && (
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

      {!selectedAlunoId && !isLoading && (
        <p className="text-sm text-gray-500 text-center py-8">
          <Search size={40} className="mx-auto mb-2 text-gray-300" />
          Selecione um aluno acima para gerar a declaração.
        </p>
      )}
    </div>
  )
}
