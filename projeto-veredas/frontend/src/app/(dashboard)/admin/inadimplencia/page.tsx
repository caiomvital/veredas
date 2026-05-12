'use client'

import { useEffect, useState, useMemo } from 'react'
import { listarInadimplentesDetalhado, type InadimplenteInfo } from '@/lib/actions/inadimplencia'
import { Card, CardContent } from '@/components/ui/card'

export default function InadimplenciaPage() {
  const [inadimplentes, setInadimplentes] = useState<InadimplenteInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listarInadimplentesDetalhado().then((res) => {
      if (res.error) setError(res.error)
      else setInadimplentes(res.data ?? [])
      setIsLoading(false)
    })
  }, [])

  const totalInadimplente = useMemo(
    () => inadimplentes.reduce((acc, i) => acc + i.valor + i.multa, 0),
    [inadimplentes]
  )

  // Agrupar por aluno para o WhatsApp
  const porAluno = useMemo(() => {
    const map = new Map<string, { alunoNome: string; telefone: string; lancamentos: InadimplenteInfo[]; total: number }>()
    for (const i of inadimplentes) {
      const key = i.alunoId ?? 'sem_aluno'
      if (!map.has(key)) {
        map.set(key, { alunoNome: i.alunoNome ?? '—', telefone: i.responsavelTelefone ?? '', lancamentos: [], total: 0 })
      }
      const entry = map.get(key)!
      entry.lancamentos.push(i)
      entry.total += i.valor + i.multa
    }
    return Array.from(map.entries()).filter(([key]) => key !== 'sem_aluno')
  }, [inadimplentes])

  function gerarMsgWhatsApp(alunoNome: string, total: number, lancamentos: InadimplenteInfo[]) {
    const detalhes = lancamentos.map((l) =>
      `${l.descricao}: R$ ${(l.valor + l.multa).toFixed(2)} (venc ${new Date(l.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')})`
    ).join('\n')
    const msg = `Prezado(a) responsável,\n\nO(s) seguinte(s) lançamento(s) do(a) aluno(a) ${alunoNome} encontra(m)-se em atraso:\n\n${detalhes}\n\nValor total devido: R$ ${total.toFixed(2)}\n\nSolicitamos regularização o mais breve possível.\n\nAtenciosamente,\nSecretaria Escolar`
    return encodeURIComponent(msg)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Relatório de Inadimplência</h1>
          <p className="text-sm text-gray-500 mt-1">Lançamentos com data de vencimento vencida e status pendente.</p>
        </div>
        <button onClick={handlePrint}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          Imprimir PDF
        </button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Totalizador */}
      <Card className="mb-6 border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-xs text-red-600 font-medium uppercase">Total Inadimplente</p>
            <p className="text-3xl font-bold text-red-700">R$ {totalInadimplente.toFixed(2)}</p>
            <p className="text-xs text-red-500 mt-1">{inadimplentes.length} lançamento{inadimplentes.length !== 1 ? 's' : ''} em atraso</p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-gray-100" />)}
        </div>
      ) : inadimplentes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-400">
            Nenhum lançamento em atraso.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tabela */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Aluno</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Responsável</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Telefone</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Descrição</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Valor</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Multa</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Vencimento</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Dias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inadimplentes.map((i) => (
                  <tr key={i.lancamentoId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{i.alunoNome ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{i.responsavelNome ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{i.responsavelTelefone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{i.descricao}</td>
                    <td className="px-4 py-3 text-center">R$ {i.valor.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-red-600">R$ {i.multa.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center font-medium">R$ {(i.valor + i.multa).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {new Date(i.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-center text-red-600">{i.diasAtraso}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ações por aluno */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--color-primary-800)]">Avisar Responsáveis</h2>
            {porAluno.map(([key, entry]) => (
              <Card key={key}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{entry.alunoNome}</p>
                    <p className="text-sm text-gray-500">
                      {entry.lancamentos.length} lançamento{entry.lancamentos.length !== 1 ? 's' : ''} · Total: R$ {entry.total.toFixed(2)}
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/${entry.telefone.replace(/\D/g, '')}?text=${gerarMsgWhatsApp(entry.alunoNome, entry.total, entry.lancamentos)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors"
                  >
                    Avisar WhatsApp
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          nav, aside, .sidebar, button { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  )
}
