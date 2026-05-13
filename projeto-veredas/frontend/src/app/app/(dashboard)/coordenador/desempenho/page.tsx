'use client'

import { useEffect, useState, useCallback } from 'react'
import { listarTurmas } from '@/lib/actions/turmas'
import { listarPeriodos } from '@/lib/actions/periodos'
import { calcularDesempenhoTurma, SITUACAO_LABEL, SITUACAO_COR, type AlunoDesempenho } from '@/lib/actions/desempenho'
import { Card, CardContent } from '@/components/ui/card'
import type { Turma, PeriodoLetivo } from '@/types/entities'

export default function DesempenhoPage() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [periodos, setPeriodos] = useState<PeriodoLetivo[]>([])
  const [turmaId, setTurmaId] = useState('')
  const [periodoId, setPeriodoId] = useState('')
  const [alunos, setAlunos] = useState<AlunoDesempenho[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listarTurmas(), listarPeriodos()]).then(([t, p]) => {
      if (!t.error) setTurmas(t.data ?? [])
      if (!p.error) setPeriodos(p.data ?? [])
      setIsLoading(false)
    })
  }, [])

  const handleCalcular = useCallback(async () => {
    if (!turmaId || !periodoId) return
    setIsCalculating(true)
    setError(null)
    const res = await calcularDesempenhoTurma(turmaId, periodoId)
    if (res.error) setError(res.error)
    else setAlunos(res.data ?? [])
    setIsCalculating(false)
  }, [turmaId, periodoId])

  const totalAprovados = alunos.filter((a) => a.situacao === 'aprovado').length
  const totalRecuperacao = alunos.filter((a) => a.situacao === 'recuperacao').length
  const totalReprovados = alunos.filter((a) => a.situacao === 'reprovado' || a.situacao === 'reprovado_falta').length

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-primary-800)]">Desempenho de Alunos</h1>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Turma</label>
              <select value={turmaId} onChange={(e) => setTurmaId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="">Selecione a turma</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>{t.codigo} — {t.serie} ({t.turno})</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Período</label>
              <select value={periodoId} onChange={(e) => setPeriodoId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="">Selecione o período</option>
                {periodos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome} — {p.ano_letivo}</option>
                ))}
              </select>
            </div>
            <button onClick={handleCalcular} disabled={!turmaId || !periodoId || isCalculating}
              className="rounded-lg bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 transition-opacity">
              {isCalculating ? 'Calculando...' : 'Calcular'}
            </button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-gray-100" />)}
        </div>
      ) : alunos.length > 0 ? (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{totalAprovados}</p>
                <p className="text-xs text-green-600">Aprovados</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-700">{totalRecuperacao}</p>
                <p className="text-xs text-yellow-600">Recuperação</p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{totalReprovados}</p>
                <p className="text-xs text-red-600">Reprovados</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Aluno</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Média Geral</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Frequência</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {alunos.map((a) => (
                  <tr key={a.alunoId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{a.alunoNome}</td>
                    <td className="px-4 py-3 text-center">{a.mediaGeral.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center">{a.frequenciaPct}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${SITUACAO_COR[a.situacao]}`}>
                        {SITUACAO_LABEL[a.situacao]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detalhamento por aluno */}
          <div className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-primary-800)]">Detalhamento por Aluno</h2>
            {alunos.map((a) => (
              <Card key={a.alunoId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-[var(--color-primary-800)]">{a.alunoNome}</h3>
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${SITUACAO_COR[a.situacao]}`}>
                      {SITUACAO_LABEL[a.situacao]}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Disciplina</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-500">Média</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-500">Recuperação</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-500">Média Final</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {a.disciplinas.map((d) => (
                          <tr key={d.disciplinaId}>
                            <td className="px-3 py-2 text-gray-700">{d.disciplinaNome}</td>
                            <td className="px-3 py-2 text-center font-medium">{d.mediaBimestral.toFixed(1)}</td>
                            <td className="px-3 py-2 text-center">{d.notaRecuperacao?.toFixed(1) ?? '—'}</td>
                            <td className="px-3 py-2 text-center">{d.mediaFinal?.toFixed(1) ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Frequência: {a.frequenciaPct}% ({a.totalPresencas}/{a.totalAulas} aulas)
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-400">
            Selecione uma turma, um per&iacute;odo e clique em Calcular.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
