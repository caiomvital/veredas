'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { criarAluno } from '@/lib/actions/alunos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { formatarCPF, validarCPF, limparCPF } from '@/lib/utils/cpf'
import { formatarCEP, limparCEP, buscarCEP } from '@/lib/utils/viacep'

export default function NovoAlunoPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cpf, setCpf] = useState('')
  const [cpfError, setCpfError] = useState<string | null>(null)
  const [cep, setCep] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)
  const cepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handleSubmit(formData: FormData) {
    const rawCpf = formData.get('cpf') as string
    const rawCep = formData.get('cep') as string
    formData.set('cpf', limparCPF(rawCpf))
    formData.set('cep', limparCEP(rawCep))

    setIsLoading(true)
    setError(null)
    const result = await criarAluno(formData)
    if (result.error) {
      setError(result.error)
      toast.error("Erro: " + result.error)
      setIsLoading(false)
    } else {
      toast.success("Aluno cadastrado com sucesso")
      router.push('/admin/alunos')
    }
  }

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.replace(/\D/g, '')
    setCpf(formatarCPF(cleaned))
    setCpfError(null)
  }

  function handleCpfBlur() {
    const cleaned = limparCPF(cpf)
    if (cleaned.length > 0 && cleaned.length !== 11) {
      setCpfError('CPF inválido')
    } else if (cleaned.length === 11 && !validarCPF(cpf)) {
      setCpfError('CPF inválido')
    } else {
      setCpfError(null)
    }
  }

  function handleCepChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.replace(/\D/g, '')
    const formatted = formatarCEP(cleaned)
    setCep(formatted)
    setCepError(null)

    if (cepTimeoutRef.current) clearTimeout(cepTimeoutRef.current)

    if (cleaned.length === 8) {
      setCepLoading(true)
      cepTimeoutRef.current = setTimeout(async () => {
        const result = await buscarCEP(formatted)
        if (result) {
          const setVal = (id: string, val: string) => {
            const el = document.getElementById(id) as HTMLInputElement
            if (el) el.value = val
          }
          setVal('rua', result.logradouro)
          setVal('bairro', result.bairro)
          setVal('cidade', result.cidade)
          setVal('uf', result.uf)
          setCepError(null)
        } else {
          setCepError('CEP não encontrado')
        }
        setCepLoading(false)
      }, 300)
    }
  }

  const anoAtual = new Date().getFullYear()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/alunos" className="text-sm text-primary hover:underline">← Voltar</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">Novo Aluno</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={handleSubmit} className="space-y-4">
            <Input id="matricula" name="matricula" label="Nº Matrícula" required
              placeholder={`${anoAtual}0001`} />

            <Input id="nome_completo" name="nome_completo" label="Nome completo" required
              placeholder="Nome completo do aluno" />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="data_nascimento" name="data_nascimento" label="Data de nascimento" required type="date" />
              <Input id="cpf" name="cpf" label="CPF" placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCpfChange}
                onBlur={handleCpfBlur}
                error={cpfError ?? undefined}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="rg" name="rg" label="RG" placeholder="0000000" />
              <Input id="orgao_emissor" name="orgao_emissor" label="Órgão emissor" placeholder="SSP-PE" />
            </div>

            <Input id="naturalidade" name="naturalidade" label="Naturalidade" placeholder="Recife - PE" />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="nome_mae" name="nome_mae" label="Nome da mãe" required placeholder="Nome completo da mãe" />
              <Input id="nome_pai" name="nome_pai" label="Nome do pai" placeholder="Nome completo do pai (opcional)" />
            </div>

            <fieldset className="rounded border border-border p-4">
              <legend className="text-sm font-medium text-[var(--color-primary-700)]">Endereço</legend>
              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                <Input id="cep" name="cep" label="CEP" placeholder="00000-000"
                  value={cep}
                  onChange={handleCepChange}
                  error={cepError ?? undefined}
                />
                {cepLoading && <span className="text-xs text-gray-400 self-end mb-1">Buscando CEP...</span>}
                <Input id="rua" name="rua" label="Rua" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Input id="numero" name="numero" label="Número" />
                <Input id="complemento" name="complemento" label="Complemento" />
                <Input id="bairro" name="bairro" label="Bairro" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input id="cidade" name="cidade" label="Cidade" />
                <Input id="uf" name="uf" label="UF" placeholder="PE" maxLength={2} />
              </div>
            </fieldset>

            <fieldset className="rounded border border-border p-4">
              <legend className="text-sm font-medium text-[var(--color-primary-700)]">Contato do Responsável</legend>
              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                <Input id="telefone" name="telefone" label="Telefone" placeholder="(81) 90000-0000" />
                <Input id="email_responsavel" name="email_responsavel" label="E-mail" type="email" />
              </div>
            </fieldset>

            <fieldset className="rounded border border-border p-4">
              <legend className="text-sm font-medium text-[var(--color-primary-700)]">Informações de Saúde</legend>
              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                <Input id="tipo_sanguineo" name="tipo_sanguineo" label="Tipo Sanguíneo" placeholder="Ex: A+" />
                <Input id="plano_saude" name="plano_saude" label="Plano de Saúde" placeholder="Nome do plano" />
              </div>
              <div className="mt-4">
                <Input id="alergias" name="alergias" label="Alergias" placeholder="Descreva as alergias, se houver" />
              </div>
              <div className="mt-4">
                <Input id="medicamentos" name="medicamentos" label="Medicamentos de uso contínuo" placeholder="Descreva os medicamentos, se houver" />
              </div>
              <div className="mt-4">
                <Input id="observacoes_medicas" name="observacoes_medicas" label="Observações Médicas" placeholder="Outras observações relevantes" />
              </div>
              <div className="mt-4 space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="pode_sair_sozinho" className="rounded border-border" />
                  Aluno pode sair sozinho da escola
                </label>
              </div>
            </fieldset>

            <fieldset className="rounded border border-border p-4">
              <legend className="text-sm font-medium text-[var(--color-primary-700)]">LGPD — Autorizações</legend>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="lgpd_autorizacao_imagem" className="rounded border-border" />
                  Autorizo o uso de imagem do aluno
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="lgpd_autorizacao_dados" className="rounded border-border" />
                  Autorizo o tratamento de dados pessoais conforme a LGPD
                </label>
              </div>
            </fieldset>

            {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/admin/alunos">
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
