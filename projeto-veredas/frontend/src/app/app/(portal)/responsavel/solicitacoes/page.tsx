'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  listarSolicitacoesResponsavel,
  criarSolicitacao,
  cancelarSolicitacao,
  getAlunosDoResponsavelParaSolicitacao,
  TIPO_LABEL,
  STATUS_LABEL,
  STATUS_VARIANT,
  DOCUMENTO_TIPO_LABEL,
  type Solicitacao,
} from '@/lib/actions/solicitacoes'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, MessageSquare, X, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'

export default function ResponsavelSolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [alunos, setAlunos] = useState<{ id: string; nome_completo: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formTipo, setFormTipo] = useState('')

  function loadData() {
    setIsLoading(true)
    setError(null)
    Promise.all([
      listarSolicitacoesResponsavel(),
      getAlunosDoResponsavelParaSolicitacao(),
    ]).then(([solRes, alunosRes]) => {
      if (solRes.error) setError(solRes.error)
      else setSolicitacoes(solRes.data ?? [])
      if (alunosRes.data) setAlunos(alunosRes.data)
      setIsLoading(false)
    })
  }

  useEffect(() => { loadData() }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const res = await criarSolicitacao(formData)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Solicitação enviada com sucesso!')
      setShowForm(false)
      loadData()
    }
  }

  async function handleCancelar(id: string) {
    const res = await cancelarSolicitacao(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Solicitação cancelada')
      loadData()
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zab-verde">Minhas Solicitações</h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhe seus pedidos à escola.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={18} className="mr-1" /> {showForm ? 'Cancelar' : 'Nova Solicitação'}
        </Button>
      </div>

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Nova Solicitação</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tipo *</label>
                <Select name="tipo" required value={formTipo}
                  onChange={(e) => setFormTipo(e.target.value)}
                  options={[
                    { value: '', label: 'Selecione...' },
                    { value: 'justificativa_falta', label: 'Justificativa de Falta' },
                    { value: 'pedido_documento', label: 'Pedido de Documento' },
                    { value: 'atualizacao_dados', label: 'Atualização de Dados' },
                    { value: 'outro', label: 'Outro' },
                  ]}
                />
              </div>
              {formTipo === 'pedido_documento' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de Documento *</label>
                  <Select name="documento_tipo" required
                    options={[
                      { value: '', label: 'Selecione...' },
                      { value: 'declaracao_matricula', label: 'Declaração de Matrícula' },
                      { value: 'declaracao_frequencia', label: 'Declaração de Frequência' },
                      { value: 'historico', label: 'Histórico Escolar' },
                      { value: 'contrato', label: 'Contrato' },
                    ]}
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Aluno (opcional)</label>
                <Select name="aluno_id"
                  options={[
                    { value: '', label: 'Nenhum (geral)' },
                    ...alunos.map((a) => ({ value: a.id, label: a.nome_completo })),
                  ]}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Assunto *</label>
                <Input name="assunto" required placeholder="Ex: Solicito declaração de matrícula" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
                <Textarea name="descricao" rows={3} placeholder="Detalhe sua solicitação..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit">Enviar Solicitação</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-stone-200" />)}
        </div>
      ) : solicitacoes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-gray-400">
            <MessageSquare size={40} className="mb-2 text-gray-300" />
            <p className="text-sm">Nenhuma solicitação encontrada.</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowForm(true)}>
              <Plus size={16} className="mr-1" /> Criar Primeira Solicitação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {solicitacoes.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">{s.assunto}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {TIPO_LABEL[s.tipo] ?? s.tipo}
                      {s.documento_tipo && ` — ${DOCUMENTO_TIPO_LABEL[s.documento_tipo] ?? s.documento_tipo}`}
                      {s.aluno_nome && ` · ${s.aluno_nome}`}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                </div>

                {s.descricao && (
                  <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{s.descricao}</p>
                )}

                {s.resposta && (
                  <div className="mt-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                    <p className="font-medium text-xs text-green-600 mb-1">Resposta da escola:</p>
                    {s.resposta}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                  <span>{new Date(s.created_at).toLocaleDateString('pt-BR')}</span>
                  {s.status === 'aberta' && (
                    <button onClick={() => handleCancelar(s.id)}
                      className="text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                      <X size={14} /> Cancelar
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
