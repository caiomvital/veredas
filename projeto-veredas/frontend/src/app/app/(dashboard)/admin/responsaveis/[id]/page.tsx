'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getResponsavel, atualizarResponsavel, getVinculosPorResponsavel } from '@/lib/actions/responsaveis'
import { listarAlunos } from '@/lib/actions/alunos'
import { vincularAluno, desvincularAluno } from '@/lib/actions/responsaveis'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Responsavel, Aluno, AlunoResponsavel } from '@/types/entities'

export default function EditarResponsavelPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [responsavel, setResponsavel] = useState<Responsavel | null>(null)
  const [vinculos, setVinculos] = useState<AlunoResponsavel[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Vínculo
  const [alunoSelecionado, setAlunoSelecionado] = useState('')
  const [grauParentesco, setGrauParentesco] = useState('')
  const [vinculoError, setVinculoError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [respResult, vinculosResult, alunosResult] = await Promise.all([
        getResponsavel(id),
        getVinculosPorResponsavel(id),
        listarAlunos({ status: 'ativo' }),
      ])
      if (respResult.error) setError(respResult.error)
      else setResponsavel(respResult.data)
      setVinculos(vinculosResult.data ?? [])
      setAlunos(alunosResult.data ?? [])
      setIsLoading(false)
    }
    load()
  }, [id])

  async function handleSave(formData: FormData) {
    setIsSaving(true)
    setError(null)
    const result = await atualizarResponsavel(id, formData)
    if (result.error) {
      setError(result.error)
      toast.error("Erro: " + result.error)
      setIsSaving(false)
    } else {
      toast.success("Salvo com sucesso")
      router.push('/admin/responsaveis')
    }
  }

  async function handleVincular() {
    if (!alunoSelecionado || !grauParentesco) {
      setVinculoError('Selecione um aluno e informe o grau de parentesco.')
      return
    }
    setVinculoError(null)
    const result = await vincularAluno(id, alunoSelecionado, grauParentesco)
    if (result.error) setVinculoError(result.error)
    else {
      setVinculos([...vinculos, { aluno_id: alunoSelecionado, responsavel_id: id, grau_parentesco: grauParentesco }])
      setAlunoSelecionado('')
      setGrauParentesco('')
    }
  }

  async function handleDesvincular(alunoId: string) {
    const result = await desvincularAluno(id, alunoId)
    if (result.error) setVinculoError(result.error)
    else setVinculos(vinculos.filter((v) => v.aluno_id !== alunoId))
  }

  const alunosVinculados = alunos.filter((a) => vinculos.some((v) => v.aluno_id === a.id))
  const alunosDisponiveis = alunos.filter((a) => !vinculos.some((v) => v.aluno_id === a.id))

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
  }

  if (!responsavel) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error ?? 'Responsável não encontrado.'}</p>
        <Link href="/admin/responsaveis" className="mt-4 inline-block text-sm text-primary hover:underline">← Voltar</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/responsaveis" className="text-sm text-primary hover:underline">← Voltar</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">{responsavel.nome_completo}</h1>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <form action={handleSave} className="space-y-4">
            <Input id="nome_completo" name="nome_completo" label="Nome completo" required defaultValue={responsavel.nome_completo} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="cpf" name="cpf" label="CPF" required defaultValue={responsavel.cpf} />
              <Input id="email" name="email" label="E-mail" type="email" required defaultValue={responsavel.email} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="telefone" name="telefone" label="Telefone" defaultValue={responsavel.telefone ?? ''} />
              <Input id="profissao" name="profissao" label="Profissão" defaultValue={responsavel.profissao ?? ''} />
            </div>
            <Input id="rg" name="rg" label="RG" defaultValue={responsavel.rg ?? ''} />

            {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/admin/responsaveis">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" isLoading={isSaving}>Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Vínculos */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-primary-800)]">Alunos Vinculados</h2>

          {vinculoError && (
            <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{vinculoError}</div>
          )}

          {/* Lista de vínculos atuais */}
          {alunosVinculados.length === 0 ? (
            <p className="mb-4 text-sm text-gray-400">Nenhum aluno vinculado.</p>
          ) : (
            <div className="mb-4 space-y-2">
              {alunosVinculados.map((aluno) => {
                const vinculo = vinculos.find((v) => v.aluno_id === aluno.id)
                return (
                  <div key={aluno.id} className="flex items-center justify-between rounded border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{aluno.nome_completo}</p>
                      <p className="text-xs text-gray-500">
                        {aluno.matricula} — {vinculo?.grau_parentesco}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDesvincular(aluno.id)}>
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Adicionar vínculo */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <Select
                label="Aluno"
                options={alunosDisponiveis.map((a) => ({ value: a.id, label: `${a.nome_completo} (${a.matricula})` }))}
                value={alunoSelecionado}
                onChange={(e) => setAlunoSelecionado(e.target.value)}
                placeholder="Selecione um aluno"
              />
            </div>
            <div className="w-40">
              <Select
                label="Parentesco"
                options={[
                  { value: 'Pai', label: 'Pai' },
                  { value: 'Mãe', label: 'Mãe' },
                  { value: 'Tutor', label: 'Tutor' },
                  { value: 'Avô/Avó', label: 'Avô/Avó' },
                  { value: 'Outros', label: 'Outros' },
                ]}
                value={grauParentesco}
                onChange={(e) => setGrauParentesco(e.target.value)}
                placeholder="Selecionar"
              />
            </div>
            <Button type="button" size="sm" onClick={handleVincular}>
              <Plus size={16} /> Vincular
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
