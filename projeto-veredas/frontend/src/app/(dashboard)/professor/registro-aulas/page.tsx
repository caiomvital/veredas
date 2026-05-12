'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { listarRegistroAulas } from '@/lib/actions/aulas'
import { getFuncionarioByUser, getTurmasDoProfessor } from '@/lib/actions/academico'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Pencil } from 'lucide-react'

interface RegistroAula {
  id: string
  turma_disciplina_id: string
  data_aula: string
  conteudo: string
  observacoes: string | null
  carga_horaria_minutos: number
}

function RegistroAulasPage() {
  const searchParams = useSearchParams()
  const turmaFilter = searchParams.get('turma') ?? ''

  const [registros, setRegistros] = useState<RegistroAula[]>([])
  const [turmas, setTurmas] = useState<Array<{ value: string; label: string }>>([])
  const [selectedTurma, setSelectedTurma] = useState(turmaFilter)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!selectedTurma) { setIsLoading(false); return }
    setIsLoading(true)
    setError(null)
    const result = await listarRegistroAulas(selectedTurma)
    if (result.error) setError(result.error)
    else setRegistros(result.data ?? [])
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

  const columns: Column<RegistroAula>[] = [
    {
      key: 'data_aula', label: 'Data', sortable: true,
      render: (row) => row.data_aula ? new Date(row.data_aula + 'T00:00:00').toLocaleDateString('pt-BR') : '—',
    },
    {
      key: 'conteudo', label: 'Conteúdo',
      render: (row) => row.conteudo.length > 60 ? row.conteudo.slice(0, 60) + '…' : row.conteudo,
    },
    {
      key: 'carga_horaria_minutos', label: 'CH (min)',
    },
    {
      key: 'observacoes', label: 'Obs',
      render: (row) => row.observacoes ? (row.observacoes.length > 40 ? row.observacoes.slice(0, 40) + '…' : row.observacoes) : '—',
    },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Registro de Aulas</h1>
        {selectedTurma && (
          <Link href={`/professor/registro-aulas/novo?turma=${selectedTurma}`}>
            <Button><Plus size={18} /> Novo Registro</Button>
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
          data={registros}
          keyExtractor={(row) => row.id}
          searchKeys={['conteudo']}
          searchPlaceholder="Buscar por conteúdo..."
          isLoading={isLoading}
          emptyMessage="Nenhum registro de aula encontrado."
          actions={(row) => (
            <div className="flex justify-end gap-2">
              <Link href={`/professor/registro-aulas/${row.id}`}>
                <Button variant="ghost" size="sm"><Pencil size={16} /></Button>
              </Link>
            </div>
          )}
        />
      ) : (
        <p className="text-sm text-gray-500">Selecione uma turma acima para ver os registros de aula.</p>
      )}
    </div>
  )
}

export default function RegistroAulasPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-400">Carregando...</div>}>
      <RegistroAulasPage />
    </Suspense>
  )
}