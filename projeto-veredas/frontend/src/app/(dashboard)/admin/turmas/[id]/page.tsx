'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getTurma, atualizarTurma, excluirTurma } from '@/lib/actions/turmas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import type { Turma } from '@/types/entities'

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

export default function EditarTurmaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [turma, setTurma] = useState<Turma | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const result = await getTurma(id)
      if (result.error) setError(result.error)
      else setTurma(result.data)
      setIsLoading(false)
    }
    load()
  }, [id])

  async function handleSave(formData: FormData) {
    setIsSaving(true)
    setError(null)
    const result = await atualizarTurma(id, formData)
    if (result.error) {
      setError(result.error)
      setIsSaving(false)
    } else {
      router.push('/admin/turmas')
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja desativar esta turma?')) return
    const result = await excluirTurma(id)
    if (result.error) setError(result.error)
    else router.push('/admin/turmas')
  }

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
  if (!turma) {
    return <div className="p-8 text-center"><p className="text-red-600">{error ?? 'Turma não encontrada.'}</p></div>
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/turmas" className="text-sm text-primary hover:underline">← Voltar</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">Turma {turma.codigo}</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={handleSave} className="space-y-4">
            <Input id="codigo" name="codigo" label="Código" required defaultValue={turma.codigo} />
            <Select id="serie" name="serie" label="Série" required defaultValue={turma.serie} options={SERIES} />
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
