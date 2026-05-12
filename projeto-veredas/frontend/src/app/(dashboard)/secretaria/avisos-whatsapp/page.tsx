'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  listarAvisosPendentes,
  gerarAvisosFaltas,
  gerarAvisosFinanceiro,
  marcarAvisoEnviado,
  marcarAvisosEnviados,
  getContagemPendentes,
} from '@/lib/actions/avisos-whatsapp'
import type { AvisoWhatsApp, AvisoTipo } from '@/types/entities'
import { MessageCircle, Check, RefreshCw, AlertTriangle } from 'lucide-react'

const TIPO_LABEL: Record<AvisoTipo, string> = {
  falta: 'Faltas',
  financeiro: 'Financeiro',
  comunicado: 'Comunicados',
}

const TIPO_ICON: Record<AvisoTipo, string> = {
  falta: '⚠️',
  financeiro: '💰',
  comunicado: '📢',
}

const TIPO_COR: Record<AvisoTipo, string> = {
  falta: 'border-l-red-400 bg-red-50',
  financeiro: 'border-l-amber-400 bg-amber-50',
  comunicado: 'border-l-blue-400 bg-blue-50',
}

export default function AvisosWhatsAppPage() {
  const [avisos, setAvisos] = useState<AvisoWhatsApp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isGerando, setIsGerando] = useState<AvisoTipo | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [contagens, setContagens] = useState({ total: 0, faltas: 0, financeiro: 0, comunicado: 0 })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const [avisosRes, contRes] = await Promise.all([
      listarAvisosPendentes(),
      getContagemPendentes(),
    ])
    if (avisosRes.error) setError(avisosRes.error)
    else setAvisos(avisosRes.data ?? [])
    if (contRes.data) setContagens(contRes.data)
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleGerar(tipo: AvisoTipo) {
    setIsGerando(tipo)
    setError(null)
    setSuccessMsg(null)
    let res
    if (tipo === 'falta') res = await gerarAvisosFaltas()
    else if (tipo === 'financeiro') res = await gerarAvisosFinanceiro()
    if (res?.error) setError(res.error)
    else {
      const qtd = res?.data ?? 0
      if (qtd > 0) setSuccessMsg(`${qtd} aviso(s) de ${TIPO_LABEL[tipo]} gerado(s).`)
      else setSuccessMsg(`Nenhum novo aviso de ${TIPO_LABEL[tipo]} pendente.`)
      fetchData()
    }
    setIsGerando(null)
  }

  async function handleMarcarEnviado(id: string) {
    const res = await marcarAvisoEnviado(id)
    if (res.error) setError(res.error)
    else {
      setAvisos((prev) => prev.filter((a) => a.id !== id))
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  async function handleMarcarTodosEnviados(ids: string[]) {
    if (ids.length === 0) return
    const res = await marcarAvisosEnviados(ids)
    if (res.error) setError(res.error)
    else {
      setAvisos((prev) => prev.filter((a) => !ids.includes(a.id)))
      setSelectedIds(new Set())
      setSuccessMsg(`${ids.length} aviso(s) marcado(s) como enviado.`)
      setTimeout(() => setSuccessMsg(null), 3000)
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll(ids: string[]) {
    setSelectedIds(new Set(ids))
  }

  function deselectAll() {
    setSelectedIds(new Set())
  }

  function abrirWhatsApp(telefone: string, mensagem: string) {
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`
    window.open(url, '_blank')
  }

  function abrirWhatsAppTodos(ids: string[]) {
    const items = avisos.filter((a) => ids.includes(a.id))
    for (const item of items) {
      setTimeout(() => {
        abrirWhatsApp(item.responsavel_telefone, item.mensagem)
      }, 500)
    }
  }

  const avisosPorTipo = (tipo: AvisoTipo) => avisos.filter((a) => a.tipo === tipo)

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--color-primary-800)]">Avisos WhatsApp</h1>
        <p className="text-sm text-gray-500 mt-1">Revise e envie avisos para os responsáveis.</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {/* Barra de ações global */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-[var(--color-primary)] p-3 text-white text-sm">
          <span className="font-medium">{selectedIds.size}</span> selecionado(s)
          <button onClick={() => abrirWhatsAppTodos(Array.from(selectedIds))}
            className="ml-auto flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1 text-xs hover:bg-white/30">
            <MessageCircle size={14} /> Enviar todos
          </button>
          <button onClick={async () => { await handleMarcarTodosEnviados(Array.from(selectedIds)) }}
            className="flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1 text-xs hover:bg-white/30">
            <Check size={14} /> OK
          </button>
          <button onClick={deselectAll} className="text-white/70 text-xs hover:text-white">Limpar</button>
        </div>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl bg-stone-200" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Falta */}
          <SeçãoAvisos
            tipo="falta"
            label={TIPO_LABEL.falta}
            icon={TIPO_ICON.falta}
            cor={TIPO_COR.falta}
            avisos={avisosPorTipo('falta')}
            contagem={contagens.faltas}
            isGerando={isGerando === 'falta'}
            selectedIds={selectedIds}
            onGerar={() => handleGerar('falta')}
            onToggleSelect={toggleSelect}
            onSelectAll={() => selectAll(avisosPorTipo('falta').map((a) => a.id))}
            onMarcarEnviado={handleMarcarEnviado}
            onAbrirWhatsApp={abrirWhatsApp}
          />

          {/* Financeiro */}
          <SeçãoAvisos
            tipo="financeiro"
            label={TIPO_LABEL.financeiro}
            icon={TIPO_ICON.financeiro}
            cor={TIPO_COR.financeiro}
            avisos={avisosPorTipo('financeiro')}
            contagem={contagens.financeiro}
            isGerando={isGerando === 'financeiro'}
            selectedIds={selectedIds}
            onGerar={() => handleGerar('financeiro')}
            onToggleSelect={toggleSelect}
            onSelectAll={() => selectAll(avisosPorTipo('financeiro').map((a) => a.id))}
            onMarcarEnviado={handleMarcarEnviado}
            onAbrirWhatsApp={abrirWhatsApp}
          />

          {/* Comunicados */}
          <SeçãoAvisos
            tipo="comunicado"
            label={TIPO_LABEL.comunicado}
            icon={TIPO_ICON.comunicado}
            cor={TIPO_COR.comunicado}
            avisos={avisosPorTipo('comunicado')}
            contagem={contagens.comunicado}
            isGerando={false}
            selectedIds={selectedIds}
            onGerar={undefined}
            onToggleSelect={toggleSelect}
            onSelectAll={() => selectAll(avisosPorTipo('comunicado').map((a) => a.id))}
            onMarcarEnviado={handleMarcarEnviado}
            onAbrirWhatsApp={abrirWhatsApp}
          />

          {avisos.length === 0 && !isLoading && (
            <div className="rounded-xl bg-white border border-stone-200 p-8 text-center text-sm text-gray-400">
              Nenhum aviso pendente. Use os botões &quot;Gerar&quot; acima para criar avisos.
            </div>
          )}
        </div>
      )}

      {/* Resumo no rodapé */}
      {contagens.total > 0 && (
        <div className="mt-6 rounded-xl bg-white border border-stone-200 p-3 text-xs text-gray-500 text-center">
          {contagens.total} aviso(s) pendente(s) · {contagens.faltas} falta(s) · {contagens.financeiro} financeiro(s) · {contagens.comunicado} comunicado(s)
        </div>
      )}
    </div>
  )
}

// ───── Subcomponente: Seção ─────

function SeçãoAvisos({
  tipo, label, icon, cor, avisos, contagem, isGerando, selectedIds,
  onGerar, onToggleSelect, onSelectAll, onMarcarEnviado, onAbrirWhatsApp,
}: {
  tipo: AvisoTipo
  label: string
  icon: string
  cor: string
  avisos: AvisoWhatsApp[]
  contagem: number
  isGerando: boolean
  selectedIds: Set<string>
  onGerar?: () => void
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onMarcarEnviado: (id: string) => void
  onAbrirWhatsApp: (tel: string, msg: string) => void
}) {
  const todosSelecionados = avisos.length > 0 && avisos.every((a) => selectedIds.has(a.id))
  const ids = avisos.map((a) => a.id)

  return (
    <div className="rounded-xl bg-white border border-stone-200 overflow-hidden">
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between bg-stone-50 px-4 py-3 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-semibold text-[var(--color-primary-800)]">{label}</span>
          <span className="text-xs bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded-full">{contagem}</span>
        </div>
        <div className="flex items-center gap-1">
          {onGerar && (
            <button onClick={onGerar} disabled={isGerando}
              className="flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-2.5 py-1.5 text-xs text-white hover:bg-[var(--color-primary-700)] disabled:opacity-50">
              <RefreshCw size={12} className={isGerando ? 'animate-spin' : ''} />
              Gerar
            </button>
          )}
          {avisos.length > 0 && (
            <button onClick={() => todosSelecionados ? onSelectAll([]) : onSelectAll(ids)}
              className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs text-stone-600 hover:bg-stone-100">
              {todosSelecionados ? 'Limpar' : `Todos (${avisos.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Lista de avisos */}
      {avisos.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-gray-400">
          Nenhum aviso pendente. Clique em &quot;Gerar&quot; para buscar novos.
        </div>
      ) : (
        <div className="divide-y divide-stone-100">
          {avisos.map((a) => {
            const isSelected = selectedIds.has(a.id)
            return (
              <div key={a.id} className={`flex items-start gap-3 px-4 py-3 ${isSelected ? 'bg-[var(--color-primary-50)]' : ''}`}>
                {/* Checkbox */}
                <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(a.id)}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-primary-800)] truncate">
                      {a.aluno_nome ?? '—'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {a.responsavel_nome} · {a.responsavel_telefone}
                  </p>
                  <div className="mt-1.5 rounded-lg bg-stone-50 p-2 text-xs text-stone-600 leading-relaxed">
                    {a.mensagem}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => onAbrirWhatsApp(a.responsavel_telefone, a.mensagem)}
                    className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs text-white hover:bg-green-700">
                    <MessageCircle size={14} /> Enviar
                  </button>
                  <button onClick={() => onMarcarEnviado(a.id)}
                    className="flex items-center gap-1 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs text-stone-600 hover:bg-stone-100">
                    <Check size={14} /> OK
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
