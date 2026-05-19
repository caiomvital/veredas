'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listarTurmas } from '@/lib/actions/turmas'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Users } from 'lucide-react'
import type { Turma } from '@/types/entities'

export default function CoordenadorBoletinsPage() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listarTurmas().then((res) => {
      if (res.error) setError(res.error)
      else setTurmas(res.data ?? [])
      setIsLoading(false)
    })
  }, [])

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Boletins Escolares</h1>
        <p className="mt-1 text-sm text-gray-500">Selecione a turma para visualizar os boletins.</p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {turmas.length === 0 && !error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <FileText size={40} className="text-gray-300" />
            <p className="text-sm text-gray-500">Nenhuma turma encontrada.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {turmas.map((t) => (
          <Link key={t.id} href={`/app/professor/boletins?turma_id=${t.id}`}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500 text-white">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-semibold text-zab-texto-escuro">{t.codigo}</p>
                  <p className="text-xs text-gray-500">{t.serie} · {t.turno}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
