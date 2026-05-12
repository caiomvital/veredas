'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getAtividade, atualizarAtividade, excluirAtividade, getEntregas, registrarEntrega } from '@/lib/actions/aulas'
import { getAlunosDaTurma, getTurmasDoProfessor, getFuncionarioByUser } from '@/lib/actions/academico'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Save, Check, X } from 'lucide-react'

interface Atividade {
  id: string
  turma_disciplina_id: string
  titulo: string
  descricao: string
  data_atribuicao: string
  data_entrega: string
}

interface Entrega {
  matricula_id: string
  entregue: boolean
  observacao_professor: string | null
}

export default function AtividadeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [atividade, setAtividade] = useState<Atividade | null>(null)
  const [alunos, setAlunos] = useState<Array<{ matricula_id: string; nome_completo: string }>>([])
  const [entregas, setEntregas] = useState<Record<string, Entrega>>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const atvRes = await getAtividade(id)
    if (atvRes.error || !atvRes.data) {
      setError(atvRes.error ?? 'Atividade não encontrada')
      setIsLoading(false)
      return
    }
    const atv = atvRes.data as Atividade
    setAtividade(atv)

    // Get funcionario
    const funcRes = await getFuncionarioByUser()
    if (funcRes.error || !funcRes.data) { setError(funcRes.error ?? 'Não autenticado'); setIsLoading(false); return }

    // Get turmas to find the turma_id
    const turmasRes = await getTurmasDoProfessor(funcRes.data.id)
    if (turmasRes.data) {
      const turmaInfo = (turmasRes.data ?? []).find((t: Record<string, unknown>) => t.id === atv.turma_disciplina_id) as Record<string, unknown> | undefined
      if (turmaInfo) {
        const alunosRes = await getAlunosDaTurma(turmaInfo.turma_id as string)
        if (alunosRes.data) setAlunos((alunosRes.data ?? []) as Array<{ matricula_id: string; nome_completo: string }>)
      }
    }

    // Load entregas
    const entRes = await getEntregas(id)
    if (entRes.data) {
      const map: Record<string, Entrega> = {}
      for (const e of entRes.data as Array<Record<string, unknown>>) {
        map[e.matricula_id as string] = {
          matricula_id: e.matricula_id as string,
          entregue: e.entregue as boolean,
          observacao_professor: (e.observacao_professor as string) ?? null,
        }
      }
      setEntregas(map)
    }

    setIsLoading(false)
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  async function handleSaveAtividade(formData: FormData) {
    setIsSaving(true)
    setError(null)
    const result = await atualizarAtividade(id, formData)
    if (result.error) {
      setError(result.error)
      setIsSaving(false)
    } else {
      setEditMode(false)
      setIsSaving(false)
      loadData()
    }
  }

  async function handleDelete() {
    if (!confirm('Excluir esta atividade? As entregas também serão removidas.')) return
    const result = await excluirAtividade(id)
    if (result.error) setError(result.error)
    else router.push('/professor/atividades')
  }

  function toggleEntrega(matriculaId: string) {
    setEntregas((prev) => ({
      ...prev,
      [matriculaId]: {
        matricula_id: matriculaId,
        entregue: !(prev[matriculaId]?.entregue ?? false),
        observacao_professor: prev[matriculaId]?.observacao_professor ?? null,
      },
    }))
  }

  function updateObservacao(matriculaId: string, obs: string) {
    setEntregas((prev) => ({
      ...prev,
      [matriculaId]: {
        matricula_id: matriculaId,
        entregue: prev[matriculaId]?.entregue ?? false,
        observacao_professor: obs || null,
      },
    }))
  }

  async function handleSaveEntregas() {
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    for (const aluno of alunos) {
      const entrega = entregas[aluno.matricula_id]
      if (entrega) {
        const result = await registrarEntrega(id, aluno.matricula_id, entrega.entregue, entrega.observacao_professor ?? undefined)
        if (result.error) {
          setError(result.error)
          setIsSaving(false)
          return
        }
      }
    }

    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setIsSaving(false)
  }

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
  }

  if (!atividade) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error ?? 'Atividade não encontrada.'}</p>
        <Link href="/professor/atividades" className="mt-4 inline-block text-sm text-primary hover:underline">← Voltar</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/professor/atividades" className="text-sm text-primary hover:underline">← Voltar</Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-primary-800)]">{atividade.titulo}</h1>
        <p className="text-sm text-gray-500">
          Entrega: {new Date(atividade.data_entrega + 'T00:00:00').toLocaleDateString('pt-BR')}
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {success && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4 text-sm text-green-700">Entregas salvas com sucesso!</CardContent>
        </Card>
      )}

      {/* Atividade details */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {editMode ? (
            <form action={handleSaveAtividade} className="space-y-4">
              <Input id="titulo" name="titulo" label="Título" required defaultValue={atividade.titulo} />
              <Textarea id="descricao" name="descricao" label="Descrição" required defaultValue={atividade.descricao} />
              <Input id="data_entrega" name="data_entrega" label="Data de Entrega" required type="date" defaultValue={atividade.data_entrega} />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                <Button type="submit" isLoading={isSaving}>Salvar</Button>
              </div>
            </form>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">Descrição</h3>
                <p className="mt-1 text-gray-800 whitespace-pre-wrap">{atividade.descricao}</p>
              </div>
              <p className="text-sm text-gray-500">
                Atribuída em: {new Date(atividade.data_atribuicao + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
              <div className="mt-4 flex gap-3">
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>Editar</Button>
                <Button variant="danger" size="sm" onClick={handleDelete}>Excluir</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Entregas */}
      <h2 className="mb-4 text-lg font-semibold text-[var(--color-primary-800)]">Controle de Entregas</h2>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[var(--color-primary-50)]">
                <th className="px-4 py-3 text-left font-medium text-[var(--color-primary-800)]">Aluno</th>
                <th className="px-4 py-3 text-center font-medium text-[var(--color-primary-800)] w-24">Entregue</th>
                <th className="px-4 py-3 font-medium text-[var(--color-primary-800)]">Observação</th>
              </tr>
            </thead>
            <tbody>
              {alunos.map((aluno, idx) => (
                <tr key={aluno.matricula_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-gray-800">{aluno.nome_completo}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => toggleEntrega(aluno.matricula_id)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        entregas[aluno.matricula_id]?.entregue
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {entregas[aluno.matricula_id]?.entregue ? <><Check size={14} /> Sim</> : <><X size={14} /> Não</>}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      placeholder="Observação (opcional)"
                      value={entregas[aluno.matricula_id]?.observacao_professor ?? ''}
                      onChange={(e) => updateObservacao(aluno.matricula_id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
              {alunos.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-sm text-gray-400">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleSaveEntregas} isLoading={isSaving}>
          <Save size={18} /> Salvar Entregas
        </Button>
      </div>
    </div>
  )
}
