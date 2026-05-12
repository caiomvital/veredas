'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getFuncionarioByUser, getTurmasDoProfessor } from '@/lib/actions/academico'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, BarChart3, ClipboardList, FileText, Notebook } from 'lucide-react'

interface TurmaInfo {
  id: string
  turma_codigo: string
  turma_serie: string
  turma_turno: string
  disciplina_nome: string
  disciplina_codigo: string
  qtd_alunos: number
}

export default function MinhasTurmasPage() {
  const [turmas, setTurmas] = useState<TurmaInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const funcRes = await getFuncionarioByUser()
      if (funcRes.error || !funcRes.data) {
        setError(funcRes.error ?? 'Funcionário não encontrado')
        setIsLoading(false)
        return
      }
      const turmasRes = await getTurmasDoProfessor(funcRes.data.id)
      if (turmasRes.error) {
        setError(turmasRes.error)
      } else {
        setTurmas((turmasRes.data ?? []) as TurmaInfo[])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
      </Card>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-primary-800)]">Minhas Turmas</h1>

      {turmas.length === 0 && (
        <p className="text-sm text-gray-500">Nenhuma turma atribuída.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {turmas.map((turma) => (
          <Card key={turma.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="border-b border-border bg-[var(--color-primary-50)] p-4">
                <h3 className="text-lg font-semibold text-[var(--color-primary-800)]">
                  {turma.turma_codigo} - {turma.turma_serie}
                </h3>
                <p className="text-sm text-gray-600">{turma.disciplina_nome} ({turma.disciplina_codigo})</p>
                <p className="text-xs text-gray-500 capitalize">{turma.turma_turno} · {turma.qtd_alunos} alunos</p>
              </div>
              <div className="grid grid-cols-2 gap-px bg-border">
                <Link href={`/professor/notas/${turma.id}`}
                  className="flex items-center gap-2 bg-white p-3 text-sm font-medium text-gray-700 hover:bg-[var(--color-primary-50)] transition-colors">
                  <BarChart3 size={16} className="text-green-500" /> Notas
                </Link>
                <Link href={`/professor/chamada/${turma.id}`}
                  className="flex items-center gap-2 bg-white p-3 text-sm font-medium text-gray-700 hover:bg-[var(--color-primary-50)] transition-colors">
                  <ClipboardList size={16} className="text-orange-500" /> Chamada
                </Link>
                <Link href={`/professor/registro-aulas?turma=${turma.id}`}
                  className="flex items-center gap-2 bg-white p-3 text-sm font-medium text-gray-700 hover:bg-[var(--color-primary-50)] transition-colors">
                  <FileText size={16} className="text-indigo-500" /> Registro
                </Link>
                <Link href={`/professor/atividades?turma=${turma.id}`}
                  className="flex items-center gap-2 bg-white p-3 text-sm font-medium text-gray-700 hover:bg-[var(--color-primary-50)] transition-colors">
                  <Notebook size={16} className="text-purple-500" /> Atividades
                </Link>
                <Link href={`/professor/planejamento?turma=${turma.id}`}
                  className="flex items-center gap-2 bg-white p-3 text-sm font-medium text-gray-700 hover:bg-[var(--color-primary-50)] transition-colors">
                  <BookOpen size={16} className="text-blue-500" /> Planejamento
                </Link>
                <Link href={`/professor/diarios?turma=${turma.id}`}
                  className="flex items-center gap-2 bg-white p-3 text-sm font-medium text-gray-700 hover:bg-[var(--color-primary-50)] transition-colors">
                  <FileText size={16} className="text-gray-500" /> Diários
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
