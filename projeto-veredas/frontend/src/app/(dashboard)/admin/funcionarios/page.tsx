'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listarFuncionarios } from '@/lib/actions/funcionarios'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Eye, Trash2 } from 'lucide-react'
import type { Funcionario } from '@/types/entities'

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
          </div>
        )}
      />
    </div>
  )
}
