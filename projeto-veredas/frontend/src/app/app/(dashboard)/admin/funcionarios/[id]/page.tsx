'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { BackButton } from '@/components/ui/back-button'
import { getFuncionario, atualizarFuncionario, excluirFuncionario } from '@/lib/actions/funcionarios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { formatarCPF, validarCPF, limparCPF } from '@/lib/utils/cpf'
import type { Funcionario } from '@/types/entities'

export default function EditarFuncionarioPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [funcionario, setFuncionario] = useState<Funcionario | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [cpf, setCpf] = useState('')
  const [cpfError, setCpfError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const result = await getFuncionario(id)
      if (result.error) setError(result.error)
      else if (result.data) {
        setFuncionario(result.data)
        setCpf(formatarCPF(result.data.cpf ?? ''))
      }
      setIsLoading(false)
    }
    load()
  }, [id])

  async function handleSave(formData: FormData) {
    const cleaned = limparCPF(cpf)
    if (!cleaned || cleaned.length !== 11 || !validarCPF(cpf)) {
      setCpfError('CPF inválido')
      setIsSaving(false)
      return
    }
    formData.set('cpf', cleaned)
    setIsSaving(true)
    setError(null)
    const result = await atualizarFuncionario(id, formData)
    if (result.error) {
      setError(result.error)
      toast.error("Erro: " + result.error)
      setIsSaving(false)
    } else {
      toast.success("Salvo com sucesso")
      router.push('/admin/funcionarios')
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja inativar este funcionário?')) return
    setError(null)
    const result = await excluirFuncionario(id)
    if (result.error) {
      setError(result.error)
      toast.error("Erro: " + result.error)
    } else {
      toast.success("Funcionário inativado com sucesso")
      router.push('/admin/funcionarios')
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
  }

  if (!funcionario) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error ?? 'Funcionário não encontrado.'}</p>
        <BackButton href="/admin/funcionarios" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <BackButton href="/admin/funcionarios" />
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">{funcionario.nome_completo}</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={handleSave} className="space-y-4">
            <Input id="nome_completo" name="nome_completo" label="Nome completo" required
              defaultValue={funcionario.nome_completo} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="cpf" name="cpf" label="CPF" required
                value={cpf}
                onChange={(e) => setCpf(formatarCPF(e.target.value.replace(/\D/g, '')))}
                onBlur={() => {
                  const cleaned = limparCPF(cpf)
                  if (!cleaned || cleaned.length !== 11 || !validarCPF(cpf)) setCpfError('CPF inválido')
                  else setCpfError(null)
                }}
                error={cpfError ?? undefined}
              />
              <Input id="email" name="email" label="E-mail" type="email" required defaultValue={funcionario.email} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="rg" name="rg" label="RG" defaultValue={funcionario.rg ?? ''} />
              <Input id="orgao_emissor" name="orgao_emissor" label="Órgão emissor" defaultValue={funcionario.orgao_emissor ?? ''} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="telefone" name="telefone" label="Telefone" defaultValue={funcionario.telefone ?? ''} />
              <Input id="data_admissao" name="data_admissao" label="Data de admissão" type="date" defaultValue={funcionario.data_admissao ?? ''} />
            </div>

            <Select id="cargo" name="cargo" label="Cargo" required defaultValue={funcionario.cargo}
              options={[
                { value: 'professor', label: 'Professor' },
                { value: 'coordenador', label: 'Coordenador' },
                { value: 'secretaria', label: 'Secretaria' },
                { value: 'admin', label: 'Administrador' },
              ]}
            />

            <Input id="formacao" name="formacao" label="Formação" defaultValue={funcionario.formacao ?? ''} />

            {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="flex items-center justify-between pt-4">
              <Button type="button" variant="danger" onClick={handleDelete}>Inativar</Button>
              <div className="flex gap-3">
                <Link href="/admin/funcionarios">
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
