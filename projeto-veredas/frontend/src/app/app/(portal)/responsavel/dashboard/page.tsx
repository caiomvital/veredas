'use client'

import { useEffect, useState } from 'react'
import { getAlunosDoResponsavel, type AlunoResponsavelView } from '@/lib/actions/responsavel'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

export default function ResponsavelDashboardPage() {
  const { user } = useAuth()
  const [alunos, setAlunos] = useState<AlunoResponsavelView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAlunosDoResponsavel().then((res) => {
      if (res.error) setError(res.error)
      else setAlunos(res.data ?? [])
      setIsLoading(false)
    })
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zab-verde">Olá, {user?.email}</h1>
        <p className="text-sm text-gray-500 mt-1">Bem-vindo ao Portal do Responsável.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-stone-200" />)}
        </div>
      ) : alunos.length === 0 ? (
        <div className="rounded-xl bg-white border border-stone-200 p-8 text-center">
          <span className="text-4xl">👤</span>
          <p className="mt-3 text-sm text-gray-500">Nenhum aluno vinculado ao seu cadastro.</p>
          <p className="text-xs text-gray-400 mt-1">Entre em contato com a secretaria da escola.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alunos.map((a) => (
            <div key={a.id} className="rounded-xl bg-white border border-stone-200 overflow-hidden">
              <div className="bg-gradient-to-r from-zab-verde to-zab-verde-hover p-4 text-white">
                <h2 className="text-lg font-bold">{a.nome_completo}</h2>
                <p className="text-sm text-zab-verde-claro-3">{a.turma_serie} · {a.turma_codigo} ({a.turma_turno})</p>
              </div>
              <div className="grid grid-cols-3 gap-0">
                {[
                  { label: 'Notas', href: `/responsavel/notas?aluno=${a.id}`, icon: '📝' },
                  { label: 'Frequência', href: `/responsavel/frequencia?aluno=${a.id}`, icon: '✅' },
                  { label: 'Boletim', href: `/responsavel/boletim?aluno=${a.id}`, icon: '📄' },
                ].map((item) => (
                  <Link key={item.label} href={item.href}
                    className="flex flex-col items-center gap-1 py-4 px-2 text-center hover:bg-zab-verde-claro transition-colors border-r border-stone-100 last:border-r-0">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xs font-medium text-zab-texto">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Links rápidos */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/app/responsavel/comunicados"
              className="rounded-xl bg-white border border-stone-200 p-4 hover:border-zab-dourado/30 transition-colors">
              <span className="text-2xl">🔔</span>
              <p className="text-sm font-semibold text-zab-verde mt-2">Comunicados</p>
              <p className="text-xs text-gray-500">Recados da escola</p>
            </Link>
            <Link href="/app/responsavel/calendario"
              className="rounded-xl bg-white border border-stone-200 p-4 hover:border-zab-dourado/30 transition-colors">
              <span className="text-2xl">📅</span>
              <p className="text-sm font-semibold text-zab-verde mt-2">Calendário</p>
              <p className="text-xs text-gray-500">Eventos escolares</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
