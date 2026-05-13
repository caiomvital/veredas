'use client'

import { useEffect, useState } from 'react'
import { listarJustificativasPendentes, analisarJustificativa, type JustificativaFalta } from '@/lib/actions/justificativas'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Check, X, AlertTriangle, Search } from 'lucide-react'

const MOTIVO_LABEL: Record<string, string> = {
  doenca: 'Doença',
  consulta_medica: 'Consulta Médica',
  viagem: 'Viagem',
  outro: 'Outro',
}

export default function JustificativasPage() {
  const [justificativas, setJustificativas] = useState<JustificativaFalta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processando, setProcessando] = useState<string | null>(null)
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    listarJustificativasPendentes().then((res) => {
      if (res.error) setError(res.error)
      else setJustificativas(res.data ?? [])
      setIsLoading(false)
    })
  }, [])

  async function handleAnalisar(id: string, status: 'aceita' | 'recusada') {
    setProcessando(id)
    const res = await analisarJustificativa(id, status)
    if (res.error) setError(res.error)
    else setJustificativas((prev) => prev.filter((j) => j.id !== id))
    setProcessando(null)
  }

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-zab-verde" /></div>

  const pendentes = justificativas.filter((j) => j.status === 'pendente')
  const historico = justificativas.filter((j) => j.status !== 'pendente')

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-primary-800)]">Justificativas de Falta</h1>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Pendentes */}
      <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">
        Pendentes {pendentes.length > 0 && <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-600">{pendentes.length}</span>}
      </h2>

      {pendentes.length === 0 ? (
        <Card className="mb-8">
          <CardContent className="p-8 text-center text-sm text-gray-400">
            <Check size={32} className="mx-auto mb-2 text-green-400" />
            Nenhuma justificativa pendente.
          </CardContent>
        </Card>
      ) : (
        <div className="mb-8 space-y-3">
          {pendentes.map((j) => (
            <Card key={j.id} className="border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span className="font-medium text-gray-800">{j.alunoNome}</span>
                      <span className="text-xs text-gray-400">{j.disciplinaNome}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {j.responsavelNome} · {new Date(j.dataAula + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="font-medium text-gray-600">Motivo:</span> {MOTIVO_LABEL[j.motivo] ?? j.motivo}
                    </p>
                    {j.descricao && (
                      <p className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">Descrição:</span> {j.descricao}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleAnalisar(j.id, 'aceita')}
                      disabled={processando === j.id}
                      className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                    >
                      {processando === j.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />}
                      Aceitar
                    </button>
                    <button
                      onClick={() => handleAnalisar(j.id, 'recusada')}
                      disabled={processando === j.id}
                      className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      <X size={14} />
                      Recusar
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Histórico */}
      {historico.length > 0 && (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">Histórico</h2>
          <div className="space-y-2">
            {historico.map((j) => (
              <Card key={j.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{j.alunoNome}</p>
                      <p className="text-xs text-gray-400">
                        {j.responsavelNome} · {new Date(j.dataAula + 'T00:00:00').toLocaleDateString('pt-BR')}
                        · {MOTIVO_LABEL[j.motivo] ?? j.motivo}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      j.status === 'aceita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {j.status === 'aceita' ? 'Aceita' : 'Recusada'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
