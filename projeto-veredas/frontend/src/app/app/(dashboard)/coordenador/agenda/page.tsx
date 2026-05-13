'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listarAgendaCoordenacao } from '@/lib/actions/agenda'
import { listarTurmas } from '@/lib/actions/turmas'
import type { AlunoComUltimoRegistro } from '@/lib/actions/agenda'
import type { Turma } from '@/types/entities'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, User, CalendarDays } from 'lucide-react'

function formatData(data: string | null) {
  if (!data) return '—'
  const d = new Date(data + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function CoordenadorAgendaPage() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [turmaId, setTurmaId] = useState('')
  const [alunos, setAlunos] = useState<AlunoComUltimoRegistro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listarTurmas().then((res) => {
      if (res.data) setTurmas(res.data)
      else setError(res.error)
      setIsLoading(false)
    })
  }, [])

  const loadData = useCallback(async () => {
    setIsLoadingData(true)
    const res = await listarAgendaCoordenacao(turmaId || undefined)
    if (res.data) setAlunos(res.data)
    setIsLoadingData(false)
  }, [turmaId])

  useEffect(() => { loadData() }, [loadData])

  const alunosComRegistro = alunos.filter((a) => a.ultimo_registro)
  const alunosSemRegistro = alunos.filter((a) => !a.ultimo_registro)

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-primary-800)]">Agenda dos Alunos</h1>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="mb-6">
        {isLoading ? (
          <p className="text-sm text-gray-400">Carregando turmas...</p>
        ) : (
          <Select
            options={[
              { value: '', label: 'Todas as turmas' },
              ...turmas.map((t) => ({
                value: t.id,
                label: `${t.serie} - ${t.codigo} (${t.turno})`,
              })),
            ]}
            value={turmaId}
            onChange={(e) => setTurmaId(e.target.value)}
          />
        )}
      </div>

      {/* Stats */}
      {!isLoadingData && alunos.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-zab-verde">{alunos.length}</p>
              <p className="text-xs text-gray-500">Total de Alunos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{alunosComRegistro.length}</p>
              <p className="text-xs text-gray-500">Com Registro</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{alunosSemRegistro.length}</p>
              <p className="text-xs text-gray-500">Sem Registro</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      {isLoadingData ? (
        <p className="text-sm text-gray-400">Carregando dados...</p>
      ) : alunos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-500">
            Nenhum aluno encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Alunos com registro */}
          {alunosComRegistro.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-gray-700">Com Registro Recente</h2>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {alunosComRegistro.map((aluno) => (
                    <div
                      key={aluno.id}
                      className="flex items-center gap-3 px-4 py-3 sm:px-6"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zab-verde-claro text-zab-verde">
                        <User size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                          <p className="truncate text-sm font-medium text-gray-800">
                            {aluno.nome_completo}
                          </p>
                          <span className="text-xs text-gray-400">
                            {aluno.matricula} · {aluno.turma_nome}
                          </span>
                        </div>
                        <div className="mt-1 flex items-start gap-2">
                          <MessageCircle size={14} className="mt-0.5 shrink-0 text-gray-300" />
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {aluno.ultimo_registro}
                          </p>
                        </div>
                      </div>
                      {aluno.ultima_data && (
                        <div className="shrink-0 text-right">
                          <Badge variant="info">
                            <CalendarDays size={10} className="mr-1 inline" />
                            {formatData(aluno.ultima_data)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alunos sem registro */}
          {alunosSemRegistro.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-gray-500">Sem Registro</h2>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {alunosSemRegistro.map((aluno) => (
                    <div
                      key={aluno.id}
                      className="flex items-center gap-3 px-4 py-3 sm:px-6"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                        <User size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm text-gray-600">
                          {aluno.nome_completo}
                        </p>
                        <p className="text-xs text-gray-400">
                          {aluno.matricula} · {aluno.turma_nome}
                        </p>
                      </div>
                      <Badge variant="default">Sem registro</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
