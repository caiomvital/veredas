'use client'

import { useState, useEffect, useCallback } from 'react'
import { listarTurmas } from '@/lib/actions/turmas'
import { listarCandidatosRematricula, processarRematricula } from '@/lib/actions/rematricula'
import type { RematriculaAluno } from '@/lib/actions/rematricula'
import type { Turma } from '@/types/entities'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const SITUACAO_LABEL: Record<string, string> = {
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  pendente: 'Pendente',
}

const SITUACAO_VARIANT: Record<string, 'success' | 'danger' | 'warning'> = {
  aprovado: 'success',
  reprovado: 'danger',
  pendente: 'warning',
}

export default function RematriculaPage() {
  const anoAtual = new Date().getFullYear()
  const [anoDestino, setAnoDestino] = useState(anoAtual + 1)
  const [alunos, setAlunos] = useState<RematriculaAluno[]>([])
  const [turmasDestino, setTurmasDestino] = useState<Turma[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ processados: number } | null>(null)
  const [turmaOverride, setTurmaOverride] = useState<Record<string, string>>({})

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setResultado(null)
    const [candidatosRes, turmasRes] = await Promise.all([
      listarCandidatosRematricula(anoDestino),
      listarTurmas({ ano_letivo: anoDestino }),
    ])
    if (candidatosRes.error) setError(candidatosRes.error)
    else setAlunos(candidatosRes.data?.alunos ?? [])
    setTurmasDestino(turmasRes.data ?? [])
    setIsLoading(false)
  }, [anoDestino])

  useEffect(() => { fetchData() }, [fetchData])

  function handleOverride(alunoId: string, turmaId: string) {
    setTurmaOverride((prev) => ({ ...prev, [alunoId]: turmaId }))
  }

  function getTurmaId(a: RematriculaAluno): string | null {
    if (turmaOverride[a.alunoId]) return turmaOverride[a.alunoId]
    return a.turmaSugeridaId
  }

  function getTurmaLabel(a: RematriculaAluno): string {
    const id = getTurmaId(a)
    if (!id) return a.turmaSugeridaCodigo
    const t = turmasDestino.find((t) => t.id === id)
    return t ? `${t.codigo} — ${t.serie}` : a.turmaSugeridaCodigo
  }

  async function handleProcess() {
    const selecionados = alunos.filter((a) => !a.jaRematriculado && !a.ehConcluinte)
    if (selecionados.length === 0) {
      toast.info('Nenhum aluno pendente de rematrícula')
      return
    }
    setIsProcessing(true)
    setError(null)

    const payload = selecionados.map((a) => ({
      alunoId: a.alunoId,
      turmaId: getTurmaId(a) ?? '',
      serieSugerida: a.serieSugerida,
    }))

    const res = await processarRematricula(payload, anoDestino)
    if (res.error) {
      setError(res.error)
      toast.error(res.error)
    } else {
      setResultado(res.data)
      toast.success(`${res.data?.processados} rematrícula(s) processada(s)`)
      fetchData()
    }
    setIsProcessing(false)
  }

  const pendentes = alunos.filter((a) => !a.jaRematriculado && !a.ehConcluinte)
  const concluintes = alunos.filter((a) => a.ehConcluinte)
  const jaFeitos = alunos.filter((a) => a.jaRematriculado)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Rematrícula Anual</h1>
          <p className="mt-1 text-sm text-gray-500">
            Processo de rematrícula do {anoDestino - 1} para {anoDestino}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: String(anoAtual + 1), label: `Para ${anoAtual + 1}` },
            ]}
            value={String(anoDestino)}
            onChange={(e) => setAnoDestino(Number(e.target.value))}
            className="w-36"
          />
          <Button variant="outline" onClick={fetchData} isLoading={isLoading}>
            <RefreshCw size={16} className="mr-1" /> Atualizar
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {resultado && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-green-700">
            <CheckCircle size={20} />
            {resultado.processados} rematrícula(s) realizadas com sucesso para {anoDestino}.
          </CardContent>
        </Card>
      )}

      {!isLoading && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-800">
              Alunos aptos à rematrícula
              <span className="ml-2 text-sm font-normal text-gray-400">({pendentes.length} pendentes)</span>
            </h2>

            {pendentes.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <CheckCircle size={40} className="mb-2 text-green-400" />
                <p className="text-sm">Todos os alunos já foram rematriculados para {anoDestino}.</p>
              </div>
            ) : (
              <>
                {/* Aviso de concluintes */}
                {pendentes.filter((a) => a.ehConcluinte).length > 0 && (
                  <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
                    🎓 {pendentes.filter((a) => a.ehConcluinte).length} aluno(s) concluinte(s) — não serão rematriculados.
                  </div>
                )}
                {/* Aviso de turma não cadastrada */}
                {pendentes.filter((a) => a.semTurmaDisponivel).length > 0 && (
                  <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                    ⚠️ {pendentes.filter((a) => a.semTurmaDisponivel).length} aluno(s) sem turma disponível para a série sugerida. Crie as turmas em {anoDestino} antes de rematricular.
                  </div>
                )}
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase text-gray-500">
                      <th className="px-3 py-2">Aluno</th>
                      <th className="px-3 py-2">Turma Atual</th>
                      <th className="px-3 py-2">Situação</th>
                      <th className="px-3 py-2">Nova Turma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pendentes.map((a) => (
                      <tr key={a.alunoId} className="hover:bg-surface-muted/50">
                        <td className="px-3 py-2.5 font-medium text-gray-800">{a.alunoNome}</td>
                        <td className="px-3 py-2.5 text-gray-600">
                          {a.turmaAtualCodigo} — {a.serieAtual}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant={SITUACAO_VARIANT[a.situacao]}>
                            {SITUACAO_LABEL[a.situacao]}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          {a.ehConcluinte ? (
                            <span className="text-blue-600 text-xs font-medium">🎓 Concluinte</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <ArrowRight size={14} className="text-gray-400 shrink-0" />
                              {a.turmaSugeridaId ? (
                                <select
                                  value={getTurmaId(a) ?? ''}
                                  onChange={(e) => handleOverride(a.alunoId, e.target.value)}
                                  className="rounded border border-border px-2 py-1 text-sm"
                                >
                                  <optgroup label={`Sugerido: ${a.serieSugerida}`}>
                                    {turmasDestino
                                      .filter((t) => t.serie === a.serieSugerida)
                                      .map((t) => (
                                        <option key={t.id} value={t.id}>
                                          {t.codigo} — {t.serie} ({t.turno})
                                        </option>
                                      ))}
                                  </optgroup>
                                  <optgroup label="Outras turmas">
                                    {turmasDestino
                                      .filter((t) => t.serie !== a.serieSugerida)
                                      .map((t) => (
                                        <option key={t.id} value={t.id}>
                                          {t.codigo} — {t.serie} ({t.turno})
                                        </option>
                                      ))}
                                  </optgroup>
                                </select>
                              ) : (
                                <span className={a.semTurmaDisponivel ? 'text-amber-600 text-xs font-medium' : 'text-amber-600 text-xs'}>
                                  {a.turmaSugeridaCodigo}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
            )}
          </CardContent>
        </Card>
      )}

      {concluintes.length > 0 && (
        <Card className="mb-6 border-blue-200">
          <CardContent className="p-6">
            <h2 className="mb-3 text-base font-semibold text-gray-800">
              Concluintes
              <span className="ml-2 text-sm font-normal text-gray-400">({concluintes.length})</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {concluintes.map((a) => (
                <span key={a.alunoId} className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                  🎓 {a.alunoNome}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {jaFeitos.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="mb-3 text-base font-semibold text-gray-800">
              Já rematriculados
              <span className="ml-2 text-sm font-normal text-gray-400">({jaFeitos.length})</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {jaFeitos.map((a) => (
                <span key={a.alunoId} className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">
                  <CheckCircle size={12} /> {a.alunoNome}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pendentes.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleProcess} isLoading={isProcessing} size="lg">
            Processar {pendentes.length} Rematrícula(s)
          </Button>
        </div>
      )}
    </div>
  )
}
