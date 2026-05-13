'use client'

import { useEffect, useState } from 'react'
import { getRelatoriosProfessor } from '@/lib/actions/relatorios'
import type { DadosProfessor } from '@/lib/actions/relatorios'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, AlertTriangle } from 'lucide-react'

function Bar({ pct, color = 'bg-zab-verde' }: { pct: number; color?: string }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

export default function ProfessorRelatoriosPage() {
  const [disciplinas, setDisciplinas] = useState<DadosProfessor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDisc, setSelectedDisc] = useState(0)

  useEffect(() => {
    getRelatoriosProfessor().then((res) => {
      if (res.error) setError(res.error)
      else setDisciplinas(res.data ?? [])
      setIsLoading(false)
    })
  }, [])

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-zab-verde" /></div>
  if (error) return <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</Card>
  if (disciplinas.length === 0) return <Card className="p-8 text-center text-gray-400">Nenhuma disciplina vinculada.</Card>

  const current = disciplinas[selectedDisc]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-primary-800)]">Meus Relatórios</h1>

      {/* Seletor de disciplina */}
      <div className="mb-6 flex flex-wrap gap-2">
        {disciplinas.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelectedDisc(i)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              i === selectedDisc
                ? 'bg-zab-verde text-white'
                : 'border border-border bg-white text-gray-600 hover:bg-surface-muted'
            }`}
          >
            {d.disciplina} — {d.turma}
          </button>
        ))}
      </div>

      {current && (
        <>
          {/* Frequência média */}
          <div className="mb-6 grid gap-6 sm:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-2 text-sm font-semibold text-gray-600 uppercase">Frequência Média</h2>
                <span className={`text-3xl font-bold ${current.frequenciaMedia >= 80 ? 'text-zab-verde' : 'text-amber-500'}`}>
                  {current.frequenciaMedia}%
                </span>
                <div className="mt-2">
                  <Bar pct={current.frequenciaMedia} color={current.frequenciaMedia >= 80 ? 'bg-zab-verde' : 'bg-amber-500'} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="mb-2 text-sm font-semibold text-gray-600 uppercase">Alunos que Precisam de Atenção</h2>
                <span className="text-3xl font-bold text-amber-500">{current.alunosAtencao.length}</span>
                <p className="mt-1 text-xs text-gray-400">de {current.desempenho.length} alunos</p>
              </CardContent>
            </Card>
          </div>

          {/* Desempenho */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="mb-4 text-base font-semibold text-gray-800">Desempenho da Turma</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-semibold uppercase text-gray-500">
                      <th className="pb-2 pr-4">Aluno</th>
                      <th className="pb-2 pr-4">Nota</th>
                      <th className="pb-2 pr-4">Frequência</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {current.desempenho.map((a, i) => (
                      <tr key={i} className="text-gray-700">
                        <td className="py-2 pr-4 font-medium">{a.nome}</td>
                        <td className="py-2 pr-4">
                          <span className={a.nota < 5 ? 'text-red-600 font-medium' : a.nota < 7 ? 'text-amber-600' : 'text-green-600'}>
                            {a.nota.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16"><Bar pct={a.frequencia} color={a.frequencia >= 80 ? 'bg-zab-verde' : 'bg-amber-500'} /></div>
                            <span className={a.frequencia < 75 ? 'text-red-600' : ''}>{a.frequencia}%</span>
                          </div>
                        </td>
                        <td className="py-2">
                          {a.nota < 6 || a.frequencia < 80 ? (
                            <span className="flex items-center gap-1 text-xs text-red-500">
                              <AlertTriangle size={12} /> Atenção
                            </span>
                          ) : (
                            <span className="text-xs text-green-500">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Alunos que precisam de atenção */}
          {current.alunosAtencao.length > 0 && (
            <Card className="mb-6 border-amber-200">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  <h2 className="text-base font-semibold text-gray-800">Alunos que Precisam de Atenção</h2>
                </div>
                <div className="space-y-2">
                  {current.alunosAtencao.map((a, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm">
                      <span className="font-medium text-gray-800">{a.nome}</span>
                      <div className="flex items-center gap-4">
                        {a.nota !== null && a.nota < 6 && (
                          <span className="text-red-600">Nota: {a.nota.toFixed(1)}</span>
                        )}
                        {a.frequencia !== null && a.frequencia < 80 && (
                          <span className="text-amber-600">Freq: {a.frequencia}%</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
