'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listarPeriodos, excluirPeriodo } from '@/lib/actions/periodos'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { PeriodoLetivo } from '@/types/entities'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

const columns: Column<PeriodoLetivo>[] = [
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'ordem', label: 'Ordem', sortable: true },
  { key: 'ano_letivo', label: 'Ano Letivo', sortable: true },
  {
    key: 'data_inicio', label: 'Início',
    render: (row) => row.data_inicio ? new Date(row.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '—',
  },
  {
    key: 'data_fim', label: 'Fim',
    render: (row) => row.data_fim ? new Date(row.data_fim + 'T00:00:00').toLocaleDateString('pt-BR') : '—',
  },
]

export default function PeriodosPage() {
  const [data, setData] = useState<PeriodoLetivo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await listarPeriodos()
    if (result.error) setError(result.error)
    else setData(result.data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function handleDelete(id: string) {
    setSelectedId(id)
    setShowConfirm(true)
  }

  async function confirmDelete() {
    if (!selectedId) return
    setIsDeleting(true)
    const result = await excluirPeriodo(selectedId)
    setIsDeleting(false)
    setShowConfirm(false)
    setSelectedId(null)
    if (result.error) {
      setError(result.error)
      toast.error("Erro: " + result.error)
    } else {
      toast.success("Período excluído com sucesso")
      fetchData()
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Períodos Letivos</h1>
        <Link href="/app/admin/periodos/novo">
          <Button><Plus size={18} /> Novo Período</Button>
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
        searchKeys={['nome']}
        searchPlaceholder="Buscar por nome..."
        isLoading={isLoading}
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <Link href={`/admin/periodos/${row.id}`}>
              <Button variant="ghost" size="sm"><Pencil size={16} /></Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
              <Trash2 size={16} className="text-red-500" />
            </Button>
          </div>
        )}
      />
      <ConfirmDialog
        open={showConfirm}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este período letivo? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => { setShowConfirm(false); setSelectedId(null); }}
      />
    </div>
  )
}