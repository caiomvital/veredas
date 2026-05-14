'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BackButton } from '@/components/ui/back-button'
import { criarResponsavel } from '@/lib/actions/responsaveis'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { formatarCPF, validarCPF, limparCPF } from '@/lib/utils/cpf'

export default function NovoResponsavelPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cpf, setCpf] = useState('')
  const [cpfError, setCpfError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    formData.set('cpf', limparCPF(formData.get('cpf') as string))
    setIsLoading(true)
    setError(null)
    const result = await criarResponsavel(formData)
    if (result.error) {
      setError(result.error)
      toast.error("Erro: " + result.error)
      setIsLoading(false)
    } else {
      toast.success("Salvo com sucesso")
      router.push('/app/admin/responsaveis')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <BackButton href="/app/admin/responsaveis" />
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">Novo Responsável</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={handleSubmit} className="space-y-4">
            <Input id="nome_completo" name="nome_completo" label="Nome completo" required
              placeholder="Nome completo do responsável" />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="cpf" name="cpf" label="CPF" required placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatarCPF(e.target.value.replace(/\D/g, '')))}
                onBlur={() => {
                  const cleaned = limparCPF(cpf)
                  if (!cleaned || cleaned.length !== 11 || !validarCPF(cpf)) setCpfError('CPF inválido')
                  else setCpfError(null)
                }}
                error={cpfError ?? undefined}
              />
              <Input id="email" name="email" label="E-mail" type="email" required placeholder="responsavel@email.com" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="telefone" name="telefone" label="Telefone" placeholder="(81) 90000-0000" />
              <Input id="profissao" name="profissao" label="Profissão" placeholder="Profissão (opcional)" />
            </div>

            <Input id="rg" name="rg" label="RG" placeholder="RG (opcional)" />

            {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/app/admin/responsaveis">
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
