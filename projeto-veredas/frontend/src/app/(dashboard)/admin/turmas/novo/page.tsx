'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { criarTurma } from '@/lib/actions/turmas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

const SERIES = [
  { value: '1º EF', label: '1º Ano Ensino Fundamental' },
  { value: '2º EF', label: '2º Ano Ensino Fundamental' },
  { value: '3º EF', label: '3º Ano Ensino Fundamental' },
  { value: '4º EF', label: '4º Ano Ensino Fundamental' },
  { value: '5º EF', label: '5º Ano Ensino Fundamental' },
  { value: '6º EF', label: '6º Ano Ensino Fundamental' },
  { value: '7º EF', label: '7º Ano Ensino Fundamental' },
  { value: '8º EF', label: '8º Ano Ensino Fundamental' },
  { value: '9º EF', label: '9º Ano Ensino Fundamental' },
  { value: '1ª EM', label: '1ª Série Ensino Médio' },
  { value: '2ª EM', label: '2ª Série Ensino Médio' },
  { value: '3ª EM', label: '3ª Série Ensino Médio' },
]

export default function NovaTurmaPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    const result = await criarTurma(formData)
    if (result.error) {
      setError(result.error)
      toast.error("Erro: " + result.error)
      setIsLoading(false)
    } else {
      toast.success("Salvo com sucesso")
      router.push('/admin/turmas')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/turmas" className="text-sm text-primary hover:underline">← Voltar</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">Nova Turma</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={handleSubmit} className="space-y-4">
            <Input id="codigo" name="codigo" label="Código da turma" required
              placeholder="Ex: 6A, 1EM-B" />

            <Select id="serie" name="serie" label="Série" required
              options={SERIES} placeholder="Selecione a série" />

            <Select id="turno" name="turno" label="Turno" required
              options={[
                { value: 'manha', label: 'Manhã' },
                { value: 'tarde', label: 'Tarde' },
                { value: 'noite', label: 'Noite' },
              ]}
              placeholder="Selecione o turno"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="ano_letivo" name="ano_letivo" label="Ano letivo" type="number" required
                defaultValue={new Date().getFullYear().toString()} />
              <Input id="capacidade" name="capacidade" label="Capacidade (vagas)" type="number"
                defaultValue="40" />
            </div>

            {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/admin/turmas">
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
