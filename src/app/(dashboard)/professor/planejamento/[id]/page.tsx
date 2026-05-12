'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getPlanejamento, atualizarPlanejamento, excluirPlanejamento } from '@/lib/actions/aulas'
import { listarPeriodos } from '@/lib/actions/periodos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import type { PeriodoLetivo } from '@/types/entities'

interface Planejamento {
  id: string
  turma_disciplina_id: string
  periodo_id: string
  semana_inicio: string
  objetivos: string | null
  conteudo_planejado: string
  metodologia: string | null
  recursos: string | null
}

export default function EditarPlanejamentoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [planejamento, setPlanejamento] = useState<Planejamento | null>(null)
  const [periodos, setPeriodos] = useState<PeriodoLetivo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [plRes, perRes] = await Promise.all([
        getPlanejamento(id),
        listarPeriodos(),
      ])
      if (plRes.error) setError(plRes.error)
      else if (plRes.data) setPlanejamento(plRes.data as Planejamento)
      if (perRes.data) setPeriodos(perRes.data)
      setIsLoading(false)
    }
    load()
  }, [id])

  async function handleSave(formData: FormData) {
    setIsSaving(true)
    setError(null)
    const result = await atualizarPlanejamento(id, formData)
    if (result.error) {
      setError(result.error)
      setIsSaving(false)
    } else {
      router.push('/professor/planejamento')
    }
  }

  async function handleDelete() {
    if (!confirm('Excluir este planejamento?')) return
    const result = await excluirPlanejamento(id)
    if (result.error) setError(result.error)
    else router.push('/professor/planejamento')
  }

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
  }

  if (!planejamento) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error ?? 'Planejamento não encontrado.'}</p>
        <Link href="/professor/planejamento" className="mt-4 inline-block text-sm text-primary hover:underline">← Voltar</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <Link href="/professor/planejamento" className="text-sm text-primary hover:underline">← Voltar</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">Editar Planejamento</h1>
        <p className="text-sm text-gray-500">
          Semana de {new Date(planejamento.semana_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={handleSave} className="space-y-4">
            <Select
              id="periodo_id"
              name="periodo_id"
              label="Período Letivo"
              required
              defaultValue={planejamento.periodo_id}
              options={[{ value: '', label: 'Selecione...' }, ...periodos.map((p) => ({ value: p.id, label: `${p.nome} ${p.ano_letivo}` }))]}
            />

            <Input id="semana_inicio" name="semana_inicio" label="Semana de Início" required type="date" defaultValue={planejamento.semana_inicio} />

            <Textarea id="objetivos" name="objetivos" label="Objetivos" defaultValue={planejamento.objetivos ?? ''} />

            <Textarea id="conteudo_planejado" name="conteudo_planejado" label="Conteúdo Planejado" required defaultValue={planejamento.conteudo_planejado} />

            <Textarea id="metodologia" name="metodologia" label="Metodologia" defaultValue={planejamento.metodologia ?? ''} />

            <Textarea id="recursos" name="recursos" label="Recursos" defaultValue={planejamento.recursos ?? ''} />

            {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="flex items-center justify-between pt-4">
              <Button type="button" variant="danger" onClick={handleDelete}>Excluir</Button>
              <div className="flex gap-3">
                <Link href="/professor/planejamento">
                  <Button type="button" variant="outline">Cancelar</Button>
                </Link>
                <Button type="submit" isLoading={isSaving}>Salvar</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
