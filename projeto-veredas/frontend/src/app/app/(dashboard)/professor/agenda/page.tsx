'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getFuncionarioByUser, getTurmasDoProfessor } from '@/lib/actions/academico'
import { listarAlunosPorTurma } from '@/lib/actions/agenda'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { MessageCircle, User, ChevronRight } from 'lucide-react'
import type { AlunoAgendaResumo } from '@/lib/actions/agenda'

interface TurmaOpcao {
  id: string
  label: string
}

export default function ProfessorAgendaPage() {
  const [turmas, setTurmas] = useState<TurmaOpcao[]>([])
  const [turmaId, setTurmaId] = useState('')
  const [alunos, setAlunos] = useState<AlunoAgendaResumo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAlunos, setIsLoadingAlunos] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const funcRes = await getFuncionarioByUser()
      if (funcRes.error || !funcRes.data) {
        setError(funcRes.error ?? 'Professor não encontrado')
        setIsLoading(false)
        return
      }

      const turmasRes = await getTurmasDoProfessor(funcRes.data.id)
      if (turmasRes.error) {
        setError(turmasRes.error)
      } else {
        const unique = new Map<string, TurmaOpcao>()
        for (const t of turmasRes.data ?? []) {
          const key = t.turma_id as string
          if (!unique.has(key)) {
            unique.set(key, {
              id: key,
              label: `${(t as unknown as { turma_serie: string }).turma_serie} - ${(t as unknown as { turma_codigo: string }).turma_codigo} (${(t as unknown as { turma_turno: string }).turma_turno})`,
            })
          }
        }
        setTurmas(Array.from(unique.values()))
      }
      setIsLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!turmaId) { setAlunos([]); return }
    setIsLoadingAlunos(true)
    listarAlunosPorTurma(turmaId).then((res) => {
      if (res.data) setAlunos(res.data)
      setIsLoadingAlunos(false)
    })
  }, [turmaId])

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-primary-800)]">Agenda do Aluno</h1>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Carregando turmas...</p>
      ) : (
        <>
          <div className="mb-4">
            <Select
              options={[
                { value: '', label: 'Selecione uma turma...' },
                ...turmas.map((t) => ({ value: t.id, label: t.label })),
              ]}
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
            />
          </div>

          {isLoadingAlunos ? (
            <p className="text-sm text-gray-400">Carregando alunos...</p>
          ) : turmaId && alunos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum aluno ativo nesta turma.</p>
          ) : (
            <div className="space-y-2">
              {alunos.map((aluno) => (
                <Link
                  key={aluno.id}
                  href={`/professor/agenda/${aluno.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-white p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zab-verde-claro text-zab-verde">
                    <User size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">{aluno.nome_completo}</p>
                    <p className="text-xs text-gray-400">Agenda do aluno</p>
                  </div>
                  {aluno.tem_resposta_nao_lida && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-500 px-1.5 text-[10px] font-bold text-white">
                      Nova
                    </span>
                  )}
                  <ChevronRight size={18} className="text-gray-300" />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
