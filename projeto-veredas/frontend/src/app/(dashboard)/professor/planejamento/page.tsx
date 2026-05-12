'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { listarPlanejamentos, excluirPlanejamento } from '@/lib/actions/aulas'
import { getFuncionarioByUser, getTurmasDoProfessor } from '@/lib/actions/academico'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Planejamento {
  id: string
  turma_disciplina_id: string
  periodo_id: string
  semana_inicio: string
  objetivos: string | null
  conteudo_planejado: string
  metodologia: string | null
  recursos: string | null
}

function PlanejamentoPage() {
  const searchParams = useSearchParams()
  const turmaFilter = searchParams.get('turma') ?? ''

  const [planejamentos, setPlanejamentos] = useState<Planejamento[]>([])
  const [turmas, setTurmas] = useState<Array<{ value: string; label: string }>>([])
  const [selectedTurma, setSelectedTurma] = useState(turmaFilter)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!selectedTurma) { setIsLoading(false); return }
    setIsLoading(true)
    setError(null)
    const result = await listarPlanejamentos(selectedTurma)
    if (result.error) setError(result.error)
    else setPlanejamentos(result.data ?? [])
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

  const columns: Column<Planejamento>[] = [
    {
      key: 'semana_inicio', label: 'Semana Início', sortable: true,
      render: (row) => row.semana_inicio ? new Date(row.semana_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '—',
    },
    {
      key: 'conteudo_planejado', label: 'Conteúdo',
      render: (row) => row.conteudo_planejado.length > 80 ? row.conteudo_planejado.slice(0, 80) + '…' : row.conteudo_planejado,
    },
    {
      key: 'objetivos', label: 'Objetivos',
      render: (row) => row.objetivos ? (row.objetivos.length > 50 ? row.objetivos.slice(0, 50) + '…' : row.objetivos) : '—',
    },
  ]

  async function handleDelete(id: string) {
    if (!confirm('Excluir este planejamento?')) return
    const result = await excluirPlanejamento(id)
    if (result.error) setError(result.error)
    else fetchData()
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Planejamento de Aulas</h1>
        {selectedTurma && (
          <Link href={`/professor/planejamento/novo?turma=${selectedTurma}`}>
            <Button><Plus size={18} /> Novo Planejamento</Button>
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
          data={planejamentos}
          keyExtractor={(row) => row.id}
          searchKeys={['conteudo_planejado', 'objetivos']}
          searchPlaceholder="Buscar..."
          isLoading={isLoading}
          emptyMessage="Nenhum planejamento encontrado."
          actions={(row) => (
            <div className="flex justify-end gap-2">
              <Link href={`/professor/planejamento/${row.id}`}>
                <Button variant="ghost" size="sm"><Pencil size={16} /></Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
                <Trash2 size={16} className="text-red-500" />
              </Button>
            </div>
          )}
        />
      ) : (
        <p className="text-sm text-gray-500">Selecione uma turma acima para ver os planejamentos.</p>
      )}
    </div>
  )
}

export default function PlanejamentoPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-400">Carregando...</div>}>
      <PlanejamentoPage />
    </Suspense>
  )
}