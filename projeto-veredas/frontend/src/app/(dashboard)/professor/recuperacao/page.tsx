'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listarDisciplinasRecuperacao } from '@/lib/actions/recuperacao'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export default function RecuperacaoPage() {
  const [turmas, setTurmas] = useState<Array<{ id: string; turma_codigo: string; turma_serie: string; disciplina_nome: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listarDisciplinasRecuperacao().then((res) => {
      if (res.error) setError(res.error)
      else setTurmas(res.data ?? [])
      setIsLoading(false)
    })
  }, [])

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Recuperação Paralela</h1>
        <p className="text-sm text-gray-500 mt-1">Selecione a turma e disciplina para lançar notas de recuperação.</p>
      </div>
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {turmas.map((t) => (
          <Link key={t.id} href={`/professor/recuperacao/${t.id}`}>
            <Card className="transition-shadow hover:shadow-md cursor-pointer">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500">
                  <BarChart3 className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-primary-800)]">{t.turma_codigo} - {t.turma_serie}</p>
                  <p className="text-sm text-gray-500">{t.disciplina_nome}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {!isLoading && turmas.length === 0 && (
          <p className="col-span-full text-sm text-gray-500">Nenhuma disciplina atribuída.</p>
        )}
      </div>
    </div>
  )
}
