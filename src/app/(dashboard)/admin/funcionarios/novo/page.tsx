'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { criarFuncionario } from '@/lib/actions/funcionarios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function NovoFuncionarioPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    const result = await criarFuncionario(formData)
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      router.push('/admin/funcionarios')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/funcionarios" className="text-sm text-primary hover:underline">← Voltar</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">Novo Funcionário</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={handleSubmit} className="space-y-4">
            <Input
              id="nome_completo"
              name="nome_completo"
              label="Nome completo"
              required
              placeholder="Nome completo do funcionário"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="cpf" name="cpf" label="CPF" required placeholder="000.000.000-00" />
              <Input id="email" name="email" label="E-mail" type="email" required placeholder="funcionario@email.com" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="rg" name="rg" label="RG" placeholder="0000000" />
              <Input id="orgao_emissor" name="orgao_emissor" label="Órgão emissor" placeholder="SSP-PE" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="telefone" name="telefone" label="Telefone" placeholder="(81) 90000-0000" />
              <Input id="data_admissao" name="data_admissao" label="Data de admissão" type="date" />
            </div>

            <Select
              id="cargo"
              name="cargo"
              label="Cargo"
              required
              options={[
                { value: 'professor', label: 'Professor' },
                { value: 'coordenador', label: 'Coordenador' },
                { value: 'secretaria', label: 'Secretaria' },
                { value: 'admin', label: 'Administrador' },
              ]}
              placeholder="Selecione o cargo"
            />

            <Input id="formacao" name="formacao" label="Formação" placeholder="Licenciatura em ..." />

            {error && (
              <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/admin/funcionarios">
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
