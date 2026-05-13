'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { listarComunicados, marcarComunicadoLido } from '@/lib/actions/comunicados'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Comunicado } from '@/types/entities'

const PERFIL_CRIA_COMUNICADO = ['admin', 'coordenador']

export default function ComunicadosListPage() {
  const { perfil } = useAuth()
  const [comunicados, setComunicados] = useState<Comunicado[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const res = await listarComunicados()
    if (res.error) setError(res.error)
    else setComunicados(res.data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleMarcarLido(id: string) {
    await marcarComunicadoLido(id)
    setComunicados((prev) => prev.map((c) => c.id === id ? { ...c, lida: true, lida_em: new Date().toISOString() } : c))
  }

  const podeCriar = perfil && PERFIL_CRIA_COMUNICADO.includes(perfil)
  const naoLidas = comunicados.filter((c) => !c.lida).length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Comunicados</h1>
          <p className="text-sm text-gray-500 mt-1">
            {naoLidas > 0 ? `${naoLidas} não lido${naoLidas > 1 ? 's' : ''}` : 'Todos lidos'}
          </p>
        </div>
        {podeCriar && (
          <Link href="/app/comunicados/novo">
            <Button size="sm">Novo Comunicado</Button>
          </Link>
        )}
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : comunicados.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-400">
            Nenhum comunicado publicado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {comunicados.map((c) => (
            <div key={c.id}
              className={`rounded-lg border border-border bg-white shadow-sm cursor-pointer transition-colors hover:border-[var(--color-primary-300)] ${!c.lida ? 'border-l-4 border-l-[var(--color-primary)]' : ''}`}
              onClick={() => {
                setSelectedId(selectedId === c.id ? null : c.id)
                if (!c.lida) handleMarcarLido(c.id)
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!c.lida && <Badge variant="info">Novo</Badge>}
                      <h3 className="font-semibold text-[var(--color-primary-800)] truncate">{c.titulo}</h3>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(c.data_publicacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                {selectedId === c.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{c.corpo}</p>
                    {c.requer_confirmacao && (
                      <Link
                        href={`/comunicados/${c.id}/confirmacoes`}
                        className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver confirmações de presença
                      </Link>
                    )}
                    {c.lida_em && (
                      <p className="mt-2 text-xs text-gray-400">
                        Lido em {new Date(c.lida_em).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
