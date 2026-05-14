'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getTurma, atualizarTurma, excluirTurma } from '@/lib/actions/turmas'
import { listarSeries } from '@/lib/actions/series-escolares'
import { BackButton } from '@/components/ui/back-button'
import type { SerieEscolar } from '@/lib/actions/series-escolares'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Turma } from '@/types/entities'

export default function EditarTurmaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [turma, setTurma] = useState<Turma | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [series, setSeries] = useState<SerieEscolar[]>([])
  const [loadingSeries, setLoadingSeries] = useState(true)

  useEffect(() => {
    async function load() {
      const result = await getTurma(id)
      if (result.error) setError(result.error)
      else setTurma(result.data)
      setIsLoading(false)
    }
    load()
    listarSeries().then((res) => {
      if (res.data) setSeries(res.data.filter((s) => s.ativo))
      setLoadingSeries(false)
    })
  }, [id])

  async function handleSave(formData: FormData) {
    setIsSaving(true)
    setError(null)
    const result = await atualizarTurma(id, formData)
    if (result.error) {
      setError(result.error)
      toast.error("Erro: " + result.error)
      setIsSaving(false)
    } else {
      toast.success("Salvo com sucesso")
      router.push('/admin/turmas')
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja desativar esta turma?')) return
    const result = await excluirTurma(id)
    if (result.error) {
      setError(result.error)
      toast.error("Erro: " + result.error)
    } else {
      toast.success("Turma desativada com sucesso")
      router.push('/admin/turmas')
    }
  }

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
  if (!turma) {
    return <div className="p-8 text-center"><p className="text-red-600">{error ?? 'Turma não encontrada.'}</p></div>
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <BackButton href="/admin/turmas" />
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">Turma {turma.codigo}</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={handleSave} className="space-y-4">
            <Input id="codigo" name="codigo" label="Código" required defaultValue={turma.codigo} />
            <Select id="serie" name="serie" label="Série" required defaultValue={turma.serie}
              options={series.map((s) => ({ value: s.nome, label: s.nome }))}
              disabled={loadingSeries} />
            <Select id="turno" name="turno" label="Turno" required defaultValue={turma.turno}
              options={[{ value: 'manha', label: 'Manhã' }, { value: 'tarde', label: 'Tarde' }, { value: 'noite', label: 'Noite' }]} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="ano_letivo" name="ano_letivo" label="Ano letivo" type="number" required defaultValue={String(turma.ano_letivo)} />
              <Input id="capacidade" name="capacidade" label="Capacidade" type="number" defaultValue={String(turma.capacidade)} />
            </div>

            {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="flex items-center justify-between pt-4">
              <Button type="button" variant="danger" onClick={handleDelete}>Desativar</Button>
              <div className="flex gap-3">
                <Link href="/admin/turmas"><Button type="button" variant="outline">Cancelar</Button></Link>
                <Button type="submit" isLoading={isSaving}>Salvar</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
