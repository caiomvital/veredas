'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listarResponsaveis } from '@/lib/actions/responsaveis'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Eye } from 'lucide-react'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import type { Responsavel } from '@/types/entities'

const columns: Column<Responsavel>[] = [
  { key: 'nome_completo', label: 'Nome', sortable: true },
  { key: 'cpf', label: 'CPF' },
  { key: 'email', label: 'E-mail', sortable: true },
  { key: 'telefone', label: 'Telefone' },
  { key: 'profissao', label: 'Profissão' },
  {
    key: 'whatsapp', label: '',
    sortable: false,
    render: (row) => row.telefone ? <WhatsAppButton telefone={row.telefone} /> : null,
  },
]

export default function ResponsaveisPage() {
  const [data, setData] = useState<Responsavel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await listarResponsaveis()
    if (result.error) setError(result.error)
    else setData(result.data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Responsáveis</h1>
        <Link href="/admin/responsaveis/novo">
          <Button><Plus size={18} /> Novo Responsável</Button>
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
            <Link href={`/admin/responsaveis/${row.id}`}>
              <Button variant="ghost" size="sm"><Eye size={16} /></Button>
            </Link>
          </div>
        )}
      />
    </div>
  )
}
