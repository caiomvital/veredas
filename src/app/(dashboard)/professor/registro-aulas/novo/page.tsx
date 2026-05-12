'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { criarRegistroAula } from '@/lib/actions/aulas'
import { getFuncionarioByUser, getTurmasDoProfessor } from '@/lib/actions/academico'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

function NovoRegistroAulaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const turmaParam = searchParams.get('turma') ?? ''

  const [turmas, setTurmas] = useState<Array<{ value: string; label: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const funcRes = await getFuncionarioByUser()
      if (funcRes.error || !funcRes.data) {
        setError(funcRes.error ?? 'Erro ao carregar')
        setPageLoading(false)
        return
      }
      const turmasRes = await getTurmasDoProfessor(funcRes.data.id)
      if (turmasRes.data) {
        const opts = (turmasRes.data ?? []).map((t: Record<string, unknown>) => ({
          value: t.id as string,
          label: `${t.turma_codigo as string} - ${t.turma_serie as string} - ${t.disciplina_nome as string}`,
        }))
        setTurmas(opts)
      }
      setPageLoading(false)
    }
    load()
  }, [])

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    const result = await criarRegistroAula(formData)
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      router.push('/professor/registro-aulas')
    }
  }

  if (pageLoading) {
    return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <Link href="/professor/registro-aulas" className="text-sm text-primary hover:underline">← Voltar</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">Novo Registro de Aula</h1>
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

            <Input id="data_aula" name="data_aula" label="Data da Aula" required type="date" />

            <Textarea id="conteudo" name="conteudo" label="Conteúdo" required placeholder="Conteúdo ministrado na aula" />

            <Input
              id="carga_horaria_minutos"
              name="carga_horaria_minutos"
              label="Carga Horária (minutos)"
              type="number"
              defaultValue={50}
            />

            <Textarea id="observacoes" name="observacoes" label="Observações" placeholder="Observações adicionais (opcional)" />

            {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/professor/registro-aulas">
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

export default function NovoRegistroAulaPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-400">Carregando...</div>}>
      <NovoRegistroAulaPage />
    </Suspense>
  )
}
