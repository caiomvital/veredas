'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { listarAgendaDetalhada, criarRegistro, marcarLido } from '@/lib/actions/agenda'
import { getAluno } from '@/lib/actions/alunos'
import type { AgendaRegistroDetalhado } from '@/lib/actions/agenda'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Send, User, MessageCircle, BookOpen, Eye } from 'lucide-react'

const TIPO_OPTIONS = [
  { value: 'recado', label: 'Recado' },
  { value: 'tarefa', label: 'Tarefa' },
  { value: 'observacao', label: 'Observação' },
]

const TIPO_ICON: Record<string, React.ReactNode> = {
  recado: <MessageCircle size={14} />,
  tarefa: <BookOpen size={14} />,
  observacao: <Eye size={14} />,
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function groupByDate(registros: AgendaRegistroDetalhado[]): Map<string, AgendaRegistroDetalhado[]> {
  const groups = new Map<string, AgendaRegistroDetalhado[]>()
  for (const r of registros) {
    const key = r.data_registro
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }
  return groups
}

export default function ProfessorAlunoAgendaPage() {
  const params = useParams()
  const router = useRouter()
  const alunoId = params.alunoId as string

  const [alunoNome, setAlunoNome] = useState('')
  const [registros, setRegistros] = useState<AgendaRegistroDetalhado[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [tipo, setTipo] = useState('recado')
  const [conteudo, setConteudo] = useState('')
  const [dataRegistro, setDataRegistro] = useState(new Date().toISOString().split('T')[0])

  const loadData = useCallback(async () => {
    const [alunoRes, agendaRes] = await Promise.all([
      getAluno(alunoId),
      listarAgendaDetalhada(alunoId),
    ])
    if (alunoRes.data) setAlunoNome(alunoRes.data.nome_completo)
    else setError(alunoRes.error)
    if (agendaRes.data) setRegistros(agendaRes.data)
    setIsLoading(false)

    marcarLido(alunoId, 'professor')
  }, [alunoId])

  useEffect(() => { loadData() }, [loadData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!conteudo.trim()) return
    setIsSaving(true)
    setFormError(null)

    const formData = new FormData()
    formData.append('aluno_id', alunoId)
    formData.append('tipo', tipo)
    formData.append('conteudo', conteudo.trim())
    formData.append('data_registro', dataRegistro)

    const result = await criarRegistro(formData)
    if (result.error) {
      setFormError(result.error)
      setIsSaving(false)
    } else {
      setConteudo('')
      setTipo('recado')
      setDataRegistro(new Date().toISOString().split('T')[0])
      loadData()
    }
  }

  const grupos = groupByDate(registros)

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/professor/agenda"
          className="mb-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft size={16} /> Voltar para turmas
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">{alunoNome || 'Carregando...'}</h1>
        <p className="text-sm text-gray-500">Agenda do Aluno</p>
      </div>

      {/* Error */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Form */}
      <Card className="mb-8">
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Novo Registro</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <Select
                  options={TIPO_OPTIONS}
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                />
              </div>
              <div className="w-44">
                <Input
                  type="date"
                  value={dataRegistro}
                  onChange={(e) => setDataRegistro(e.target.value)}
                />
              </div>
            </div>
            <Textarea
              placeholder="Escreva o conteúdo do registro..."
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={3}
            />
            {formError && <p className="text-xs text-red-600">{formError}</p>}
            <div className="flex justify-end">
              <Button type="submit" isLoading={isSaving} disabled={!conteudo.trim()}>
                <Send size={16} className="mr-1" /> Enviar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Timeline */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Carregando registros...</p>
      ) : registros.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-500">
            Nenhum registro na agenda deste aluno ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(grupos.entries()).map(([data, items]) => (
            <div key={data}>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {formatDate(data)}
                </span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <div className="space-y-3">
                {items.map((item) => {
                  const isResposta = item.tipo === 'resposta_responsavel'
                  return (
                    <div
                      key={item.id}
                      className={`rounded-lg border p-4 ${
                        isResposta
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-border bg-white'
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full ${
                            isResposta
                              ? 'bg-orange-200 text-orange-700'
                              : 'bg-zab-verde-claro text-zab-verde'
                          }`}
                        >
                          {isResposta ? <User size={14} /> : TIPO_ICON[item.tipo] ?? <MessageCircle size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">
                            {isResposta ? item.autor_nome : 'Você'}
                            {isResposta && <span className="font-normal text-gray-500"> (Responsável)</span>}
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-400">{formatTime(item.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.conteudo}</p>
                      <div className="mt-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            isResposta
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {isResposta ? 'Resposta' : item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
