'use client'

import { useEffect, useState } from 'react'
import { getAlunosDoResponsavel, getBoletimAluno, type AlunoResponsavelView } from '@/lib/actions/responsavel'
import { useSearchParams } from 'next/navigation'

export default function ResponsavelBoletimPage() {
  const searchParams = useSearchParams()
  const alunoIdParam = searchParams.get('aluno')
  const [alunos, setAlunos] = useState<AlunoResponsavelView[]>([])
  const [alunoId, setAlunoId] = useState(alunoIdParam ?? '')
  const [boletim, setBoletim] = useState<{
    disciplinas: { nome: string; notas: { tipo: string; valor: number }[]; media: number }[]
    totalFaltas: number
    totalAulas: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getAlunosDoResponsavel().then((res) => {
      if (!res.error) setAlunos(res.data ?? [])
      setIsLoading(false)
      if (alunoIdParam && res.data) {
        const aluno = res.data.find((a) => a.id === alunoIdParam)
        if (aluno) setAlunoId(alunoIdParam)
      }
    })
  }, [alunoIdParam])

  useEffect(() => {
    if (!alunoId) { setBoletim(null); return }
    getBoletimAluno(alunoId).then((res) => {
      setBoletim(res.data)
    })
  }, [alunoId])

  const alunoSelecionado = alunos.find((a) => a.id === alunoId)
  const pctFrequencia = boletim && boletim.totalAulas > 0
    ? Math.round(((boletim.totalAulas - boletim.totalFaltas) / boletim.totalAulas) * 100)
    : 0

  return (
    <div>
      <h1 className="text-xl font-bold text-zab-verde mb-6">Boletim</h1>

      {isLoading ? (
        <div className="animate-pulse h-20 rounded-xl bg-stone-200" />
      ) : (
        <>
          <div className="mb-4">
            <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-zab-texto">
              <option value="">Selecione o aluno</option>
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>{a.nome_completo}</option>
              ))}
            </select>
          </div>

          {alunoSelecionado && (
            <div className="mb-4 rounded-xl bg-zab-verde-claro p-3 text-sm">
              <span className="font-medium text-zab-verde">{alunoSelecionado.nome_completo}</span>
              <span className="text-gray-500"> · {alunoSelecionado.turma_serie}</span>
            </div>
          )}

          {!boletim ? (
            <div className="rounded-xl bg-white border border-stone-200 p-8 text-center text-sm text-gray-400">
              {alunoId ? 'Nenhum dado disponível para o boletim.' : 'Selecione um aluno para ver o boletim.'}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white border border-stone-200 p-4 text-center">
                  <p className="text-2xl font-bold text-zab-verde">{boletim.disciplinas.length}</p>
                  <p className="text-xs text-gray-500">Disciplinas</p>
                </div>
                <div className="rounded-xl bg-white border border-stone-200 p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{boletim.totalFaltas}</p>
                  <p className="text-xs text-gray-500">Faltas</p>
                </div>
                <div className="rounded-xl bg-white border border-stone-200 p-4 text-center">
                  <p className={`text-2xl font-bold ${pctFrequencia >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                    {pctFrequencia}%
                  </p>
                  <p className="text-xs text-gray-500">Frequência</p>
                </div>
              </div>

              {/* Notas por disciplina */}
              <h2 className="text-sm font-semibold text-zab-verde mt-6">Desempenho por Disciplina</h2>
              <div className="space-y-2">
                {boletim.disciplinas.map((d) => (
                  <div key={d.nome} className="rounded-xl bg-white border border-stone-200 overflow-hidden">
                    <div className="bg-zab-off-white px-4 py-2 flex items-center justify-between border-b border-stone-200">
                      <span className="text-sm font-medium text-zab-verde">{d.nome}</span>
                      <span className={`text-lg font-bold ${d.media >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                        {d.media.toFixed(1)}
                      </span>
                    </div>
                    {d.notas.length > 0 ? (
                      <div className="divide-y divide-stone-100">
                        {(() => {
                          // Agrupar por tipo
                          const grouped = new Map<string, { label: string; valores: number[] }>()
                          for (const n of d.notas) {
                            const labels: Record<string, string> = {
                              prova: 'Prova',
                              trabalho: 'Trabalho',
                              recuperacao: 'Recuperação',
                              media_final: 'Média Final',
                            }
                            const label = labels[n.tipo] ?? n.tipo
                            if (!grouped.has(n.tipo)) grouped.set(n.tipo, { label, valores: [] })
                            grouped.get(n.tipo)!.valores.push(n.valor)
                          }
                          return Array.from(grouped.values()).map((g) => (
                            <div key={g.label} className="flex items-center justify-between px-4 py-2 text-sm">
                              <span className="text-gray-500">{g.label}</span>
                              <span className="font-medium text-zab-texto">{g.valores.join(' / ')}</span>
                            </div>
                          ))
                        })()}
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-xs text-gray-400">Nenhuma nota registrada.</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
