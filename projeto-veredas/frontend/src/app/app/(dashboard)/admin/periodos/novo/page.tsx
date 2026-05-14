'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BackButton } from '@/components/ui/back-button'
import { criarPeriodo } from '@/lib/actions/periodos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function NovoPeriodoPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const anoAtual = new Date().getFullYear()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    const result = await criarPeriodo(formData)
    if (result.error) {
      setError(result.error)
      toast.error("Erro: " + result.error)
      setIsLoading(false)
    } else {
      toast.success("Salvo com sucesso")
      router.push('/app/admin/periodos')
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <BackButton href="/app/admin/periodos" />
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">Novo Período Letivo</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={handleSubmit} className="space-y-4">
            <Input id="nome" name="nome" label="Nome" required placeholder="Ex: 1º Bimestre" />
            <Input id="ordem" name="ordem" label="Ordem" required type="number" placeholder="1" />
            <Input id="ano_letivo" name="ano_letivo" label="Ano Letivo" required type="number" defaultValue={anoAtual} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="data_inicio" name="data_inicio" label="Data de Início" required type="date" />
              <Input id="data_fim" name="data_fim" label="Data de Fim" required type="date" />
            </div>
            {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/app/admin/periodos">
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
