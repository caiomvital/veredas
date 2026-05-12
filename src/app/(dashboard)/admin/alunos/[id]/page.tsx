'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getAluno, atualizarAluno, excluirAluno } from '@/lib/actions/alunos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import type { Aluno } from '@/types/entities'

export default function EditarAlunoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const result = await getAluno(id)
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setAluno(result.data)
      }
      setIsLoading(false)
    }
    load()
  }, [id])

  async function handleSave(formData: FormData) {
    setIsSaving(true)
    setError(null)
    const result = await atualizarAluno(id, formData)
    if (result.error) {
      setError(result.error)
      setIsSaving(false)
    } else {
      router.push('/admin/alunos')
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja inativar este aluno?')) return
    setError(null)
    const result = await excluirAluno(id)
    if (result.error) setError(result.error)
    else router.push('/admin/alunos')
  }

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
  }

  if (!aluno) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error ?? 'Aluno não encontrado.'}</p>
        <Link href="/admin/alunos" className="mt-4 inline-block text-sm text-primary hover:underline">← Voltar</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/alunos" className="text-sm text-primary hover:underline">← Voltar</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">{aluno.nome_completo}</h1>
        <p className="text-sm text-gray-500">Matrícula: {aluno.matricula}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={handleSave} className="space-y-4">
            <Input id="matricula" name="matricula" label="Nº Matrícula" required defaultValue={aluno.matricula} />
            <Input id="nome_completo" name="nome_completo" label="Nome completo" required defaultValue={aluno.nome_completo} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="data_nascimento" name="data_nascimento" label="Data de nascimento" required type="date" defaultValue={aluno.data_nascimento} />
              <Input id="cpf" name="cpf" label="CPF" defaultValue={aluno.cpf ?? ''} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="rg" name="rg" label="RG" defaultValue={aluno.rg ?? ''} />
              <Input id="orgao_emissor" name="orgao_emissor" label="Órgão emissor" defaultValue={aluno.orgao_emissor ?? ''} />
            </div>

            <Input id="naturalidade" name="naturalidade" label="Naturalidade" defaultValue={aluno.naturalidade ?? ''} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="nome_mae" name="nome_mae" label="Nome da mãe" required defaultValue={aluno.nome_mae} />
              <Input id="nome_pai" name="nome_pai" label="Nome do pai" defaultValue={aluno.nome_pai ?? ''} />
            </div>

            <Select id="status" name="status" label="Status"
              defaultValue={aluno.status}
              options={[
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
                { value: 'transferido', label: 'Transferido' },
                { value: 'concluido', label: 'Concluído' },
              ]}
            />

            {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="flex items-center justify-between pt-4">
              <Button type="button" variant="danger" onClick={handleDelete}>Inativar</Button>
              <div className="flex gap-3">
                <Link href="/admin/alunos">
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
