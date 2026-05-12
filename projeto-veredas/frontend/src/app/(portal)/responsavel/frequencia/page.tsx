'use client'

import { Suspense, useEffect, useState } from 'react'
import { getAlunosDoResponsavel, getFrequenciasAluno, type AlunoResponsavelView } from '@/lib/actions/responsavel'
import type { Frequencia } from '@/types/entities'
import { useSearchParams } from 'next/navigation'

function FrequenciaContent() {
  const searchParams = useSearchParams()
  const alunoIdParam = searchParams.get('aluno')
  const [alunos, setAlunos] = useState<AlunoResponsavelView[]>([])
  const [alunoId, setAlunoId] = useState(alunoIdParam ?? '')
  const [frequencias, setFrequencias] = useState<(Frequencia & { disciplina_nome: string })[]>([])
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
    if (!alunoId) { setFrequencias([]); return }
    getFrequenciasAluno(alunoId).then((res) => {
      setFrequencias(res.data ?? [])
    })
  }, [alunoId])

  const alunoSelecionado = alunos.find((a) => a.id === alunoId)

  // Agrupar por disciplina
  const porDisciplina = new Map<string, { nome: string; presencas: number; faltas: number; total: number }>()
  for (const f of frequencias) {
    const key = f.disciplina_nome
    if (!porDisciplina.has(key)) porDisciplina.set(key, { nome: key, presencas: 0, faltas: 0, total: 0 })
    const entry = porDisciplina.get(key)!
    entry.total++
    if (f.presenca) entry.presencas++
    else entry.faltas++
  }

  const totalPresencas = frequencias.filter((f) => f.presenca).length
  const totalFaltas = frequencias.filter((f) => !f.presenca).length
  const horasAula = 4 // média de horas-aula por dia
  const totalHorasFaltas = totalFaltas * horasAula

  return (
    <div>
      <h1 className="text-xl font-bold text-zab-verde mb-6">Frequência</h1>

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

          {frequencias.length === 0 ? (
            <div className="rounded-xl bg-white border border-stone-200 p-8 text-center text-sm text-gray-400">
              {alunoId ? 'Nenhum registro de frequência.' : 'Selecione um aluno para ver a frequência.'}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumo geral */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white border border-stone-200 p-4 text-center">
                  <p className="text-2xl font-bold text-zab-verde">{totalPresencas}</p>
                  <p className="text-xs text-gray-500">Presenças</p>
                </div>
                <div className="rounded-xl bg-white border border-stone-200 p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{totalFaltas}</p>
                  <p className="text-xs text-gray-500">Faltas</p>
                </div>
                <div className="rounded-xl bg-white border border-stone-200 p-4 text-center">
                  <p className="text-2xl font-bold text-zab-dourado">{totalHorasFaltas}h</p>
                  <p className="text-xs text-gray-500">Total horas falta</p>
                </div>
              </div>

              {/* Por disciplina */}
              <h2 className="text-sm font-semibold text-zab-verde mt-6">Por Disciplina</h2>
              <div className="space-y-2">
                {Array.from(porDisciplina.values()).map((d) => {
                  const pct = d.total > 0 ? Math.round((d.presencas / d.total) * 100) : 0
                  return (
                    <div key={d.nome} className="rounded-xl bg-white border border-stone-200 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-zab-verde">{d.nome}</span>
                        <span className={`text-sm font-bold ${pct >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pct >= 75 ? 'bg-green-500' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>{d.presencas} presentes</span>
                        <span>{d.faltas} faltas</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Últimos registros */}
              <h2 className="text-sm font-semibold text-zab-verde mt-6">Últimos Registros</h2>
              <div className="space-y-1">
                {frequencias.slice(-20).reverse().map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-lg bg-white border border-stone-200 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${f.presenca ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-zab-texto">{f.disciplina_nome}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(f.data_aula + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
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

export default function ResponsavelFrequenciaPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-20 rounded-xl bg-stone-200" />}>
      <FrequenciaContent />
    </Suspense>
  )
}
