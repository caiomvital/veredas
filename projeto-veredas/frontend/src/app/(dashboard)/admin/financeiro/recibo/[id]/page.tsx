'use client'

import { useEffect, useState, use } from 'react'
import { getReciboData, type ReciboData } from '@/lib/actions/recibo'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [recibo, setRecibo] = useState<ReciboData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getReciboData(id).then((res) => {
      if (res.error) setError(res.error)
      else setRecibo(res.data)
      setIsLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!isLoading && recibo) {
      setTimeout(() => window.print(), 500)
    }
  }, [isLoading, recibo])

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
  if (error) return <div className="p-8 text-center text-sm text-red-600">{error}</div>
  if (!recibo) return null

  return (
    <div className="min-h-screen bg-white p-8 print:p-4">
      {/* Botão voltar (oculto na impressão) */}
      <button onClick={() => window.print()} className="no-print mb-6 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90">
        Imprimir / Salvar PDF
      </button>

      {/* Recibo */}
      <div className="mx-auto max-w-2xl border-2 border-gray-300 p-8 print:border-0">
        {/* Cabeçalho */}
        <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{recibo.escolaNome}</h1>
          {recibo.escolaCnpj && <p className="text-sm text-gray-500 mt-1">CNPJ: {recibo.escolaCnpj}</p>}
          {recibo.escolaEndereco && <p className="text-sm text-gray-500">{recibo.escolaEndereco}</p>}
        </div>

        <h2 className="text-center text-lg font-bold text-gray-800 mb-6">RECIBO DE PAGAMENTO</h2>

        <div className="text-right text-sm text-gray-500 mb-6">
          <p>Recibo nº <strong className="text-gray-800">{recibo.numeroRecibo}</strong></p>
          <p>Data: {new Date(recibo.dataPagamento + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Dados */}
        <div className="space-y-3 text-sm mb-8">
          <p><span className="text-gray-500">Aluno:</span> <strong>{recibo.alunoNome ?? '—'}</strong></p>
          <p><span className="text-gray-500">Responsável:</span> <strong>{recibo.responsavelNome ?? '—'}</strong></p>
          <p><span className="text-gray-500">Referente a:</span> <strong>{recibo.descricao}</strong></p>
          {recibo.mesReferencia && (
            <p><span className="text-gray-500">Mês de referência:</span> <strong>{MESES[recibo.mesReferencia - 1]}{recibo.anoReferencia ? `/${recibo.anoReferencia}` : ''}</strong></p>
          )}
        </div>

        {/* Valores */}
        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="py-2 text-left font-medium text-gray-600">Descrição</th>
              <th className="py-2 text-right font-medium text-gray-600">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 text-gray-700">{recibo.descricao}</td>
              <td className="py-2 text-right">R$ {recibo.valor.toFixed(2)}</td>
            </tr>
            {recibo.multa > 0 && (
              <tr>
                <td className="py-2 text-gray-700">Multa por atraso (2%)</td>
                <td className="py-2 text-right text-red-600">R$ {recibo.multa.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 font-bold">
              <td className="py-2 text-gray-800">TOTAL</td>
              <td className="py-2 text-right text-lg">R$ {recibo.valorTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Dados do pagamento */}
        <div className="text-sm text-gray-500 mb-12">
          <p>Forma de pagamento: Dinheiro/Espécie</p>
          <p>Data do pagamento: {new Date(recibo.dataPagamento + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
          <p>Vencimento original: {new Date(recibo.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Assinatura */}
        <div className="mt-16 pt-4 border-t border-gray-300">
          <div className="text-center">
            <div className="inline-block w-64 border-b border-gray-400 mb-1" style={{ height: '40px' }} />
            <p className="text-sm text-gray-500">Assinatura / Carimbo</p>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>Este recibo é um documento comprobatório de pagamento.</p>
          <p>Gerado em {new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; -webkit-print-color-adjust: exact; }
          @page { margin: 15mm; }
        }
      `}</style>
    </div>
  )
}
