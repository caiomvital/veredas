'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getConfirmadosComunicado } from '@/lib/actions/comunicados'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react'

export default function ConfirmacoesPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<{ confirmados: number; total: number; lista: { responsavel_nome: string; confirmado: boolean }[] } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!params.id) return
    setIsLoading(true)
    getConfirmadosComunicado(params.id as string).then((res) => {
      if (res.error) setError(res.error)
      else setData(res.data)
      setIsLoading(false)
    })
  }, [params.id])

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={16} className="mr-1" /> Voltar
        </Button>
        <h1 className="text-xl font-bold text-[var(--color-primary-800)]">Confirmações de Presença</h1>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
        </div>
      ) : data ? (
        <>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 rounded-xl bg-white border border-stone-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{data.confirmados}</p>
              <p className="text-xs text-gray-500">Confirmaram</p>
            </div>
            <div className="flex-1 rounded-xl bg-white border border-stone-200 p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{data.total - data.confirmados}</p>
              <p className="text-xs text-gray-500">Pendentes</p>
            </div>
            <div className="flex-1 rounded-xl bg-white border border-stone-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{data.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {data.lista.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">
                  Nenhum responsável respondeu ainda.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {data.lista.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-zab-texto">{item.responsavel_nome}</span>
                      {item.confirmado ? (
                        <span className="flex items-center gap-1 text-xs text-green-700">
                          <CheckCircle size={14} /> Confirmado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-600">
                          <XCircle size={14} /> Não confirmou
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" size="sm" className="mt-4" onClick={() => window.print()}>
            Imprimir Lista
          </Button>
        </>
      ) : null}
    </div>
  )
}
