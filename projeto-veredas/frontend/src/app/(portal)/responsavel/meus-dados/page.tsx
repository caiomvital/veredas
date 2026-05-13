'use client'

import { useEffect, useState } from 'react'
import { getMeusDados, salvarMeusDados } from '@/lib/actions/responsavel-dados'
import type { MeusDadosData } from '@/lib/actions/responsavel-dados'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

export default function MeusDadosPage() {
  const [data, setData] = useState<MeusDadosData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function fetchData() {
    setIsLoading(true)
    getMeusDados().then((res) => {
      if (res.error) setError(res.error)
      else setData(res.data)
      setIsLoading(false)
    })
  }

  useEffect(() => { fetchData() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    const fd = new FormData(e.target as HTMLFormElement)
    const res = await salvarMeusDados(fd)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Dados atualizados com sucesso!')
      fetchData()
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-stone-200" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
    )
  }

  if (!data) return null

  return (
    <div>
      <h1 className="text-xl font-bold text-zab-verde mb-6">Meus Dados</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Responsável */}
        <div className="rounded-xl bg-white border border-stone-200 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-zab-verde">Dados do Responsável</h2>

          <Input label="Nome completo" value={data.nome_completo} readOnly disabled
            className="bg-stone-50 text-gray-500" />

          <Input label="E-mail" value={data.email} readOnly disabled
            className="bg-stone-50 text-gray-500" />

          <Input label="Telefone" name="telefone" defaultValue={data.telefone ?? ''}
            placeholder="(11) 99999-9999" />

          <Input label="Profissão" name="profissao" defaultValue={data.profissao ?? ''}
            placeholder="Profissão" />
        </div>

        {/* Endereço dos Alunos */}
        {data.alunos.map((aluno) => {
          const end = aluno.endereco as Record<string, string>
          return (
            <div key={aluno.id} className="rounded-xl bg-white border border-stone-200 p-4 space-y-4">
              <h2 className="text-sm font-semibold text-zab-verde">Endereço — {aluno.nome_completo}</h2>
              <input type="hidden" name="aluno_id" value={aluno.id} />

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Input label="CEP" name={`endereco_${aluno.id}_cep`} defaultValue={end.cep ?? ''}
                    placeholder="00000-000" />
                </div>
                <Input label="Rua" name={`endereco_${aluno.id}_rua`} defaultValue={end.rua ?? ''}
                  placeholder="Rua" className="col-span-2" />
                <Input label="Número" name={`endereco_${aluno.id}_numero`} defaultValue={end.numero ?? ''}
                  placeholder="Nº" />
                <Input label="Bairro" name={`endereco_${aluno.id}_bairro`} defaultValue={end.bairro ?? ''}
                  placeholder="Bairro" />
                <Input label="Cidade" name={`endereco_${aluno.id}_cidade`} defaultValue={end.cidade ?? ''}
                  placeholder="Cidade" />
                <Input label="UF" name={`endereco_${aluno.id}_uf`} defaultValue={end.uf ?? ''}
                  placeholder="UF" maxLength={2} />
              </div>
            </div>
          )
        })}

        <Button type="submit" isLoading={isSaving} className="w-full">
          <Save size={16} className="mr-1" /> Salvar Dados
        </Button>
      </form>
    </div>
  )
}
