'use client'

import { useEffect, useState, useCallback } from 'react'
import { listarAlunos, getAluno } from '@/lib/actions/alunos'
import { listarTurmas } from '@/lib/actions/turmas'
import { listarHistoricos, criarHistorico, atualizarHistorico, excluirHistorico, getHistoricoCompleto } from '@/lib/actions/historico'
import { useSchool } from '@/hooks/useSchool'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Badge, statusBadge } from '@/components/ui/badge'
import { Download, Plus, Pencil, Trash2, Search } from 'lucide-react'
import type { Aluno, HistoricoEscolar, Turma } from '@/types/entities'

interface HistoricoRow extends HistoricoEscolar {
  turma_codigo?: string
  turma_serie?: string
  turma_turno?: string
}

export default function HistoricoPage() {
  const { config } = useSchool()

  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [isLoadingAlunos, setIsLoadingAlunos] = useState(true)
  const [selectedAlunoId, setSelectedAlunoId] = useState('')
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null)

  const [historicos, setHistoricos] = useState<HistoricoRow[]>([])
  const [isLoadingHistoricos, setIsLoadingHistoricos] = useState(false)
  const [isLoadingCompleto, setIsLoadingCompleto] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Inline form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formTurmaId, setFormTurmaId] = useState('')
  const [formAno, setFormAno] = useState(new Date().getFullYear().toString())
  const [formSituacao, setFormSituacao] = useState('aprovado')
  const [formObservacoes, setFormObservacoes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Load alunos and turmas on mount
  useEffect(() => {
    async function load() {
      setIsLoadingAlunos(true)
      const [alunosRes, turmasRes] = await Promise.all([
        listarAlunos(),
        listarTurmas(),
      ])
      if (alunosRes.error) setError(alunosRes.error)
      else setAlunos(alunosRes.data ?? [])
      if (turmasRes.error) setError(turmasRes.error)
      else setTurmas(turmasRes.data ?? [])
      setIsLoadingAlunos(false)
    }
    load()
  }, [])

  // Load historicos when aluno changes
  useEffect(() => {
    if (!selectedAlunoId) {
      setSelectedAluno(null)
      setHistoricos([])
      return
    }

    async function load() {
      setIsLoadingHistoricos(true)
      setError(null)

      const aluno = alunos.find((a) => a.id === selectedAlunoId)
      if (!aluno) { setError('Aluno não encontrado'); setIsLoadingHistoricos(false); return }
      setSelectedAluno(aluno)

      const result = await listarHistoricos(selectedAlunoId)
      if (result.error) setError(result.error)
      else setHistoricos(result.data as HistoricoRow[] ?? [])

      setIsLoadingHistoricos(false)
    }
    load()
  }, [selectedAlunoId, alunos])

  function resetForm() {
    setEditingId(null)
    setFormTurmaId('')
    setFormAno(new Date().getFullYear().toString())
    setFormSituacao('aprovado')
    setFormObservacoes('')
  }

  function startEdit(h: HistoricoRow) {
    setEditingId(h.id)
    setFormTurmaId(h.turma_id)
    setFormAno(String(h.ano_letivo))
    setFormSituacao(h.situacao)
    setFormObservacoes(h.observacoes ?? '')
  }

  async function handleSave() {
    if (!selectedAlunoId || !formTurmaId || !formAno || !formSituacao) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    setIsSaving(true)
    setError(null)

    const fd = new FormData()
    fd.set('aluno_id', selectedAlunoId)
    fd.set('turma_id', formTurmaId)
    fd.set('ano_letivo', formAno)
    fd.set('situacao', formSituacao)
    fd.set('observacoes', formObservacoes)

    const result = editingId
      ? await atualizarHistorico(editingId, fd)
      : await criarHistorico(fd)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(editingId ? 'Registro atualizado!' : 'Registro criado!')
      setTimeout(() => setSuccess(null), 3000)
      resetForm()
      // Refresh list
      const refresh = await listarHistoricos(selectedAlunoId)
      if (!refresh.error) setHistoricos(refresh.data as HistoricoRow[] ?? [])
    }
    setIsSaving(false)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir este registro de histórico?')) return
    setError(null)
    const result = await excluirHistorico(id)
    if (result.error) setError(result.error)
    else {
      setHistoricos((prev) => prev.filter((h) => h.id !== id))
      setSuccess('Registro excluído!')
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  async function handleDownloadPDF() {
    if (!selectedAlunoId || !selectedAluno) return
    setIsLoadingCompleto(true)
    setError(null)
    try {
      const result = await getHistoricoCompleto(selectedAlunoId)
      if (result.error || !result.data) {
        setError(result.error ?? 'Erro ao carregar dados')
        setIsLoadingCompleto(false)
        return
      }

      const { gerarHistoricoPDF } = await import('@/lib/pdf/historico')
      const endereco = config?.endereco as Record<string, string> | undefined
      const doc = gerarHistoricoPDF({
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
        alunoDataNascimento: new Date(selectedAluno.data_nascimento).toLocaleDateString('pt-BR'),
        nomeMae: selectedAluno.nome_mae ?? undefined,
        nomePai: selectedAluno.nome_pai ?? undefined,
        historicos: result.data.map((h) => ({
          anoLetivo: h.ano_letivo,
          turmaCodigo: h.turma_codigo,
          turmaSerie: h.turma_serie,
          situacao: h.situacao,
          observacoes: h.observacoes,
        })),
        dataAtual: new Date().toLocaleDateString('pt-BR'),
      })
      doc.save(`historico-escolar-${selectedAluno.matricula}.pdf`)
    } catch {
      setError('Erro ao gerar PDF')
    }
    setIsLoadingCompleto(false)
  }

  const columns: Column<HistoricoRow>[] = [
    { key: 'ano_letivo', label: 'Ano', sortable: true },
    {
      key: 'turma_codigo', label: 'Turma',
      render: (row) => row.turma_codigo ?? '—',
    },
    {
      key: 'turma_serie', label: 'Série',
      render: (row) => row.turma_serie ?? '—',
    },
    {
      key: 'situacao', label: 'Situação',
      render: (row) => {
        const badge = statusBadge(row.situacao)
        return <Badge variant={badge.variant}>{badge.label}</Badge>
      },
    },
    {
      key: 'acoes', label: '',
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => startEdit(row)} title="Editar">
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} title="Excluir">
            <Trash2 size={14} className="text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Histórico Escolar</h1>
        <p className="text-sm text-gray-500 mt-1">Registre e acompanhe o histórico anual dos alunos.</p>
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
          options={alunos
            .filter((a) => a.status !== 'inativo')
            .map((a) => ({ value: a.id, label: `${a.nome_completo} (${a.matricula})` }))}
          value={selectedAlunoId}
          onChange={(e) => { setSelectedAlunoId(e.target.value); resetForm() }}
        />
      </div>

      {selectedAluno && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button onClick={() => { resetForm(); setEditingId(null) }} variant="secondary" disabled={!!editingId}>
              <Plus size={18} /> Adicionar Registro
            </Button>
            <Button onClick={handleDownloadPDF} isLoading={isLoadingCompleto} disabled={historicos.length === 0}>
              <Download size={18} /> Baixar PDF
            </Button>
          </div>

          {/* Inline form */}
          {editingId !== null && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-3">
                  {editingId ? 'Editar Registro' : 'Novo Registro'}
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Select
                    label="Turma"
                    options={turmas.map((t) => ({ value: t.id, label: `${t.codigo} - ${t.serie}` }))}
                    value={formTurmaId}
                    onChange={(e) => setFormTurmaId(e.target.value)}
                  />
                  <Input
                    label="Ano Letivo"
                    type="number"
                    value={formAno}
                    onChange={(e) => setFormAno(e.target.value)}
                  />
                  <Select
                    label="Situação"
                    options={[
                      { value: 'aprovado', label: 'Aprovado' },
                      { value: 'reprovado', label: 'Reprovado' },
                      { value: 'transferido', label: 'Transferido' },
                    ]}
                    value={formSituacao}
                    onChange={(e) => setFormSituacao(e.target.value)}
                  />
                </div>
                <div className="mt-3">
                  <Textarea
                    label="Observações"
                    value={formObservacoes}
                    onChange={(e) => setFormObservacoes(e.target.value)}
                    placeholder="Observações opcionais..."
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button onClick={handleSave} isLoading={isSaving} size="sm">Salvar</Button>
                  <Button onClick={resetForm} variant="outline" size="sm">Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoadingHistoricos ? (
            <p className="text-sm text-gray-400 text-center py-4">Carregando histórico...</p>
          ) : (
            <DataTable
              columns={columns}
              data={historicos}
              keyExtractor={(row) => row.id}
              searchable={false}
              isLoading={false}
              emptyMessage="Nenhum registro de histórico encontrado para este aluno."
            />
          )}
        </>
      )}

      {!selectedAlunoId && !isLoadingAlunos && (
        <p className="text-sm text-gray-500 text-center py-8">
          <Search size={40} className="mx-auto mb-2 text-gray-300" />
          Selecione um aluno acima para visualizar o histórico.
        </p>
      )}
    </div>
  )
}
