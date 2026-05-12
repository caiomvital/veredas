'use client'

import { useEffect, useState } from 'react'
import { listarAlunos } from '@/lib/actions/alunos'
import { realizarTransferencia } from '@/lib/actions/transferencia'
import { useSchool } from '@/hooks/useSchool'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge, statusBadge } from '@/components/ui/badge'
import { Download, AlertTriangle, Search } from 'lucide-react'
import type { Aluno, Matricula, Turma } from '@/types/entities'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export default function TransferenciaPage() {
  const { config } = useSchool()

  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [isLoadingAlunos, setIsLoadingAlunos] = useState(true)
  const [selectedAlunoId, setSelectedAlunoId] = useState('')

  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [matricula, setMatricula] = useState<Matricula | null>(null)
  const [turma, setTurma] = useState<Turma | null>(null)
  const [jaTransferido, setJaTransferido] = useState(false)
  const [isFirstTransfer, setIsFirstTransfer] = useState(true)

  const [isLoadingDados, setIsLoadingDados] = useState(false)
  const [isTransferindo, setIsTransferindo] = useState(false)
  const [isGerandoPDF, setIsGerandoPDF] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoadingAlunos(true)
      setError(null)
      const result = await listarAlunos()
      if (result.error) setError(result.error)
      else setAlunos(result.data ?? [])
      setIsLoadingAlunos(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedAlunoId) {
      setAluno(null)
      setMatricula(null)
      setTurma(null)
      setJaTransferido(false)
      return
    }

    async function load() {
      setIsLoadingDados(true)
      setError(null)
      setSuccess(null)

      const alunoData = alunos.find((a) => a.id === selectedAlunoId)
      if (!alunoData) { setError('Aluno não encontrado'); setIsLoadingDados(false); return }
      setAluno(alunoData)
      setJaTransferido(alunoData.status === 'transferido')

      // Get transfer data (read-only)
      const result = await realizarTransferencia(selectedAlunoId)
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setMatricula(result.data.matricula)
        setTurma(result.data.turma)
        setIsFirstTransfer(result.data.isFirstTransfer)
        setJaTransferido(result.data.aluno.status === 'transferido')
        setAluno(result.data.aluno)
      }
      setIsLoadingDados(false)
    }
    load()
  }, [selectedAlunoId, alunos])

  function handleTransferir() {
    if (!aluno || !selectedAlunoId) return
    setShowConfirm(true)
  }

  async function confirmTransferir() {
    if (!aluno || !selectedAlunoId) return

    setIsTransferindo(true)
    setShowConfirm(false)
    setError(null)
    setSuccess(null)

    const result = await realizarTransferencia(selectedAlunoId)
    if (result.error) {
      setError(result.error)
      setIsTransferindo(false)
      return
    }

    if (result.data) {
      setAluno(result.data.aluno)
      setMatricula(result.data.matricula)
      setTurma(result.data.turma)
      setJaTransferido(true)
      setSuccess('Transferência realizada com sucesso!')
      setTimeout(() => setSuccess(null), 5000)

      // Auto-download PDF
      await gerarPDF(result.data.aluno, result.data.matricula, result.data.turma)
    }
    setIsTransferindo(false)
  }

  async function gerarPDF(
    alunoData: Aluno,
    matriculaData: Matricula | null,
    turmaData: Turma | null
  ) {
    setIsGerandoPDF(true)
    setError(null)
    try {
      const { gerarTransferenciaPDF } = await import('@/lib/pdf/transferencia')
      const endereco = config?.endereco as Record<string, string> | undefined
      const doc = gerarTransferenciaPDF({
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
        alunoNome: alunoData.nome_completo,
        alunoMatricula: alunoData.matricula,
        alunoDataNascimento: new Date(alunoData.data_nascimento).toLocaleDateString('pt-BR'),
        nomeMae: alunoData.nome_mae ?? undefined,
        nomePai: alunoData.nome_pai ?? undefined,
        turmaCodigo: turmaData?.codigo ?? '',
        turmaSerie: turmaData?.serie ?? '',
        turmaTurno: turmaData?.turno ?? '',
        anoLetivo: turmaData?.ano_letivo ?? new Date().getFullYear(),
        dataTransferencia: new Date().toLocaleDateString('pt-BR'),
        dataAtual: new Date().toLocaleDateString('pt-BR'),
      })
      doc.save(`declaracao-transferencia-${alunoData.matricula}.pdf`)
    } catch {
      setError('Erro ao gerar PDF')
    }
    setIsGerandoPDF(false)
  }

  async function handleDownloadPDF() {
    if (!aluno) return
    await gerarPDF(aluno, matricula, turma)
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Declaração de Transferência</h1>
        <p className="text-sm text-gray-500 mt-1">Registre a transferência de alunos e gere a declaração.</p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {success && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4 text-sm text-green-700">{success}</CardContent>
        </Card>
      )}

      <div className="mb-6">
        <Select
          label="Aluno"
          placeholder="Selecione um aluno..."
          options={alunos.map((a) => ({ value: a.id, label: `${a.nome_completo} (${a.matricula})` }))}
          value={selectedAlunoId}
          onChange={(e) => setSelectedAlunoId(e.target.value)}
        />
      </div>

      {isLoadingDados && (
        <p className="text-sm text-gray-400 text-center py-4">Carregando dados do aluno...</p>
      )}

      {aluno && !isLoadingDados && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-primary-800)]">Dados do Aluno</h2>
              <Badge variant={statusBadge(aluno.status).variant}>
                {statusBadge(aluno.status).label}
              </Badge>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Nome:</dt>
                <dd className="font-medium text-gray-800">{aluno.nome_completo}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Matrícula:</dt>
                <dd className="font-medium text-gray-800">{aluno.matricula}</dd>
              </div>
              {turma && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Turma:</dt>
                    <dd className="font-medium text-gray-800">{turma.codigo} - {turma.serie}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Turno:</dt>
                    <dd className="font-medium text-gray-800 capitalize">{turma.turno}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Ano Letivo:</dt>
                    <dd className="font-medium text-gray-800">{turma.ano_letivo}</dd>
                  </div>
                </>
              )}
              {aluno.nome_mae && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Mãe:</dt>
                  <dd className="font-medium text-gray-800">{aluno.nome_mae}</dd>
                </div>
              )}
            </dl>

            {jaTransferido && (
              <div className="mt-4 flex items-center gap-2 rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
                <AlertTriangle size={16} />
                Aluno já transferido. Você pode baixar a declaração novamente.
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {!jaTransferido && (
                <Button onClick={handleTransferir} isLoading={isTransferindo} variant="danger">
                  Realizar Transferência
                </Button>
              )}
              <Button onClick={handleDownloadPDF} isLoading={isGerandoPDF}>
                <Download size={18} /> Baixar PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedAlunoId && !isLoadingAlunos && (
        <p className="text-sm text-gray-500 text-center py-8">
          <Search size={40} className="mx-auto mb-2 text-gray-300" />
          Selecione um aluno acima para realizar a transferência.
        </p>
      )}
      <ConfirmDialog
        open={showConfirm}
        title="Confirmar Transferência"
        message={aluno ? `Deseja realmente transferir o(a) aluno(a) ${aluno.nome_completo}?` : ''}
        confirmLabel="Transferir"
        variant="danger"
        isLoading={isTransferindo}
        onConfirm={confirmTransferir}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
