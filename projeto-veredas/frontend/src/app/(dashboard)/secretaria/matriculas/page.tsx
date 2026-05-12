'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listarMatriculas, cancelarMatricula } from '@/lib/actions/matriculas'
import { listarTurmas } from '@/lib/actions/turmas'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge, statusBadge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { Matricula, Turma } from '@/types/entities'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

const columns: Column<Matricula>[] = [
  { key: 'aluno_id', label: 'Aluno' },
  { key: 'turma_id', label: 'Turma' },
  { key: 'data_matricula', label: 'Data Matrícula', sortable: true },
  {
    key: 'status', label: 'Status',
    render: (row) => {
      const s = statusBadge(row.status)
      return <Badge variant={s.variant}>{s.label}</Badge>
    },
  },
]

export default function MatriculasPage() {
  const [matriculas, setMatriculas] = useState<Matricula[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroTurma, setFiltroTurma] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const [matResult, turResult] = await Promise.all([
      listarMatriculas({ status: filtroStatus, turma_id: filtroTurma || undefined }),
      listarTurmas({ ano_letivo: new Date().getFullYear() }),
    ])
    if (matResult.error) setError(matResult.error)
    else setMatriculas(matResult.data ?? [])
    setTurmas(turResult.data ?? [])
    setIsLoading(false)
  }, [filtroStatus, filtroTurma])

  useEffect(() => { fetchData() }, [fetchData])

  function handleCancelar(id: string) {
    setSelectedId(id)
    setShowConfirm(true)
  }

  async function confirmCancelar() {
    if (!selectedId) return
    setIsDeleting(true)
    const result = await cancelarMatricula(selectedId)
    setIsDeleting(false)
    setShowConfirm(false)
    setSelectedId(null)
    if (result.error) {
      setError(result.error)
      toast.error("Erro: " + result.error)
    } else {
      toast.success("Matrícula cancelada com sucesso")
      fetchData()
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Matrículas</h1>
        <Link href="/secretaria/matriculas/nova">
          <Button><Plus size={18} /> Nova Matrícula</Button>
        </Link>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-4">
        <Select
          options={[
            { value: 'todos', label: 'Todos os status' },
            { value: 'ativa', label: 'Ativa' },
            { value: 'cancelada', label: 'Cancelada' },
            { value: 'concluida', label: 'Concluída' },
          ]}
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="w-44"
        />
        <Select
          options={[
            { value: '', label: 'Todas as turmas' },
            ...turmas.map((t) => ({ value: t.id, label: `${t.codigo} - ${t.serie}` })),
          ]}
          value={filtroTurma}
          onChange={(e) => setFiltroTurma(e.target.value)}
          className="w-56"
        />
      </div>

      <DataTable
        columns={columns}
        data={matriculas}
        keyExtractor={(row) => row.id}
        searchable={false}
        isLoading={isLoading}
        emptyMessage="Nenhuma matrícula encontrada."
        actions={(row) => (
          row.status === 'ativa' ? (
            <Button variant="ghost" size="sm" onClick={() => handleCancelar(row.id)}>
              <XCircle size={16} className="text-red-500" />
            </Button>
          ) : null
        )}
      />
      <ConfirmDialog
        open={showConfirm}
        title="Confirmar Cancelamento"
        message="Tem certeza que deseja cancelar esta matrícula? Esta ação não pode ser desfeita."
        confirmLabel="Cancelar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmCancelar}
        onCancel={() => { setShowConfirm(false); setSelectedId(null); }}
      />
    </div>
  )
}