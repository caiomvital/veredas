'use client'

import { Suspense, useEffect, useState } from 'react'
import { getAlunosDoResponsavel, getFrequenciasAluno, type AlunoResponsavelView } from '@/lib/actions/responsavel'
import { justificarFalta, verificarFaltaJustificada } from '@/lib/actions/justificativas'
import type { Frequencia } from '@/types/entities'
import { useSearchParams } from 'next/navigation'
import { Loader2, Check, X, MessageCircle, AlertTriangle } from 'lucide-react'

const MOTIVOS = [
  { value: 'doenca', label: 'Doença' },
  { value: 'consulta_medica', label: 'Consulta Médica' },
  { value: 'viagem', label: 'Viagem' },
  { value: 'outro', label: 'Outro' },
]

function formatDate(d: string) {
  try { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') } catch { return d }
}

function JustifyModal({
  frequencia,
  onClose,
  onJustified,
}: {
  frequencia: { id: string; disciplina_nome: string; data_aula: string }
  onClose: () => void
  onJustified: () => void
}) {
  const [motivo, setMotivo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    if (!motivo) { setError('Selecione um motivo.'); return }
    setIsSubmitting(true)
    setError(null)
    const res = await justificarFalta(frequencia.id, motivo, descricao)
    if (res.error) setError(res.error)
    else { setSuccess(true); setTimeout(() => { onJustified(); onClose() }, 1500) }
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-zab-verde mb-1">Justificar Falta</h3>
        <p className="text-sm text-gray-500 mb-4">{frequencia.disciplina_nome} — {formatDate(frequencia.data_aula)}</p>

        {success ? (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <Check size={18} /> Justificativa enviada com sucesso!
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Motivo</label>
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm">
                <option value="">Selecione...</option>
                {MOTIVOS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descrição (opcional)</label>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm min-h-[80px]"
                placeholder="Descreva o motivo da falta..." />
            </div>

            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="flex-1 rounded-xl bg-zab-verde px-4 py-2.5 text-sm font-medium text-white hover:bg-zab-verde/90 disabled:opacity-60 transition-colors">
                {isSubmitting ? 'Enviando...' : 'Enviar Justificativa'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function FrequenciaContent() {
  const searchParams = useSearchParams()
  const alunoIdParam = searchParams.get('aluno')
  const [alunos, setAlunos] = useState<AlunoResponsavelView[]>([])
  const [alunoId, setAlunoId] = useState(alunoIdParam ?? '')
  const [frequencias, setFrequencias] = useState<(Frequencia & { disciplina_nome: string })[]>([])
  const [justificadas, setJustificadas] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [justifyFreq, setJustifyFreq] = useState<{ id: string; disciplina_nome: string; data_aula: string } | null>(null)

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

  // Check which faltas are already justified
  useEffect(() => {
    const faltas = frequencias.filter((f) => !f.presenca)
    if (faltas.length === 0) return
    const justified = new Set<string>()
    Promise.all(faltas.map((f) =>
      verificarFaltaJustificada(f.id).then((res) => {
        if (res.data) justified.add(f.id)
      })
    )).then(() => setJustificadas(justified))
  }, [frequencias])

  const alunoSelecionado = alunos.find((a) => a.id === alunoId)

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
  const horasAula = 4
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
              {/* Resumo */}
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
                {frequencias.slice(-20).reverse().map((f) => {
                  const justified = justificadas.has(f.id)
                  return (
                    <div key={f.id}
                      className="flex items-center justify-between rounded-lg bg-white border border-stone-200 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${f.presenca ? 'bg-green-500' : justified ? 'bg-blue-400' : 'bg-red-500'}`} />
                        <span className="text-zab-texto">{f.disciplina_nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {formatDate(f.data_aula)}
                        </span>
                        {!f.presenca && !justified && (
                          <button onClick={() => setJustifyFreq({ id: f.id, disciplina_nome: f.disciplina_nome, data_aula: f.data_aula })}
                            className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600 hover:bg-blue-200 transition-colors">
                            <MessageCircle size={10} /> Justificar
                          </button>
                        )}
                        {justified && (
                          <span className="flex items-center gap-1 text-[10px] text-blue-500 font-medium">
                            <Check size={10} /> Justificada
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Justify Modal */}
      {justifyFreq && (
        <JustifyModal
          frequencia={justifyFreq}
          onClose={() => setJustifyFreq(null)}
          onJustified={() => setJustificadas((prev) => new Set(prev).add(justifyFreq.id))}
        />
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
