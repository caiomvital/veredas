'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getFuncionarioByUser, getTurmasDoProfessor, getAlunosDaTurma, getNotas, getFrequenciasPorTurmaDisciplina } from '@/lib/actions/academico'
import { listarPeriodos } from '@/lib/actions/periodos'
import { useSchool } from '@/hooks/useSchool'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Download } from 'lucide-react'
import type { PeriodoLetivo } from '@/types/entities'

interface BoletimAluno {
  matricula_id: string
  nome: string
  notas: { prova?: number; trabalho?: number; recuperacao?: number }
  frequencia: { totalAulas: number; presencas: number; percentual: number }
}

export default function BoletimTurmaPage() {
  const params = useParams()
  const turmaDisciplinaId = params.turmaDisciplinaId as string
  const { config } = useSchool()

  const [turmaInfo, setTurmaInfo] = useState<{ turma_codigo: string; turma_serie: string; disciplina_nome: string; turma_id: string } | null>(null)
  const [alunos, setAlunos] = useState<Array<{ matricula_id: string; nome_completo: string }>>([])
  const [boletimData, setBoletimData] = useState<BoletimAluno[]>([])
  const [periodos, setPeriodos] = useState<PeriodoLetivo[]>([])
  const [selectedPeriodo, setSelectedPeriodo] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      const [alunosRes, perRes] = await Promise.all([
        getAlunosDaTurma(turma.turma_id as string),
        listarPeriodos(),
      ])

      if (alunosRes.error) { setError(alunosRes.error); setIsLoading(false); return }
      setAlunos((alunosRes.data ?? []) as Array<{ matricula_id: string; nome_completo: string }>)

      if (perRes.data) {
        setPeriodos(perRes.data)
        if (perRes.data.length > 0) setSelectedPeriodo(perRes.data[0].id)
      }

      setIsLoading(false)
    } catch {
      setError('Erro ao carregar dados')
      setIsLoading(false)
    }
  }, [turmaDisciplinaId])

  useEffect(() => { loadData() }, [loadData])

  // Load grades and attendance when periodo changes
  useEffect(() => {
    if (!selectedPeriodo || !turmaInfo) return
    async function loadBoletimData() {
      setIsLoadingData(true)
      setError(null)

      const [notasRes, freqRes] = await Promise.all([
        getNotas(turmaDisciplinaId, selectedPeriodo),
        getFrequenciasPorTurmaDisciplina(turmaDisciplinaId, selectedPeriodo),
      ])

      if (notasRes.error || freqRes.error) {
        setError(notasRes.error ?? freqRes.error ?? 'Erro ao carregar dados')
        setIsLoadingData(false)
        return
      }

      const notas = (notasRes.data ?? []) as Array<Record<string, unknown>>
      const frequencias = (freqRes.data ?? []) as Array<Record<string, unknown>>

      // Build boletim data per student
      const data: BoletimAluno[] = alunos.map((aluno) => {
        // Get notas for this student
        const alunoNotas = notas.filter((n) => n.matricula_id === aluno.matricula_id)
        const notaMap: Record<string, number> = {}
        for (const n of alunoNotas) {
          notaMap[n.tipo as string] = n.valor as number
        }

        // Calculate attendance
        const alunoFreq = frequencias.filter((f) => f.matricula_id === aluno.matricula_id)
        const totalAulas = new Set(alunoFreq.map((f) => f.data_aula as string)).size
        const presencas = alunoFreq.filter((f) => f.presenca === true).length

        return {
          matricula_id: aluno.matricula_id,
          nome: aluno.nome_completo,
          notas: {
            prova: notaMap['prova'],
            trabalho: notaMap['trabalho'],
            recuperacao: notaMap['recuperacao'],
          },
          frequencia: {
            totalAulas,
            presencas,
            percentual: totalAulas > 0 ? (presencas / totalAulas) * 100 : 0,
          },
        }
      })

      setBoletimData(data)
      setIsLoadingData(false)
    }
    loadBoletimData()
  }, [selectedPeriodo, turmaDisciplinaId, turmaInfo, alunos])

  async function handleDownloadPDF() {
    setIsGeneratingPDF(true)
    setError(null)
    try {
      const { gerarBoletimPDF } = await import('@/lib/pdf/boletim')
      const periodo = periodos.find((p) => p.id === selectedPeriodo)
      const doc = gerarBoletimPDF({
        schoolName: config?.nome ?? 'Escola',
        tituloBoletim: (config?.textos as Record<string, string> | undefined)?.titulo_boletim ?? undefined,
        rodapeBoletim: (config?.textos as Record<string, string> | undefined)?.rodape_boletim ?? undefined,
        turmaCodigo: turmaInfo?.turma_codigo ?? '',
        turmaSerie: turmaInfo?.turma_serie ?? '',
        disciplinaNome: turmaInfo?.disciplina_nome ?? '',
        periodoNome: periodo ? `${periodo.nome} ${periodo.ano_letivo}` : '',
        alunos: boletimData.map((a) => ({
          nome: a.nome,
          notas: a.notas,
          frequencia: a.frequencia,
        })),
      })
      doc.save(`boletim-${turmaInfo?.turma_codigo}-${periodo?.nome ?? 'sem-periodo'}.pdf`)
    } catch {
      setError('Erro ao gerar PDF')
    }
    setIsGeneratingPDF(false)
  }

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
  }

  if (error && !turmaInfo) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error}</p>
        <Link href="/professor/boletins" className="mt-4 inline-block text-sm text-primary hover:underline">← Voltar</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/professor/boletins" className="text-sm text-primary hover:underline">← Voltar</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">
          Boletins — {turmaInfo?.turma_codigo} {turmaInfo?.turma_serie}
        </h1>
        <p className="text-sm text-gray-500">{turmaInfo?.disciplina_nome}</p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <Select
          label="Período"
          options={periodos.map((p) => ({ value: p.id, label: `${p.nome} (${p.ano_letivo})` }))}
          value={selectedPeriodo}
          onChange={(e) => setSelectedPeriodo(e.target.value)}
          className="w-64"
        />
        <Button onClick={handleDownloadPDF} isLoading={isGeneratingPDF} disabled={boletimData.length === 0 || isLoadingData}>
          <Download size={18} /> Download PDF
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[var(--color-primary-50)]">
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-[var(--color-primary-800)]">Aluno</th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium text-[var(--color-primary-800)] w-20">Prova</th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium text-[var(--color-primary-800)] w-20">Trabalho</th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium text-[var(--color-primary-800)] w-20">Recuperação</th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium text-[var(--color-primary-800)] w-28">Frequência</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-gray-400">Carregando dados...</td>
                </tr>
              ) : boletimData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-gray-400">
                    Nenhum dado encontrado para este período.
                  </td>
                </tr>
              ) : (
                boletimData.map((aluno, idx) => (
                  <tr key={aluno.matricula_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-gray-800">{aluno.nome}</td>
                    <td className="px-4 py-2 text-center">{aluno.notas.prova !== undefined ? aluno.notas.prova.toFixed(1) : '—'}</td>
                    <td className="px-4 py-2 text-center">{aluno.notas.trabalho !== undefined ? aluno.notas.trabalho.toFixed(1) : '—'}</td>
                    <td className="px-4 py-2 text-center">{aluno.notas.recuperacao !== undefined ? aluno.notas.recuperacao.toFixed(1) : '—'}</td>
                    <td className="px-4 py-2 text-center text-xs">
                      {aluno.frequencia.totalAulas > 0
                        ? `${aluno.frequencia.presencas}/${aluno.frequencia.totalAulas} = ${aluno.frequencia.percentual.toFixed(0)}%`
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
