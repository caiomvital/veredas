'use client'

import { Suspense, useEffect, useState } from 'react'
import { getAlunosDoResponsavel, getNotasAluno, type AlunoResponsavelView } from '@/lib/actions/responsavel'
import type { Nota } from '@/types/entities'
import { useSearchParams } from 'next/navigation'

function NotasContent() {
  const searchParams = useSearchParams()
  const alunoIdParam = searchParams.get('aluno')
  const [alunos, setAlunos] = useState<AlunoResponsavelView[]>([])
  const [alunoId, setAlunoId] = useState(alunoIdParam ?? '')
  const [notas, setNotas] = useState<(Nota & { disciplina_nome?: string })[]>([])
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
    if (!alunoId) { setNotas([]); return }
    getNotasAluno(alunoId).then((res) => setNotas(res.data ?? []))
  }, [alunoId])

  const alunoSelecionado = alunos.find((a) => a.id === alunoId)

  return (
    <div>
      <h1 className="text-xl font-bold text-zab-verde mb-6">Notas</h1>

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

          {notas.length === 0 ? (
            <div className="rounded-xl bg-white border border-stone-200 p-8 text-center text-sm text-gray-400">
              {alunoId ? 'Nenhuma nota registrada.' : 'Selecione um aluno para ver as notas.'}
            </div>
          ) : (
            <div className="space-y-2">
              {notas.map((n) => (
                <div key={n.id} className="rounded-xl bg-white border border-stone-200 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zab-verde">{n.disciplina_nome}</p>
                    <p className="text-xs text-gray-500">{n.tipo} · {new Date(n.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="text-lg font-bold text-zab-dourado">{n.valor.toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ResponsavelNotasPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-20 rounded-xl bg-stone-200" />}>
      <NotasContent />
    </Suspense>
  )
}
