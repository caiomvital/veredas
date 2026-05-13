'use client'

import { useEffect, useState, useCallback } from 'react'
import { listarAgendaDetalhada, responderAgenda, marcarLido } from '@/lib/actions/agenda'
import { getAlunosDoResponsavel } from '@/lib/actions/responsavel'
import type { AgendaRegistroDetalhado } from '@/lib/actions/agenda'
import type { AlunoResponsavelView } from '@/lib/actions/responsavel'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Send, User, MessageCircle, BookOpen, Eye, ChevronDown } from 'lucide-react'

const TIPO_LABEL: Record<string, string> = {
  recado: 'Recado',
  tarefa: 'Tarefa',
  observacao: 'Observação',
  resposta_responsavel: 'Você',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateStr === today.toISOString().split('T')[0]) return 'Hoje'
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Ontem'
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

export default function ResponsavelAgendaPage() {
  const [alunos, setAlunos] = useState<AlunoResponsavelView[]>([])
  const [alunoId, setAlunoId] = useState('')
  const [registros, setRegistros] = useState<AgendaRegistroDetalhado[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAgenda, setIsLoadingAgenda] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [conteudo, setConteudo] = useState('')

  useEffect(() => {
    getAlunosDoResponsavel().then((res) => {
      if (res.data) {
        setAlunos(res.data)
        if (res.data.length === 1) {
          setAlunoId(res.data[0].id)
        }
      } else {
        setError(res.data === null && alunos.length === 0 ? 'Nenhum aluno vinculado.' : res.error)
      }
      setIsLoading(false)
    })
  }, [])

  const loadAgenda = useCallback(async () => {
    if (!alunoId) { setRegistros([]); return }
    setIsLoadingAgenda(true)
    const res = await listarAgendaDetalhada(alunoId)
    if (res.data) setRegistros(res.data)
    setIsLoadingAgenda(false)

    marcarLido(alunoId, 'responsavel')
  }, [alunoId])

  useEffect(() => { loadAgenda() }, [loadAgenda])

  const alunoSelecionado = alunos.find((a) => a.id === alunoId)

  async function handleResponder(e: React.FormEvent) {
    e.preventDefault()
    if (!conteudo.trim() || !alunoId) return
    setIsSaving(true)
    setFormError(null)

    const formData = new FormData()
    formData.append('aluno_id', alunoId)
    formData.append('conteudo', conteudo.trim())

    const result = await responderAgenda(formData)
    if (result.error) {
      setFormError(result.error)
      setIsSaving(false)
    } else {
      setConteudo('')
      loadAgenda()
    }
  }

  const grupos = groupByDate(registros)

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-primary-800)]">Agenda</h1>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : alunos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-500">
            Nenhum aluno vinculado ao seu perfil.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Aluno selector */}
          {alunos.length > 1 && (
            <div className="mb-4">
              <Select
                options={[
                  { value: '', label: 'Selecione um aluno...' },
                  ...alunos.map((a) => ({
                    value: a.id,
                    label: `${a.nome_completo} — ${a.turma_serie} ${a.turma_codigo}`,
                  })),
                ]}
                value={alunoId}
                onChange={(e) => setAlunoId(e.target.value)}
              />
            </div>
          )}

          {alunos.length === 1 && alunoSelecionado && (
            <div className="mb-4 rounded-lg bg-zab-verde-claro p-3">
              <p className="text-sm font-medium text-zab-verde">{alunoSelecionado.nome_completo}</p>
              <p className="text-xs text-gray-500">
                {alunoSelecionado.turma_serie} — {alunoSelecionado.turma_codigo} ({alunoSelecionado.turma_turno})
              </p>
            </div>
          )}

          {!alunoId ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-gray-500">
                Selecione um aluno para ver a agenda.
              </CardContent>
            </Card>
          ) : isLoadingAgenda ? (
            <p className="text-sm text-gray-400">Carregando agenda...</p>
          ) : registros.length === 0 ? (
            <Card className="mb-4">
              <CardContent className="p-8 text-center text-sm text-gray-500">
                Nenhum registro na agenda deste aluno ainda.
              </CardContent>
            </Card>
          ) : (
            <div className="mb-4 space-y-6">
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
                      const isMinhaResposta = item.tipo === 'resposta_responsavel'
                      return (
                        <div
                          key={item.id}
                          className={`flex ${isMinhaResposta ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg border p-3 ${
                              isMinhaResposta
                                ? 'border-zab-verde/20 bg-zab-verde-claro'
                                : 'border-border bg-white'
                            }`}
                          >
                            <div className={`mb-1 flex items-center gap-2 ${isMinhaResposta ? 'flex-row-reverse' : ''}`}>
                              <span className="text-[10px] font-medium text-gray-500">
                                {isMinhaResposta ? 'Você' : item.autor_nome}
                              </span>
                              <span className="text-[10px] text-gray-400">{formatTime(item.created_at)}</span>
                            </div>
                            {!isMinhaResposta && (
                              <span className="mb-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                                {TIPO_LABEL[item.tipo] ?? item.tipo}
                              </span>
                            )}
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.conteudo}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Response form */}
          {alunoId && (
            <Card className="sticky bottom-0 border-t-2 border-t-zab-verde/20">
              <CardContent className="p-4">
                <form onSubmit={handleResponder} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Escreva sua resposta..."
                      value={conteudo}
                      onChange={(e) => setConteudo(e.target.value)}
                      rows={2}
                    />
                    {formError && <p className="mt-1 text-xs text-red-600">{formError}</p>}
                  </div>
                  <Button type="submit" isLoading={isSaving} disabled={!conteudo.trim()}>
                    <Send size={16} />
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
