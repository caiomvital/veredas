'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getRegistroAula, atualizarRegistroAula } from '@/lib/actions/aulas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

interface RegistroAula {
  id: string
  turma_disciplina_id: string
  data_aula: string
  conteudo: string
  observacoes: string | null
  carga_horaria_minutos: number
}

export default function EditarRegistroAulaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [registro, setRegistro] = useState<RegistroAula | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const result = await getRegistroAula(id)
      if (result.error) setError(result.error)
      else if (result.data) setRegistro(result.data as RegistroAula)
      setIsLoading(false)
    }
    load()
  }, [id])

  async function handleSave(formData: FormData) {
    setIsSaving(true)
    setError(null)
    const result = await atualizarRegistroAula(id, formData)
    if (result.error) {
      setError(result.error)
      setIsSaving(false)
    } else {
      router.push('/professor/registro-aulas')
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
  }

  if (!registro) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error ?? 'Registro não encontrado.'}</p>
        <Link href="/professor/registro-aulas" className="mt-4 inline-block text-sm text-primary hover:underline">← Voltar</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <Link href="/professor/registro-aulas" className="text-sm text-primary hover:underline">← Voltar</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">Editar Registro de Aula</h1>
        <p className="text-sm text-gray-500">
          {new Date(registro.data_aula + 'T00:00:00').toLocaleDateString('pt-BR')}
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={handleSave} className="space-y-4">
            <Textarea id="conteudo" name="conteudo" label="Conteúdo" required defaultValue={registro.conteudo} />
            <Input
              id="carga_horaria_minutos"
              name="carga_horaria_minutos"
              label="Carga Horária (minutos)"
              type="number"
              defaultValue={registro.carga_horaria_minutos}
            />
            <Textarea id="observacoes" name="observacoes" label="Observações" defaultValue={registro.observacoes ?? ''} />

            {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/professor/registro-aulas">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" isLoading={isSaving}>Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
