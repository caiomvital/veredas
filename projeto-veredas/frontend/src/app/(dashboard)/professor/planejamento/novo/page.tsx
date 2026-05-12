'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { criarPlanejamento } from '@/lib/actions/aulas'
import { listarPeriodos } from '@/lib/actions/periodos'
import { getFuncionarioByUser, getTurmasDoProfessor } from '@/lib/actions/academico'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import type { PeriodoLetivo } from '@/types/entities'

function NovoPlanejamentoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const turmaParam = searchParams.get('turma') ?? ''

  const [turmas, setTurmas] = useState<Array<{ value: string; label: string }>>([])
  const [periodos, setPeriodos] = useState<PeriodoLetivo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [funcRes, perRes] = await Promise.all([
        getFuncionarioByUser(),
        listarPeriodos(),
      ])
      if (perRes.data) setPeriodos(perRes.data)

      if (funcRes.error || !funcRes.data) {
        setError(funcRes.error ?? 'Erro ao carregar')
        setPageLoading(false)
        return
      }
      const turmasRes = await getTurmasDoProfessor(funcRes.data.id)
      if (turmasRes.data) {
        setTurmas((turmasRes.data ?? []).map((t: Record<string, unknown>) => ({
          value: t.id as string,
          label: `${t.turma_codigo as string} - ${t.turma_serie as string} - ${t.disciplina_nome as string}`,
        })))
      }
      setPageLoading(false)
    }
    load()
  }, [])

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    const result = await criarPlanejamento(formData)
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      router.push('/professor/planejamento')
    }
  }

  if (pageLoading) {
    return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <Link href="/professor/planejamento" className="text-sm text-primary hover:underline">← Voltar</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">Novo Planejamento de Aula</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={handleSubmit} className="space-y-4">
            <Select
              id="turma_disciplina_id"
              name="turma_disciplina_id"
              label="Turma / Disciplina"
              required
              options={[{ value: '', label: 'Selecione...' }, ...turmas]}
              defaultValue={turmaParam}
            />

            <Select
              id="periodo_id"
              name="periodo_id"
              label="Período Letivo"
              required
              options={[{ value: '', label: 'Selecione...' }, ...periodos.map((p) => ({ value: p.id, label: `${p.nome} ${p.ano_letivo}` }))]}
            />

            <Input id="semana_inicio" name="semana_inicio" label="Semana de Início" required type="date" />

            <Textarea id="objetivos" name="objetivos" label="Objetivos" placeholder="Objetivos da semana (opcional)" />

            <Textarea id="conteudo_planejado" name="conteudo_planejado" label="Conteúdo Planejado" required placeholder="Conteúdo a ser ministrado" />

            <Textarea id="metodologia" name="metodologia" label="Metodologia" placeholder="Metodologia a ser utilizada (opcional)" />

            <Textarea id="recursos" name="recursos" label="Recursos" placeholder="Recursos necessários (opcional)" />

            {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/professor/planejamento">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" isLoading={isLoading}>Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NovoPlanejamentoPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-400">Carregando...</div>}>
      <NovoPlanejamentoPage />
    </Suspense>
  )
}