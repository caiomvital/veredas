'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getFuncionarioByUser, getTurmasDoProfessor, getAlunosDaTurma, getNotas, salvarNotas } from '@/lib/actions/academico'
import { listarPeriodos } from '@/lib/actions/periodos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Save } from 'lucide-react'
import type { PeriodoLetivo } from '@/types/entities'

type NotasMap = Record<string, Record<string, string>> // matricula_id -> tipo -> valor

export default function LancarNotasPage() {
  const params = useParams()
  const router = useRouter()
  const turmaDisciplinaId = params.turmaDisciplinaId as string

  const [turmaInfo, setTurmaInfo] = useState<{ turma_codigo: string; turma_serie: string; disciplina_nome: string; turma_id: string } | null>(null)
  const [alunos, setAlunos] = useState<Array<{ matricula_id: string; nome_completo: string }>>([])
  const [periodos, setPeriodos] = useState<PeriodoLetivo[]>([])
  const [selectedPeriodo, setSelectedPeriodo] = useState('')
  const [notas, setNotas] = useState<NotasMap>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const tipos = ['prova', 'trabalho', 'recuperacao'] as const
  const tipoLabels: Record<string, string> = { prova: 'Prova', trabalho: 'Trabalho', recuperacao: 'Recuperação' }

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Get funcionario
      const funcRes = await getFuncionarioByUser()
      if (funcRes.error || !funcRes.data) { setError(funcRes.error ?? 'Não autenticado'); setIsLoading(false); return }

      // Get turmas and find this one
      const turmasRes = await getTurmasDoProfessor(funcRes.data.id)
      if (turmasRes.error) { setError(turmasRes.error); setIsLoading(false); return }
      const turma = (turmasRes.data ?? []).find((t: Record<string, unknown>) => t.id === turmaDisciplinaId) as Record<string, unknown> | undefined
      if (!turma) { setError('Turma não encontrada'); setIsLoading(false); return }

      setTurmaInfo({
        turma_codigo: turma.turma_codigo as string,
        turma_serie: turma.turma_serie as string,
        disciplina_nome: turma.disciplina_nome as string,
        turma_id: turma.turma_id as string,
      })

      // Load alunos
      const alunosRes = await getAlunosDaTurma(turma.turma_id as string)
      if (alunosRes.error) { setError(alunosRes.error); setIsLoading(false); return }
      setAlunos((alunosRes.data ?? []) as Array<{ matricula_id: string; nome_completo: string }>)

      // Load periodos
      const perRes = await listarPeriodos()
      if (perRes.error) { setError(perRes.error); setIsLoading(false); return }
      const perData = perRes.data ?? []
      setPeriodos(perData)
      if (perData.length > 0) setSelectedPeriodo(perData[0].id)

      setIsLoading(false)
    } catch {
      setError('Erro ao carregar dados')
      setIsLoading(false)
    }
  }, [turmaDisciplinaId])

  useEffect(() => { loadData() }, [loadData])

  // Load existing notas when periodo changes
  useEffect(() => {
    if (!selectedPeriodo) return
    async function loadNotas() {
      const res = await getNotas(turmaDisciplinaId, selectedPeriodo)
      if (res.data) {
        const map: NotasMap = {}
        for (const n of res.data as Array<Record<string, unknown>>) {
          const mid = n.matricula_id as string
          const tipo = n.tipo as string
          if (!map[mid]) map[mid] = {}
          map[mid][tipo] = String(n.valor)
        }
        setNotas(map)
      }
    }
    loadNotas()
  }, [selectedPeriodo, turmaDisciplinaId])

  function updateNota(matriculaId: string, tipo: string, valor: string) {
    // Allow only valid decimal input
    if (valor !== '' && !/^\d*\.?\d{0,2}$/.test(valor)) return
    if (valor !== '' && parseFloat(valor) > 10) return
    setNotas((prev) => ({
      ...prev,
      [matriculaId]: { ...(prev[matriculaId] ?? {}), [tipo]: valor },
    }))
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    const rows: Array<{ matricula_id: string; periodo_id: string; valor: number; tipo: string }> = []
    for (const aluno of alunos) {
      for (const tipo of tipos) {
        const v = notas[aluno.matricula_id]?.[tipo]
        if (v !== undefined && v !== '') {
          rows.push({
            matricula_id: aluno.matricula_id,
            periodo_id: selectedPeriodo,
            valor: parseFloat(v),
            tipo,
          })
        }
      }
    }

    if (rows.length === 0) {
      setError('Nenhuma nota para salvar. Preencha ao menos uma nota.')
      setIsSaving(false)
      return
    }

    const result = await salvarNotas(turmaDisciplinaId, rows)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
  }

  if (error && !turmaInfo) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error}</p>
        <Link href="/professor/notas" className="mt-4 inline-block text-sm text-primary hover:underline">← Voltar</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/professor/notas" className="text-sm text-primary hover:underline">← Voltar</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">
          Notas — {turmaInfo?.turma_codigo} {turmaInfo?.turma_serie}
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
          <CardContent className="p-4 text-sm text-green-700">Notas salvas com sucesso!</CardContent>
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

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[var(--color-primary-50)]">
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-[var(--color-primary-800)]">Aluno</th>
                {tipos.map((t) => (
                  <th key={t} className="whitespace-nowrap px-4 py-3 text-center font-medium text-[var(--color-primary-800)] w-28">
                    {tipoLabels[t]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alunos.map((aluno, idx) => (
                <tr key={aluno.matricula_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-gray-800">{aluno.nome_completo}</td>
                  {tipos.map((tipo) => (
                    <td key={tipo} className="px-4 py-2 text-center">
                      <Input
                        className="mx-auto w-20 text-center"
                        placeholder="0-10"
                        value={notas[aluno.matricula_id]?.[tipo] ?? ''}
                        onChange={(e) => updateNota(aluno.matricula_id, tipo, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              {alunos.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-sm text-gray-400">
                    Nenhum aluno encontrado nesta turma.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleSave} isLoading={isSaving}>
          <Save size={18} /> Salvar Notas
        </Button>
      </div>
    </div>
  )
}
