'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  listarSolicitacoesEscola,
  responderSolicitacao,
  TIPO_LABEL,
  STATUS_LABEL,
  STATUS_VARIANT,
  DOCUMENTO_TIPO_LABEL,
  type Solicitacao,
} from '@/lib/actions/solicitacoes'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RefreshCw, CheckCircle, MessageSquare, User, FileText } from 'lucide-react'
import { toast } from 'sonner'

export default function SecretariaSolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [respondendoId, setRespondendoId] = useState<string | null>(null)
  const [resposta, setResposta] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const res = await listarSolicitacoesEscola(filtroStatus || undefined)
    if (res.error) setError(res.error)
    else setSolicitacoes(res.data ?? [])
    setIsLoading(false)
  }, [filtroStatus])

  useEffect(() => { loadData() }, [loadData])

  async function handleResponder(id: string, novoStatus: 'resolvida' | 'em_andamento') {
    if (!resposta.trim()) {
      toast.error('Escreva uma resposta antes de finalizar.')
      return
    }
    const res = await responderSolicitacao(id, resposta, novoStatus)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Solicitação respondida!')
      setRespondendoId(null)
      setResposta('')
      loadData()
    }
  }

  const pendentes = solicitacoes.filter((s) => s.status === 'aberta' || s.status === 'em_andamento')
  const resolvidas = solicitacoes.filter((s) => s.status === 'resolvida' || s.status === 'cancelada')

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Solicitações</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os pedidos dos responsáveis.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={[
              { value: '', label: 'Todas' },
              { value: 'aberta', label: 'Abertas' },
              { value: 'em_andamento', label: 'Em Andamento' },
              { value: 'resolvida', label: 'Resolvidas' },
              { value: 'cancelada', label: 'Canceladas' },
            ]}
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-40"
          />
          <Button variant="outline" onClick={loadData} isLoading={isLoading}>
            <RefreshCw size={16} className="mr-1" /> Atualizar
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-stone-200" />)}
        </div>
      ) : solicitacoes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-gray-400">
            <MessageSquare size={40} className="mb-2 text-gray-300" />
            <p className="text-sm">Nenhuma solicitação encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pendentes */}
          {pendentes.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-base font-semibold text-gray-800">
                Pendentes
                <span className="ml-2 text-sm font-normal text-gray-400">({pendentes.length})</span>
              </h2>
              <div className="space-y-3">
                {pendentes.map((s) => (
                  <SolicitacaoCard
                    key={s.id}
                    solicitacao={s}
                    respondendoId={respondendoId}
                    resposta={resposta}
                    onStartResponder={() => { setRespondendoId(s.id); setResposta('') }}
                    onRespostaChange={setResposta}
                    onResponder={(status) => handleResponder(s.id, status)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Resolvidas */}
          {resolvidas.length > 0 && (
            <div>
              <h2 className="mb-3 text-base font-semibold text-gray-800">
                Resolvidas / Canceladas
                <span className="ml-2 text-sm font-normal text-gray-400">({resolvidas.length})</span>
              </h2>
              <div className="space-y-2">
                {resolvidas.map((s) => (
                  <Card key={s.id} className="opacity-70">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-800 truncate">{s.assunto}</h3>
                            <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {TIPO_LABEL[s.tipo]} · {s.responsavel_nome}
                            {s.aluno_nome && ` · ${s.aluno_nome}`}
                          </p>
                          {s.resposta && (
                            <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2">{s.resposta}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SolicitacaoCard({
  solicitacao: s,
  respondendoId,
  resposta,
  onStartResponder,
  onRespostaChange,
  onResponder,
}: {
  solicitacao: Solicitacao
  respondendoId: string | null
  resposta: string
  onStartResponder: () => void
  onRespostaChange: (v: string) => void
  onResponder: (status: 'resolvida' | 'em_andamento') => void
}) {
  const isRespondendo = respondendoId === s.id

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-800">{s.assunto}</h3>
              <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {TIPO_LABEL[s.tipo]}
              {s.documento_tipo && ` — ${DOCUMENTO_TIPO_LABEL[s.documento_tipo] ?? s.documento_tipo}`}
              {' · '}<span className="font-medium">{s.responsavel_nome}</span>
              {s.aluno_nome && ` · ${s.aluno_nome}`}
            </p>
          </div>
        </div>

        {s.descricao && (
          <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap bg-gray-50 rounded p-2">{s.descricao}</p>
        )}

        {s.resposta && (
          <div className="mb-3 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
            <p className="font-medium text-xs text-blue-600 mb-1">Resposta anterior:</p>
            {s.resposta}
          </div>
        )}

        {isRespondendo ? (
          <div className="space-y-3 mt-3">
            <Textarea
              placeholder="Escreva sua resposta..."
              value={resposta}
              onChange={(e) => onRespostaChange(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={() => onResponder('resolvida')} size="sm">
                <CheckCircle size={16} className="mr-1" /> Resolver
              </Button>
              <Button onClick={() => onResponder('em_andamento')} variant="outline" size="sm">
                Marcar em Andamento
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onStartResponder() /* fecha */}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          s.status !== 'resolvida' && s.status !== 'cancelada' && (
            <div className="mt-2 flex flex-wrap gap-2">
              {s.tipo === 'pedido_documento' && (() => {
                const links: Record<string, string> = {
                  declaracao_matricula: '/secretaria/declaracoes',
                  declaracao_frequencia: '/secretaria/declaracoes',
                  historico: '/secretaria/historico',
                  contrato: '/secretaria/contratos',
                }
                const href = s.documento_tipo ? links[s.documento_tipo] : null
                if (href) {
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      <Button type="button" size="sm" variant="outline">
                        <FileText size={14} className="mr-1" /> Gerar Documento
                      </Button>
                    </a>
                  )
                }
                return null
              })()}
              <Button size="sm" onClick={onStartResponder}>
                <MessageSquare size={14} className="mr-1" /> Responder
              </Button>
            </div>
          )
        )}

        <p className="mt-2 text-xs text-gray-400">
          {new Date(s.created_at).toLocaleDateString('pt-BR')}
        </p>
      </CardContent>
    </Card>
  )
}
