'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listarTurmas } from '@/lib/actions/turmas'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge, statusBadge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Eye } from 'lucide-react'
import type { Turma } from '@/types/entities'

const TURNO_LABEL: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' }

const columns: Column<Turma>[] = [
  { key: 'codigo', label: 'Código', sortable: true },
  { key: 'serie', label: 'Série', sortable: true },
  {
    key: 'turno', label: 'Turno',
    render: (row) => TURNO_LABEL[row.turno] ?? row.turno,
  },
  { key: 'ano_letivo', label: 'Ano', sortable: true },
  { key: 'capacidade', label: 'Vagas' },
  {
    key: 'ativa', label: 'Status',
    render: (row) => {
      const s = statusBadge(row.ativa ? 'ativo' : 'inativo')
      return <Badge variant={s.variant}>{s.label}</Badge>
    },
  },
]

export default function TurmasPage() {
  const [data, setData] = useState<Turma[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await listarTurmas({ ano_letivo: new Date().getFullYear() })
    if (result.error) setError(result.error)
    else setData(result.data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Turmas</h1>
        <Link href="/admin/turmas/novo">
          <Button><Plus size={18} /> Nova Turma</Button>
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
        searchPlaceholder="Buscar por código ou série..."
        searchKeys={['codigo', 'serie']}
        isLoading={isLoading}
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <Link href={`/admin/turmas/${row.id}`}>
              <Button variant="ghost" size="sm"><Eye size={16} /></Button>
            </Link>
          </div>
        )}
      />
    </div>
  )
}
