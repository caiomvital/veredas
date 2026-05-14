'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { BackButton } from '@/components/ui/back-button'
import { getPeriodo, atualizarPeriodo, excluirPeriodo } from '@/lib/actions/periodos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import type { PeriodoLetivo } from '@/types/entities'

export default function EditarPeriodoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [periodo, setPeriodo] = useState<PeriodoLetivo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const result = await getPeriodo(id)
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setPeriodo(result.data)
      }
      setIsLoading(false)
    }
    load()
  }, [id])

  async function handleSave(formData: FormData) {
    setIsSaving(true)
    setError(null)
    const result = await atualizarPeriodo(id, formData)
    if (result.error) {
      setError(result.error)
      toast.error("Erro: " + result.error)
      setIsSaving(false)
    } else {
      toast.success("Salvo com sucesso")
      router.push('/admin/periodos')
    }
  }

  async function handleDelete() {
    if (!confirm('Excluir este período letivo?')) return
    setError(null)
    const result = await excluirPeriodo(id)
    if (result.error) {
      setError(result.error)
      toast.error("Erro: " + result.error)
    } else {
      toast.success("Período excluído com sucesso")
      router.push('/admin/periodos')
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
  }

  if (!periodo) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error ?? 'Período não encontrado.'}</p>
        <BackButton href="/admin/periodos" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <BackButton href="/admin/periodos" />
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">{periodo.nome}</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={handleSave} className="space-y-4">
            <Input id="nome" name="nome" label="Nome" required defaultValue={periodo.nome} />
            <Input id="ordem" name="ordem" label="Ordem" required type="number" defaultValue={periodo.ordem} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="data_inicio" name="data_inicio" label="Data de Início" required type="date" defaultValue={periodo.data_inicio} />
              <Input id="data_fim" name="data_fim" label="Data de Fim" required type="date" defaultValue={periodo.data_fim} />
            </div>
            {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <div className="flex items-center justify-between pt-4">
              <Button type="button" variant="danger" onClick={handleDelete}>Excluir</Button>
              <div className="flex gap-3">
                <Link href="/admin/periodos">
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
