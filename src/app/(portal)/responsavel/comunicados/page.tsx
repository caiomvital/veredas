'use client'

import { useEffect, useState } from 'react'
import { getComunicadosResponsavel, marcarComunicadoLidoResponsavel } from '@/lib/actions/responsavel'
import type { Comunicado } from '@/types/entities'

export default function ResponsavelComunicadosPage() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandidoId, setExpandidoId] = useState<string | null>(null)

  function fetchComunicados() {
    setIsLoading(true)
    getComunicadosResponsavel().then((res) => {
      if (res.error) setError(res.error)
      else setComunicados(res.data ?? [])
      setIsLoading(false)
    })
  }

  useEffect(() => { fetchComunicados() }, [])

  async function handleExpandir(c: Comunicado) {
    setExpandidoId(expandidoId === c.id ? null : c.id)
    if (!c.lida) {
      await marcarComunicadoLidoResponsavel(c.id)
      setComunicados((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, lida: true, lida_em: new Date().toISOString() } : item))
      )
    }
  }

  const naoLidos = comunicados.filter((c) => !c.lida).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-zab-verde">Comunicados</h1>
        {naoLidos > 0 && (
          <span className="text-xs bg-zab-dourado text-white px-2 py-0.5 rounded-full">
            {naoLidos} não {naoLidos === 1 ? 'lido' : 'lidos'}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-stone-200" />)}
        </div>
      ) : comunicados.length === 0 ? (
        <div className="rounded-xl bg-white border border-stone-200 p-8 text-center text-sm text-gray-400">
          Nenhum comunicado disponível.
        </div>
      ) : (
        <div className="space-y-2">
          {comunicados.map((c) => (
            <div key={c.id} className="rounded-xl bg-white border border-stone-200 overflow-hidden">
              <button onClick={() => handleExpandir(c)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  {!c.lida && <span className="w-2 h-2 rounded-full bg-zab-dourado shrink-0" />}
                  <div className="min-w-0">
                    <p className={`text-sm truncate ${c.lida ? 'text-zab-texto' : 'font-semibold text-zab-verde'}`}>
                      {c.titulo}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(c.data_publicacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandidoId === c.id ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandidoId === c.id && (
                <div className="px-4 pb-4 pt-0 border-t border-stone-100">
                  <div className="text-sm text-zab-texto leading-relaxed whitespace-pre-wrap mt-3">
                    {c.corpo}
                  </div>
                  {c.lida_em && (
                    <p className="text-xs text-gray-400 mt-3">
                      Lido em {new Date(c.lida_em).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
