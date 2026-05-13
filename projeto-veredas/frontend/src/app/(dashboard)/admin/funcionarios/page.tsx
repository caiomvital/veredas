'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listarFuncionarios, excluirFuncionario } from '@/lib/actions/funcionarios'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import type { Funcionario } from '@/types/entities'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

const CARGO_LABELS: Record<string, string> = {
  admin: 'Administrador',
  coordenador: 'Coordenador',
  secretaria: 'Secretaria',
  professor: 'Professor',
}

const columns: Column<Funcionario>[] = [
  { key: 'nome_completo', label: 'Nome', sortable: true },
  { key: 'cpf', label: 'CPF' },
  { key: 'email', label: 'E-mail', sortable: true },
  { key: 'telefone', label: 'Telefone', render: (row) => row.telefone ?? '—' },
  {
    key: 'whatsapp', label: '',
    sortable: false,
    render: (row) => row.telefone ? <WhatsAppButton telefone={row.telefone} /> : null,
  },
  {
    key: 'cargo',
    label: 'Cargo',
    render: (row) => <Badge>{CARGO_LABELS[row.cargo] ?? row.cargo}</Badge>,
  },
  {
    key: 'ativo',
    label: 'Status',
    render: (row) => (
      <Badge variant={row.ativo ? 'success' : 'danger'}>
        {row.ativo ? 'Ativo' : 'Inativo'}
      </Badge>
    ),
  },
]

export default function FuncionariosPage() {
  const [data, setData] = useState<Funcionario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await listarFuncionarios()
    if (result.error) {
      setError(result.error)
    } else {
      setData(result.data ?? [])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete() {
    if (!selectedId) return
    setIsDeleting(true)
    const result = await excluirFuncionario(selectedId)
    setIsDeleting(false)
    setShowConfirm(false)
    setSelectedId(null)
    if (result.error) setError(result.error)
    else fetchData()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Funcionários</h1>
        <Link href="/admin/funcionarios/novo">
          <Button><Plus size={18} /> Novo Funcionário</Button>
        </Link>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Buscar por nome, CPF ou e-mail..."
        searchKeys={['nome_completo', 'cpf', 'email']}
        isLoading={isLoading}
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <Link href={`/admin/funcionarios/${row.id}`}>
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
        message="Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => { setShowConfirm(false); setSelectedId(null); }}
      />
    </div>
  )
}