'use client'

import { useEffect, useState, useCallback } from 'react'
import { listarAlunos } from '@/lib/actions/alunos'
import { getDadosContrato } from '@/lib/actions/contrato'
import type { ContratoData } from '@/lib/actions/contrato'
import type { Aluno } from '@/types/entities'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Download, Search, FileText } from 'lucide-react'

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR')
}

function formatCurrency(value: number | null) {
  if (value === null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ContratosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAlunoId, setSelectedAlunoId] = useState('')
  const [contratoData, setContratoData] = useState<ContratoData | null>(null)
  const [isLoadingContrato, setIsLoadingContrato] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  useEffect(() => {
    listarAlunos().then((res) => {
      if (res.error) setError(res.error)
      else setAlunos(res.data ?? [])
      setIsLoading(false)
    })
  }, [])

  const loadContrato = useCallback(async () => {
    if (!selectedAlunoId) { setContratoData(null); return }
    setIsLoadingContrato(true)
    setError(null)
    const res = await getDadosContrato(selectedAlunoId)
    if (res.error) setError(res.error)
    else setContratoData(res.data)
    setIsLoadingContrato(false)
  }, [selectedAlunoId])

  useEffect(() => { loadContrato() }, [loadContrato])

  async function handleGeneratePDF() {
    if (!contratoData) return
    setIsGeneratingPDF(true)
    try {
      const { gerarContratoPDF } = await import('@/lib/pdf/contrato')
      const doc = gerarContratoPDF(contratoData)
      doc.save(`contrato-${contratoData.numeroContrato}.pdf`)
    } catch {
      setError('Erro ao gerar PDF')
    }
    setIsGeneratingPDF(false)
  }

  const d = contratoData

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Contrato de Matrícula</h1>
        <p className="mt-1 text-sm text-gray-500">
          Selecione um aluno para visualizar e gerar o contrato de prestação de serviços educacionais.
        </p>
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

      {isLoadingContrato && (
        <p className="py-8 text-center text-sm text-gray-400">Carregando dados do contrato...</p>
      )}

      {d && !isLoadingContrato && (
        <>
          <div className="mb-6 flex justify-end">
            <Button onClick={handleGeneratePDF} isLoading={isGeneratingPDF}>
              <Download size={18} className="mr-1" /> Gerar Contrato PDF
            </Button>
          </div>

          {/* Preview */}
          <Card className="mb-4">
            <CardContent className="p-6">
              {/* Cabeçalho */}
              <div className="mb-6 text-center">
                <h2 className="text-lg font-bold text-zab-verde">{d.escola.nome}</h2>
                {d.escola.cnpj && <p className="text-xs text-gray-400">CNPJ: {d.escola.cnpj}</p>}
              </div>

              <div className="mb-6 border-t-2 border-zab-verde pt-4 text-center">
                <h3 className="text-base font-bold text-gray-800">CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS</h3>
                <p className="text-xs text-gray-500">Nº {d.numeroContrato}</p>
              </div>

              <Section title="CONTRATADA">
                <p className="text-sm text-gray-700">
                  {d.escola.nome}, CNPJ {d.escola.cnpj ?? '—'}.
                </p>
              </Section>

              {d.responsavel && (
                <Section title="CONTRATANTE">
                  <p className="text-sm text-gray-700">
                    {d.responsavel.nome_completo}, CPF {d.responsavel.cpf}, {d.responsavel.grau_parentesco}.
                  </p>
                </Section>
              )}

              <Section title="DADOS DO ALUNO">
                <div className="grid gap-1 text-sm">
                  <Row label="Nome" value={d.aluno.nome_completo} />
                  <Row label="Matrícula" value={d.aluno.matricula} />
                  <Row label="Nascimento" value={formatDate(d.aluno.data_nascimento)} />
                  <Row label="CPF" value={d.aluno.cpf ?? '—'} />
                  <Row label="Turma" value={`${d.turma.serie} — ${d.turma.codigo}`} />
                  <Row label="Turno" value={d.turma.turno} />
                  <Row label="Ano Letivo" value={String(d.turma.ano_letivo)} />
                </div>
              </Section>

              <Section title="VALOR DA MENSALIDADE">
                <p className="text-sm text-gray-700">{formatCurrency(d.valorMensalidade)}</p>
              </Section>

              {/* Local e data */}
              <div className="my-6 text-center text-sm italic text-gray-500">
                {d.escola.endereco?.cidade as string}, {new Date().toLocaleDateString('pt-BR')}.
              </div>
            </CardContent>
          </Card>

          <div className="mb-8 flex justify-end">
            <Button onClick={handleGeneratePDF} isLoading={isGeneratingPDF}>
              <Download size={18} className="mr-1" /> Gerar Contrato PDF
            </Button>
          </div>
        </>
      )}

      {!selectedAlunoId && !isLoading && (
        <div className="py-16 text-center text-gray-400">
          <FileText size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Selecione um aluno acima para gerar o contrato.</p>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="mb-2 border-b border-gray-200 pb-1 text-sm font-semibold text-zab-verde uppercase tracking-wider">
        {title}
      </h4>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 font-medium text-gray-600">{label}:</span>
      <span className="text-gray-800">{value}</span>
    </div>
  )
}
