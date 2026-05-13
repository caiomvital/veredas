'use client'

import { useEffect, useState } from 'react'
import { getRelatoriosAdmin } from '@/lib/actions/relatorios'
import type { DadosRelatorios } from '@/lib/actions/relatorios'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function Bar({ pct, color = 'bg-zab-verde' }: { pct: number; color?: string }) {
  return (
    <div className="h-4 w-full overflow-hidden rounded-full bg-stone-100">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

export default function AdminRelatoriosPage() {
  const [data, setData] = useState<DadosRelatorios | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getRelatoriosAdmin().then((res) => {
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
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-primary-800)]">Relatórios</h1>

      {/* Turmas */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800">Alunos por Turma</h2>
          <div className="space-y-3">
            {data.alunosPorTurma.map((t) => (
              <div key={t.turma}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{t.turma}</span>
                  <span className="text-gray-500">{t.ativos}/{t.capacidade} ({t.pct}%)</span>
                </div>
                <Bar pct={t.pct} color={t.pct > 90 ? 'bg-amber-500' : t.pct > 50 ? 'bg-zab-verde' : 'bg-red-400'} />
              </div>
            ))}
            {data.alunosPorTurma.length === 0 && <p className="text-sm text-gray-400">Nenhuma turma encontrada.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Aprovação */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800">Aprovação por Turma</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="pb-2 pr-4">Turma</th>
                  <th className="pb-2 pr-4">Aprovados</th>
                  <th className="pb-2 pr-4">Reprovados</th>
                  <th className="pb-2">Taxa</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.aprovacaoReprovacao.map((a) => (
                  <tr key={a.turma} className="text-gray-700">
                    <td className="py-2 pr-4 font-medium">{a.turma}</td>
                    <td className="py-2 pr-4 text-green-600">{a.aprovados}</td>
                    <td className="py-2 pr-4 text-red-600">{a.reprovados}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24"><Bar pct={a.taxaAprovacao} /></div>
                        <span>{a.taxaAprovacao}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.aprovacaoReprovacao.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-gray-400">Nenhum dado.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Inadimplência */}
      <div className="mb-6 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-800">Inadimplência</h2>
            <div className="mb-3 flex items-end gap-2">
              <span className="text-2xl font-bold text-zab-verde">{data.inadimplencia.pctPago}%</span>
              <span className="text-sm text-gray-400">pago</span>
            </div>
            <Bar pct={data.inadimplencia.pctPago} color={data.inadimplencia.pctPago > 80 ? 'bg-zab-verde' : 'bg-amber-500'} />
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-green-600">Pago: {formatCurrency(data.inadimplencia.pago)}</span>
              <span className="text-red-600">Pendente: {formatCurrency(data.inadimplencia.pendente)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-800">Frequência Média</h2>
            <div className="space-y-2">
              {data.frequenciaMedia.slice(0, 5).map((d) => (
                <div key={d.disciplina}>
                  <div className="mb-0.5 flex justify-between text-sm">
                    <span className="text-gray-700">{d.disciplina}</span>
                    <span className="text-gray-500">{d.media}%</span>
                  </div>
                  <Bar pct={d.media} color={d.media >= 80 ? 'bg-zab-verde' : 'bg-amber-500'} />
                </div>
              ))}
              {data.frequenciaMedia.length === 0 && <p className="text-sm text-gray-400">Sem dados.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
