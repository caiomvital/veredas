'use client'

import { useEffect, useState } from 'react'
import { getFinanceiroResponsavel, getChavePixEscola, getWhatsAppEscola, type FinanceiroResponsavel } from '@/lib/actions/financeiro-responsavel'
import { Loader2, Check, AlertTriangle, CreditCard, MessageCircle } from 'lucide-react'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(d: string) {
  try { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') } catch { return d }
}

const MESES = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function ResponsavelFinanceiroPage() {
  const [data, setData] = useState<FinanceiroResponsavel[]>([])
  const [chavePix, setChavePix] = useState<string | null>(null)
  const [whatsApp, setWhatsApp] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getFinanceiroResponsavel(),
      getChavePixEscola(),
      getWhatsAppEscola(),
    ]).then(([finRes, pixRes, watRes]) => {
      if (finRes.error) setError(finRes.error)
      else setData(finRes.data ?? [])
      setChavePix(pixRes.data ?? null)
      setWhatsApp(watRes.data ?? null)
      setIsLoading(false)
    })
  }, [])

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-zab-verde" /></div>
  if (error) return <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>

  const totalGeral = data.reduce((s, d) => s + d.resumo.totalPendente, 0)

  return (
    <div>
      <h1 className="text-xl font-bold text-zab-verde mb-6">Financeiro</h1>

      {data.length === 0 ? (
        <div className="rounded-xl bg-white border border-stone-200 p-8 text-center text-sm text-gray-400">
          Nenhum dado financeiro disponível.
        </div>
      ) : (
        data.map((aluno) => (
          <div key={aluno.alunoId} className="mb-6">
            <div className="mb-3 rounded-xl bg-zab-verde-claro p-3 text-sm">
              <span className="font-medium text-zab-verde">{aluno.alunoNome}</span>
            </div>

            {/* Cards resumo */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl bg-white border border-stone-200 p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{aluno.resumo.pago}</p>
                <p className="text-xs text-gray-500">Pagas</p>
              </div>
              <div className="rounded-xl bg-white border border-stone-200 p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{aluno.resumo.pendente}</p>
                <p className="text-xs text-gray-500">Pendentes</p>
              </div>
              <div className="rounded-xl bg-white border border-stone-200 p-4 text-center">
                <p className={`text-2xl font-bold ${aluno.resumo.vencido > 0 ? 'text-red-600' : 'text-gray-400'}`}>{aluno.resumo.vencido}</p>
                <p className="text-xs text-gray-500">Vencidas</p>
              </div>
            </div>

            {aluno.resumo.totalPendente > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-4 text-sm flex items-center justify-between">
                <span className="text-amber-800">
                  <AlertTriangle size={14} className="inline mr-1" />
                  Total em aberto: <strong>{formatCurrency(aluno.resumo.totalPendente)}</strong>
                </span>
              </div>
            )}

            {/* Lista */}
            <div className="space-y-2">
              {aluno.lancamentos.map((l) => {
                const isVencido = l.status === 'pendente' && l.dataVencimento < new Date().toISOString().split('T')[0]
                return (
                  <div key={l.id} className="rounded-xl bg-white border border-stone-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          l.status === 'pago' ? 'bg-green-500' : isVencido ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-zab-texto">
                            {MESES[l.mes] ?? l.mes}/{l.ano}
                          </p>
                          <p className="text-xs text-gray-400">{formatDate(l.dataVencimento)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-zab-texto">{formatCurrency(l.valor)}</p>
                        <span className={`text-xs font-medium ${
                          l.status === 'pago' ? 'text-green-600' : isVencido ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {l.status === 'pago' ? 'Pago' : isVencido ? 'Vencido' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                    {l.multa > 0 && (
                      <p className="mt-1 text-xs text-red-500">Multa: {formatCurrency(l.multa)}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* PIX */}
      {chavePix && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={16} className="text-green-600" />
            <span className="text-sm font-semibold text-green-800">PIX para Pagamento</span>
          </div>
          <p className="text-sm text-green-700 font-mono">{chavePix}</p>
        </div>
      )}

      {/* WhatsApp */}
      {whatsApp && (
        <a
          href={`https://wa.me/55${whatsApp}?text=${encodeURIComponent('Olá! Gostaria de falar sobre pendências financeiras.')}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-green-500 p-3 text-sm font-medium text-white hover:bg-green-600 transition-colors"
        >
          <MessageCircle size={18} />
          Falar com a Secretaria
        </a>
      )}

      <p className="mt-4 text-center text-xs text-gray-400">
        Em caso de dúvidas, entre em contato com a secretaria da escola.
      </p>
    </div>
  )
}
