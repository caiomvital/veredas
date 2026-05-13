'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listarAlunos, excluirAluno, type AlunoComTurma } from '@/lib/actions/alunos'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge, statusBadge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'

function getTurmaLabel(row: AlunoComTurma): string {
  const ativa = row.matriculas?.find((m) => (m as unknown as { status?: string }).status !== 'cancelada')
  if (!ativa?.turmas) return '—'
  return `${ativa.turmas.serie} - ${ativa.turmas.codigo}`
}

function getResponsavelLabel(row: AlunoComTurma): string {
  const vinculo = row.aluno_responsavel?.[0]
  if (!vinculo?.responsaveis?.nome_completo) return '—'
  return `${vinculo.responsaveis.nome_completo} — ${vinculo.grau_parentesco}`
}

const columns: Column<AlunoComTurma>[] = [
  { key: 'matricula', label: 'Matrícula', sortable: true },
  { key: 'nome_completo', label: 'Nome', sortable: true },
  {
    key: 'data_nascimento', label: 'Nascimento',
    render: (row) => row.data_nascimento ?? '—',
  },
  {
    key: 'matriculas', label: 'Turma',
    sortable: false,
    render: (row) => getTurmaLabel(row),
  },
  {
    key: 'aluno_responsavel', label: 'Responsável',
    sortable: false,
    render: (row) => getResponsavelLabel(row),
  },
  {
    key: 'whatsapp', label: '',
    sortable: false,
    render: (row) => {
      const tel = row.aluno_responsavel?.[0]?.responsaveis?.telefone
      return tel ? <WhatsAppButton telefone={tel} /> : null
    },
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => {
      const s = statusBadge(row.status)
      return <Badge variant={s.variant}>{s.label}</Badge>
    },
  },
]

export default function AlunosPage() {
  const [data, setData] = useState<AlunoComTurma[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('todos')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await listarAlunos({ status: statusFilter })
    if (result.error) setError(result.error)
    else setData(result.data ?? [])
    setIsLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete() {
    if (!selectedId) return
    setIsDeleting(true)
    const result = await excluirAluno(selectedId)
    setIsDeleting(false)
    setShowConfirm(false)
    setSelectedId(null)
    if (result.error) setError(result.error)
    else fetchData()
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Alunos</h1>
        <Link href="/admin/alunos/novo">
          <Button><Plus size={18} /> Novo Aluno</Button>
        </Link>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="mb-4 flex items-center gap-4">
        <Select
          options={[
            { value: 'todos', label: 'Todos os status' },
            { value: 'ativo', label: 'Ativo' },
            { value: 'inativo', label: 'Inativo' },
            { value: 'transferido', label: 'Transferido' },
            { value: 'concluido', label: 'Concluído' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Buscar por nome, matrícula ou CPF..."
        searchKeys={['nome_completo', 'matricula', 'cpf']}
        isLoading={isLoading}
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <Link href={`/admin/alunos/${row.id}`}>
              <Button variant="ghost" size="sm"><Eye size={16} /></Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedId(row.id); setShowConfirm(true); }}>
              <Trash2 size={16} className="text-red-500" />
            </Button>
          </div>
        )}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => { setShowConfirm(false); setSelectedId(null); }}
      />
    </div>
  )
}
