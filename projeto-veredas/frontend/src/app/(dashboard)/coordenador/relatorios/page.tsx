'use client'

import { useEffect, useState } from 'react'
import { getRelatoriosCoordenador } from '@/lib/actions/relatorios'
import type { DadosRelatorios } from '@/lib/actions/relatorios'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, TrendingUp, Award } from 'lucide-react'

function Bar({ pct, color = 'bg-zab-verde' }: { pct: number; color?: string }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

export default function CoordRelatoriosPage() {
  const [data, setData] = useState<DadosRelatorios | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getRelatoriosCoordenador().then((res) => {
      if (res.error) setError(res.error)
      else setData(res.data)
      setIsLoading(false)
    })
  }, [])

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-zab-verde" /></div>
  if (error) return <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</Card>
  if (!data) return null

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-primary-800)]">Relatórios da Coordenação</h1>

      {/* Desempenho por Disciplina */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-zab-verde" />
            <h2 className="text-base font-semibold text-gray-800">Desempenho Médio por Disciplina</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="pb-2 pr-4">Disciplina</th>
                  <th className="pb-2 pr-4">Média Geral</th>
                  <th className="pb-2 pr-4">1º Período</th>
                  <th className="pb-2 pr-4">2º Período</th>
                  <th className="pb-2 pr-4">3º Período</th>
                  <th className="pb-2">4º Período</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.desempenhoDisciplinas.map((d) => (
                  <tr key={d.disciplina} className="text-gray-700">
                    <td className="py-2 pr-4 font-medium">{d.disciplina}</td>
                    <td className="py-2 pr-4 font-semibold">{d.mediaGeral.toFixed(1)}</td>
                    <td className="py-2 pr-4">{d.periodo1 > 0 ? d.periodo1.toFixed(1) : '—'}</td>
                    <td className="py-2 pr-4">{d.periodo2 > 0 ? d.periodo2.toFixed(1) : '—'}</td>
                    <td className="py-2 pr-4">{d.periodo3 > 0 ? d.periodo3.toFixed(1) : '—'}</td>
                    <td className="py-2">{d.periodo4 > 0 ? d.periodo4.toFixed(1) : '—'}</td>
                  </tr>
                ))}
                {data.desempenhoDisciplinas.length === 0 && (
                  <tr><td colSpan={6} className="py-4 text-center text-gray-400">Nenhum dado disponível.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Comparativo Bimestral */}
      {data.desempenhoDisciplinas.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-800">Comparativo Bimestral</h2>
            <div className="space-y-4">
              {data.desempenhoDisciplinas.map((d) => {
                const periodos = [d.periodo1, d.periodo2, d.periodo3, d.periodo4].filter((p) => p > 0)
                if (periodos.length === 0) return null
                return (
                  <div key={d.disciplina}>
                    <p className="mb-1 text-sm font-medium text-gray-700">{d.disciplina}</p>
                    <div className="flex items-end gap-2" style={{ height: 80 }}>
                      {[d.periodo1, d.periodo2, d.periodo3, d.periodo4].map((p, i) => {
                        if (p === 0) return <div key={i} className="flex-1" />
                        const h = Math.max(20, (p / 10) * 70)
                        return (
                          <div key={i} className="flex flex-1 flex-col items-center gap-1">
                            <span className="text-[10px] font-medium text-gray-600">{p.toFixed(1)}</span>
                            <div
                              className="w-full rounded-t"
                              style={{
                                height: `${h}px`,
                                backgroundColor: p >= 7 ? '#16a34a' : p >= 5 ? '#eab308' : '#dc2626',
                              }}
                            />
                            <span className="text-[10px] text-gray-400">{i + 1}º</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alunos em Risco */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="text-base font-semibold text-gray-800">
              Alunos em Risco
              {data.alunosRisco.length > 0 && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">{data.alunosRisco.length}</span>
              )}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="pb-2 pr-4">Aluno</th>
                  <th className="pb-2 pr-4">Turma</th>
                  <th className="pb-2 pr-4">Nota</th>
                  <th className="pb-2 pr-4">Frequência</th>
                  <th className="pb-2">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.alunosRisco.slice(0, 20).map((a, i) => (
                  <tr key={i} className="text-gray-700">
                    <td className="py-2 pr-4 font-medium">{a.nome}</td>
                    <td className="py-2 pr-4">{a.turma}</td>
                    <td className="py-2 pr-4">
                      {a.nota !== null ? (
                        <span className={a.nota < 5 ? 'text-red-600 font-medium' : 'text-amber-600'}>{a.nota.toFixed(1)}</span>
                      ) : '—'}
                    </td>
                    <td className="py-2 pr-4">
                      {a.frequencia !== null ? (
                        <span className={a.frequencia < 75 ? 'text-red-600 font-medium' : 'text-amber-600'}>{a.frequencia}%</span>
                      ) : '—'}
                    </td>
                    <td className="py-2">
                      <Badge variant={a.motivo === 'nota' ? 'danger' : 'warning'}>
                        {a.motivo === 'nota' ? 'Nota baixa' : 'Frequência baixa'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {data.alunosRisco.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center text-gray-400">Nenhum aluno em risco.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top 5 */}
      {data.top5.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Award size={18} className="text-yellow-500" />
              <h2 className="text-base font-semibold text-gray-800">Top 5 — Melhores Médias</h2>
            </div>
            <div className="space-y-2">
              {data.top5.map((a, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-2.5">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-stone-300'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{a.nome}</p>
                    <p className="text-xs text-gray-400">{a.turma}</p>
                  </div>
                  <span className="text-lg font-bold text-zab-verde">{a.media.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
