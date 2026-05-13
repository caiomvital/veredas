'use client'

import { useEffect, useState, useCallback } from 'react'
import { listarAlunos } from '@/lib/actions/alunos'
import { getFichaAluno } from '@/lib/actions/ficha-aluno'
import type { FichaAlunoData } from '@/lib/actions/ficha-aluno'
import type { Aluno } from '@/types/entities'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge, statusBadge } from '@/components/ui/badge'
import { Download, Search, Printer, User } from 'lucide-react'

function formatDate(data: string | null) {
  if (!data) return '—'
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')
}

function calcIdade(dataNasc: string): string {
  const hoje = new Date()
  const nasc = new Date(dataNasc + 'T12:00:00')
  let anos = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--
  return `${anos} ano(s)`
}

export default function FichaAlunoPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAlunoId, setSelectedAlunoId] = useState('')
  const [fichaData, setFichaData] = useState<FichaAlunoData | null>(null)
  const [isLoadingFicha, setIsLoadingFicha] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  useEffect(() => {
    listarAlunos().then((res) => {
      if (res.error) setError(res.error)
      else setAlunos(res.data ?? [])
      setIsLoading(false)
    })
  }, [])

  const loadFicha = useCallback(async () => {
    if (!selectedAlunoId) { setFichaData(null); return }
    setIsLoadingFicha(true)
    setError(null)
    const res = await getFichaAluno(selectedAlunoId)
    if (res.error) setError(res.error)
    else setFichaData(res.data)
    setIsLoadingFicha(false)
  }, [selectedAlunoId])

  useEffect(() => { loadFicha() }, [loadFicha])

  async function handlePrintPDF() {
    if (!fichaData) return
    setIsGeneratingPDF(true)
    setError(null)
    try {
      const { gerarFichaAlunoPDF } = await import('@/lib/pdf/ficha-aluno')
      const doc = gerarFichaAlunoPDF(fichaData)
      doc.save(`ficha-${fichaData.aluno.matricula}.pdf`)
    } catch {
      setError('Erro ao gerar PDF')
    }
    setIsGeneratingPDF(false)
  }

  const a = fichaData?.aluno
  const t = fichaData?.turma
  const m = fichaData?.matricula
  const e = fichaData?.escola

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Ficha Completa do Aluno</h1>
        <p className="mt-1 text-sm text-gray-500">
          Selecione um aluno para visualizar ou imprimir a ficha completa.
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Student selector */}
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

      {isLoadingFicha && (
        <p className="py-8 text-center text-sm text-gray-400">Carregando dados do aluno...</p>
      )}

      {/* Preview */}
      {fichaData && a && !isLoadingFicha && (
        <>
          {/* Print button */}
          <div className="mb-6 flex justify-end">
            <Button onClick={handlePrintPDF} isLoading={isGeneratingPDF}>
              <Printer size={18} className="mr-1" /> Imprimir Ficha
            </Button>
          </div>

          {/* School header */}
          <Card className="mb-6 border-zab-verde/20">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-bold text-zab-verde">{e?.nome}</h2>
              {e?.cnpj && <p className="text-xs text-gray-400">CNPJ: {e.cnpj}</p>}
            </CardContent>
          </Card>

          {/* Dados do Aluno */}
          <Card className="mb-4">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zab-verde-claro text-zab-verde">
                  <User size={22} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">{a.nome_completo}</h3>
                  <p className="text-xs text-gray-400">Nº {a.matricula}</p>
                </div>
              </div>

              <Section title="DADOS DO ALUNO">
                <Row label="Nome Completo" value={a.nome_completo} />
                <Row label="Data de Nascimento" value={`${formatDate(a.data_nascimento)} (${calcIdade(a.data_nascimento)})`} />
                <Row label="CPF" value={a.cpf || '—'} />
                <Row label="RG" value={a.rg ? `${a.rg}${a.orgao_emissor ? ` — ${a.orgao_emissor}` : ''}` : '—'} />
                <Row label="Naturalidade" value={a.naturalidade || '—'} />
              </Section>

              <Section title="DADOS ESCOLARES">
                <Row label="Turma" value={t?.codigo ? `${t.serie} — ${t.codigo}` : '—'} />
                <Row label="Turno" value={t?.turno ? t.turno.charAt(0).toUpperCase() + t.turno.slice(1) : '—'} />
                <Row label="Ano Letivo" value={String(t?.ano_letivo ?? '—')} />
                <Row label="Data da Matrícula" value={formatDate(m?.data_matricula ?? null)} />
                <Row label="Status" value={m?.status === 'ativa' ? 'Ativa' : m?.status || '—'} />
              </Section>

              <Section title="FILIAÇÃO">
                <Row label="Mãe" value={a.nome_mae} />
                <Row label="Pai" value={a.nome_pai || '—'} />
              </Section>

              <Section title="RESPONSÁVEIS VINCULADOS">
                {fichaData.responsaveis.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum responsável vinculado.</p>
                ) : (
                  fichaData.responsaveis.map((r, i) => (
                    <div key={i} className="mb-2 rounded bg-gray-50 p-3 text-sm">
                      <p className="font-medium text-gray-800">
                        {r.grau_parentesco}: {r.nome_completo}
                      </p>
                      <p className="text-xs text-gray-500">CPF: {r.cpf} | Tel: {r.telefone || '—'} | E-mail: {r.email}</p>
                    </div>
                  ))
                )}
              </Section>

              <Section title="ENDEREÇO">
                <Row label="Endereço" value={
                  [a.endereco.rua as string, a.endereco.numero as string, a.endereco.complemento as string, a.endereco.bairro as string]
                    .filter(Boolean).join(', ') || '—'
                } />
                {(a.endereco.cidade as string) && (
                  <Row label="Cidade/UF" value={`${a.endereco.cidade as string}${a.endereco.uf ? ` — ${a.endereco.uf as string}` : ''}`} />
                )}
              </Section>

              <Section title="INFORMAÇÕES DE SAÚDE">
                <Row label="Tipo Sanguíneo" value={a.tipo_sanguineo || '—'} />
                <Row label="Alergias" value={a.alergias || '—'} />
                <Row label="Medicamentos" value={a.medicamentos || '—'} />
                <Row label="Plano de Saúde" value={a.plano_saude || '—'} />
                <Row label="Observações Médicas" value={a.observacoes_medicas || '—'} />
              </Section>

              <Section title="AUTORIZAÇÕES">
                <Row label="Pode sair sozinho" value={a.pode_sair_sozinho ? 'Sim' : 'Não'} />
                <Row label="Autorização de imagem (LGPD)" value={a.lgpd_autorizacao_imagem ? 'Sim' : 'Não'} />
                <Row label="Autorização de dados (LGPD)" value={a.lgpd_autorizacao_dados ? 'Sim' : 'Não'} />
              </Section>
            </CardContent>
          </Card>

          {/* Print button at bottom */}
          <div className="mb-8 flex justify-end">
            <Button onClick={handlePrintPDF} isLoading={isGeneratingPDF}>
              <Printer size={18} className="mr-1" /> Imprimir Ficha
            </Button>
          </div>
        </>
      )}

      {!selectedAlunoId && !isLoading && (
        <div className="py-16 text-center text-gray-400">
          <Search size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Selecione um aluno acima para visualizar a ficha.</p>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h4 className="mb-3 border-b border-gray-200 pb-1 text-sm font-semibold text-zab-verde uppercase tracking-wider">
        {title}
      </h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-2">
      <span className="text-sm font-medium text-gray-600 sm:w-52 shrink-0">{label}:</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  )
}
