'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { listarAtividades } from '@/lib/actions/aulas'
import { getFuncionarioByUser, getTurmasDoProfessor } from '@/lib/actions/academico'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Pencil } from 'lucide-react'

interface Atividade {
  id: string
  turma_disciplina_id: string
  titulo: string
  descricao: string
  data_atribuicao: string
  data_entrega: string
}

function AtividadesPage() {
  const searchParams = useSearchParams()
  const turmaFilter = searchParams.get('turma') ?? ''

  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [turmas, setTurmas] = useState<Array<{ value: string; label: string }>>([])
  const [selectedTurma, setSelectedTurma] = useState(turmaFilter)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!selectedTurma) { setIsLoading(false); return }
    setIsLoading(true)
    setError(null)
    const result = await listarAtividades(selectedTurma)
    if (result.error) setError(result.error)
    else setAtividades(result.data ?? [])
    setIsLoading(false)
  }, [selectedTurma])

  useEffect(() => {
    async function loadTurmas() {
      const funcRes = await getFuncionarioByUser()
      if (funcRes.error || !funcRes.data) return
      const turmasRes = await getTurmasDoProfessor(funcRes.data.id)
      if (turmasRes.data) {
        setTurmas((turmasRes.data ?? []).map((t: Record<string, unknown>) => ({
          value: t.id as string,
          label: `${t.turma_codigo as string} - ${t.turma_serie as string} - ${t.disciplina_nome as string}`,
        })))
      }
    }
    loadTurmas()
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const columns: Column<Atividade>[] = [
    { key: 'titulo', label: 'Título', sortable: true },
    {
      key: 'descricao', label: 'Descrição',
      render: (row) => row.descricao.length > 60 ? row.descricao.slice(0, 60) + '…' : row.descricao,
    },
    {
      key: 'data_atribuicao', label: 'Atribuída em',
      render: (row) => row.data_atribuicao ? new Date(row.data_atribuicao + 'T00:00:00').toLocaleDateString('pt-BR') : '—',
    },
    {
      key: 'data_entrega', label: 'Data de Entrega', sortable: true,
      render: (row) => row.data_entrega ? new Date(row.data_entrega + 'T00:00:00').toLocaleDateString('pt-BR') : '—',
    },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Atividades de Casa</h1>
        {selectedTurma && (
          <Link href={`/professor/atividades/novo?turma=${selectedTurma}`}>
            <Button><Plus size={18} /> Nova Atividade</Button>
          </Link>
        )}
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="mb-4">
        <Select
          label="Turma / Disciplina"
          options={[{ value: '', label: 'Selecione uma turma' }, ...turmas]}
          value={selectedTurma}
          onChange={(e) => setSelectedTurma(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      {selectedTurma ? (
        <DataTable
          columns={columns}
          data={atividades}
          keyExtractor={(row) => row.id}
          searchKeys={['titulo', 'descricao']}
          searchPlaceholder="Buscar..."
          isLoading={isLoading}
          emptyMessage="Nenhuma atividade encontrada."
          actions={(row) => (
            <div className="flex justify-end gap-2">
              <Link href={`/professor/atividades/${row.id}`}>
                <Button variant="ghost" size="sm"><Pencil size={16} /></Button>
              </Link>
            </div>
          )}
        />
      ) : (
        <p className="text-sm text-gray-500">Selecione uma turma acima para ver as atividades.</p>
      )}
    </div>
  )
}

export default function AtividadesPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-400">Carregando...</div>}>
      <AtividadesPage />
    </Suspense>
  )
}
