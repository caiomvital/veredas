'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getFuncionarioByUser, getTurmasDoProfessor, getAlunosDaTurma, getFrequencias, salvarFrequencias } from '@/lib/actions/academico'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Save, Check, X } from 'lucide-react'

export default function LancarFrequenciaPage() {
  const params = useParams()
  const turmaDisciplinaId = params.turmaDisciplinaId as string

  const [turmaInfo, setTurmaInfo] = useState<{ turma_codigo: string; turma_serie: string; disciplina_nome: string; turma_id: string } | null>(null)
  const [alunos, setAlunos] = useState<Array<{ matricula_id: string; nome_completo: string }>>([])
  const [dataAula, setDataAula] = useState(new Date().toISOString().split('T')[0])
  const [presencas, setPresencas] = useState<Record<string, boolean>>({})
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
        turma_id: turma.turma_id as string,
      })

      const alunosRes = await getAlunosDaTurma(turma.turma_id as string)
      if (alunosRes.error) { setError(alunosRes.error); setIsLoading(false); return }
      const alunosData = (alunosRes.data ?? []) as Array<{ matricula_id: string; nome_completo: string }>
      setAlunos(alunosData)
      // Default all to present
      const defaultPresencas: Record<string, boolean> = {}
      alunosData.forEach((a: { matricula_id: string }) => { defaultPresencas[a.matricula_id] = true })
      setPresencas(defaultPresencas)
      setIsLoading(false)
    } catch {
      setError('Erro ao carregar dados')
      setIsLoading(false)
    }
  }, [turmaDisciplinaId])

  useEffect(() => { loadData() }, [loadData])

  // Load existing frequencies when date changes
  useEffect(() => {
    if (!dataAula) return
    async function loadFreq() {
      const res = await getFrequencias(turmaDisciplinaId, dataAula)
      if (res.data && res.data.length > 0) {
        const map: Record<string, boolean> = {}
        for (const f of res.data as Array<Record<string, unknown>>) {
          map[f.matricula_id as string] = f.presenca as boolean
        }
        setPresencas((prev) => ({ ...prev, ...map }))
      }
    }
    loadFreq()
  }, [dataAula, turmaDisciplinaId])

  function togglePresenca(matriculaId: string) {
    setPresencas((prev) => ({ ...prev, [matriculaId]: !prev[matriculaId] }))
  }

  function marcarTodas(presenca: boolean) {
    const updated: Record<string, boolean> = {}
    alunos.forEach((a) => { updated[a.matricula_id] = presenca })
    setPresencas(updated)
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    const rows = Object.entries(presencas).map(([matricula_id, presenca]) => ({
      matricula_id,
      data_aula: dataAula,
      presenca,
    }))

    const result = await salvarFrequencias(turmaDisciplinaId, dataAula, rows)
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
        <Link href="/professor/chamada" className="mt-4 inline-block text-sm text-primary hover:underline">← Voltar</Link>
      </div>
    )
  }

  const presentes = Object.values(presencas).filter(Boolean).length

  return (
    <div>
      <div className="mb-6">
        <Link href="/professor/chamada" className="text-sm text-primary hover:underline">← Voltar</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">
          Chamada — {turmaInfo?.turma_codigo} {turmaInfo?.turma_serie}
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
          <CardContent className="p-4 text-sm text-green-700">Frequência salva com sucesso!</CardContent>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <Input
          id="data_aula"
          name="data_aula"
          label="Data da Aula"
          type="date"
          value={dataAula}
          onChange={(e) => setDataAula(e.target.value)}
          className="w-48"
        />
        <Button variant="outline" size="sm" onClick={() => marcarTodas(true)}>
          <Check size={16} /> Marcar Todos Presentes
        </Button>
        <Button variant="outline" size="sm" onClick={() => marcarTodas(false)}>
          <X size={16} /> Marcar Todos Ausentes
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[var(--color-primary-50)]">
                <th className="px-4 py-3 text-left font-medium text-[var(--color-primary-800)]">Aluno</th>
                <th className="px-4 py-3 text-center font-medium text-[var(--color-primary-800)] w-24">Presença</th>
              </tr>
            </thead>
            <tbody>
              {alunos.map((aluno, idx) => (
                <tr key={aluno.matricula_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-gray-800">{aluno.nome_completo}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => togglePresenca(aluno.matricula_id)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        presencas[aluno.matricula_id]
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {presencas[aluno.matricula_id] ? <><Check size={14} /> Presente</> : <><X size={14} /> Ausente</>}
                    </button>
                  </td>
                </tr>
              ))}
              {alunos.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-sm text-gray-400">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {presentes} presente(s) de {alunos.length} aluno(s)
        </p>
        <Button onClick={handleSave} isLoading={isSaving}>
          <Save size={18} /> Salvar Frequência
        </Button>
      </div>
    </div>
  )
}
