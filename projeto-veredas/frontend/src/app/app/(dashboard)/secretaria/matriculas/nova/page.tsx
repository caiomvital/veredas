'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { criarMatricula } from '@/lib/actions/matriculas'
import { listarAlunos } from '@/lib/actions/alunos'
import { listarTurmas } from '@/lib/actions/turmas'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Aluno, Turma } from '@/types/entities'

export default function NovaMatriculaPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])

  useEffect(() => {
    async function load() {
      const [alunosResult, turmasResult] = await Promise.all([
        listarAlunos({ status: 'ativo' }),
        listarTurmas({ ano_letivo: new Date().getFullYear() }),
      ])
      setAlunos(alunosResult.data ?? [])
      setTurmas(turmasResult.data ?? [])
    }
    load()
  }, [])

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    const result = await criarMatricula(formData)
    if (result.error) {
      setError(result.error)
      toast.error("Erro: " + result.error)
      setIsLoading(false)
    } else {
      toast.success("Matrícula realizada com sucesso")
      router.push('/app/secretaria/matriculas')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/app/secretaria/matriculas" className="text-sm text-primary hover:underline">← Voltar</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">Nova Matrícula</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={handleSubmit} className="space-y-4">
            <Select id="aluno_id" name="aluno_id" label="Aluno" required
              options={alunos.map((a) => ({ value: a.id, label: `${a.nome_completo} (${a.matricula})` }))}
              placeholder="Selecione o aluno"
            />

            <Select id="turma_id" name="turma_id" label="Turma" required
              options={turmas.map((t) => ({ value: t.id, label: `${t.codigo} - ${t.serie} (${t.turno})` }))}
              placeholder="Selecione a turma"
            />

            <Input id="data_matricula" name="data_matricula" label="Data da matrícula" type="date"
              defaultValue={new Date().toISOString().split('T')[0]} />

            {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/app/secretaria/matriculas">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" isLoading={isLoading}>Matricular</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
