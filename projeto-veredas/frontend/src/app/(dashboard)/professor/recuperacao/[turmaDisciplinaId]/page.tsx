'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getFuncionarioByUser, getTurmasDoProfessor } from '@/lib/actions/academico'
import { listarPeriodos } from '@/lib/actions/periodos'
import { listarAlunosRecuperacao, salvarNotasRecuperacao } from '@/lib/actions/recuperacao'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Save, AlertTriangle } from 'lucide-react'
import type { PeriodoLetivo } from '@/types/entities'

export default function LancarRecuperacaoPage() {
  const params = useParams()
  const turmaDisciplinaId = params.turmaDisciplinaId as string

  const [turmaInfo, setTurmaInfo] = useState<{ turma_codigo: string; turma_serie: string; disciplina_nome: string } | null>(null)
  const [periodos, setPeriodos] = useState<PeriodoLetivo[]>([])
  const [selectedPeriodo, setSelectedPeriodo] = useState('')
  const [alunos, setAlunos] = useState<Array<{ matriculaId: string; alunoNome: string; mediaAtual: number; notaRecuperacao?: number }>>([])
  const [notas, setNotas] = useState<Record<string, string>>({})
  const [mediaMinima, setMediaMinima] = useState(7)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const funcRes = await getFuncionarioByUser()
      if (funcRes.error || !funcRes.data) { setError(funcRes.error ?? 'Não autenticado'); setIsLoading(false); return }

      const turmasRes = await getTurmasDoProfessor(funcRes.data.id)
      if (turmasRes.error) { setError(turmasRes.error); setIsLoading(false); return }
      const turma = (turmasRes.data ?? []).find((t: Record<string, unknown>) => t.id === turmaDisciplinaId) as Record<string, unknown> | undefined
      if (!turma) { setError('Turma não encontrada'); setIsLoading(false); return }

      setTurmaInfo({
        turma_codigo: turma.turma_codigo as string,
        turma_serie: turma.turma_serie as string,
        disciplina_nome: turma.disciplina_nome as string,
      })

      const perRes = await listarPeriodos()
      if (!perRes.error) {
        const perData = perRes.data ?? []
        setPeriodos(perData)
        if (perData.length > 0) setSelectedPeriodo(perData[0].id)
      }

      setIsLoading(false)
    } catch {
      setError('Erro ao carregar dados')
      setIsLoading(false)
    }
  }, [turmaDisciplinaId])

  useEffect(() => { loadData() }, [loadData])

  // Load alunos when periodo changes
  useEffect(() => {
    if (!selectedPeriodo) return
    async function load() {
      const res = await listarAlunosRecuperacao(turmaDisciplinaId, selectedPeriodo)
      if (res.error) { setError(res.error); return }
      if (res.data) {
        setAlunos(res.data.alunos)
        setMediaMinima(res.data.mediaMinima)
        const map: Record<string, string> = {}
        for (const a of res.data.alunos) {
          if (a.notaRecuperacao !== undefined) map[a.matriculaId] = String(a.notaRecuperacao)
        }
        setNotas(map)
      }
    }
    load()
  }, [selectedPeriodo, turmaDisciplinaId])

  const alunosElegiveis = alunos.filter((a) => a.mediaAtual < mediaMinima)

  function updateNota(matriculaId: string, valor: string) {
    if (valor !== '' && !/^\d*\.?\d{0,2}$/.test(valor)) return
    if (valor !== '' && parseFloat(valor) > 10) return
    setNotas((prev) => ({ ...prev, [matriculaId]: valor }))
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    const rows = alunosElegiveis
      .map((a) => {
        const v = notas[a.matriculaId]
        if (v === undefined || v === '') return null
        return { matriculaId: a.matriculaId, valor: parseFloat(v) }
      })
      .filter((r): r is { matriculaId: string; valor: number } => r !== null)

    if (rows.length === 0) {
      setError('Nenhuma nota para salvar.')
      setIsSaving(false)
      return
    }

    const result = await salvarNotasRecuperacao(turmaDisciplinaId, selectedPeriodo, rows)
    if (result.error) setError(result.error)
    else { setSuccess(true); setTimeout(() => setSuccess(false), 3000) }
    setIsSaving(false)
  }

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>

  if (error && !turmaInfo) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error}</p>
        <Link href="/professor/recuperacao" className="mt-4 inline-block text-sm text-primary hover:underline">← Voltar</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/professor/recuperacao" className="text-sm text-primary hover:underline">← Voltar</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">
          Recuperação — {turmaInfo?.turma_codigo} {turmaInfo?.turma_serie}
        </h1>
        <p className="text-sm text-gray-500">{turmaInfo?.disciplina_nome}</p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {success && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4 text-sm text-green-700">Notas de recuperação salvas com sucesso!</CardContent>
        </Card>
      )}

      <div className="mb-4">
        <Select
          label="Período"
          options={periodos.map((p) => ({ value: p.id, label: `${p.nome} (${p.ano_letivo})` }))}
          value={selectedPeriodo}
          onChange={(e) => setSelectedPeriodo(e.target.value)}
          className="w-64"
        />
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-purple-50 border border-purple-200 px-4 py-2 text-sm text-purple-700">
        <AlertTriangle size={16} />
        Mostrando alunos com média abaixo de <strong>{mediaMinima}</strong> ({alunosElegiveis.length} de {alunos.length} alunos)
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[var(--color-primary-50)]">
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-[var(--color-primary-800)]">Aluno</th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium text-[var(--color-primary-800)] w-24">Média Atual</th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium text-[var(--color-primary-800)] w-28">Nota Recuperação</th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium text-[var(--color-primary-800)] w-24">Média Final</th>
              </tr>
            </thead>
            <tbody>
              {alunos.map((aluno, idx) => {
                const notaRec = notas[aluno.matriculaId]
                const notaRecNum = notaRec ? parseFloat(notaRec) : undefined
                const mediaFinal = notaRecNum !== undefined
                  ? Math.round(((aluno.mediaAtual + notaRecNum) / 2) * 10) / 10
                  : undefined
                const elegivel = aluno.mediaAtual < mediaMinima
                return (
                  <tr key={aluno.matriculaId} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${!elegivel ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-2 text-gray-800">{aluno.alunoNome}</td>
                    <td className={`px-4 py-2 text-center font-medium ${elegivel ? 'text-red-600' : 'text-green-600'}`}>
                      {aluno.mediaAtual.toFixed(1)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {elegivel ? (
                        <Input
                          className="mx-auto w-20 text-center"
                          placeholder="0-10"
                          value={notaRec ?? ''}
                          onChange={(e) => updateNota(aluno.matriculaId, e.target.value)}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center font-semibold">
                      {mediaFinal !== undefined ? mediaFinal.toFixed(1) : '—'}
                    </td>
                  </tr>
                )
              })}
              {alunos.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-sm text-gray-400">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleSave} isLoading={isSaving}>
          <Save size={18} /> Salvar Notas de Recuperação
        </Button>
      </div>
    </div>
  )
}
