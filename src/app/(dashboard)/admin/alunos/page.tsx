'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listarAlunos } from '@/lib/actions/alunos'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge, statusBadge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Plus, Eye } from 'lucide-react'
import type { Aluno } from '@/types/entities'

const columns: Column<Aluno>[] = [
  { key: 'matricula', label: 'Matrícula', sortable: true },
  { key: 'nome_completo', label: 'Nome', sortable: true },
  {
    key: 'data_nascimento', label: 'Nascimento',
    render: (row) => row.data_nascimento ?? '—',
  },
  { key: 'cpf', label: 'CPF' },
  { key: 'nome_mae', label: 'Mãe' },
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
  const [data, setData] = useState<Aluno[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('todos')

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await listarAlunos({ status: statusFilter })
    if (result.error) setError(result.error)
    else setData(result.data ?? [])
    setIsLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

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
          </div>
        )}
      />
    </div>
  )
}
