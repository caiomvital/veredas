'use client'

import { useEffect, useState } from 'react'
import { getRelatorioFinanceiro, type RelatorioMensalResumo } from '@/lib/actions/relatorio-financeiro'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Download, DollarSign, TrendingUp, AlertCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

function formatCurrency(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function RelatorioFinanceiroPage() {
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())
  const [data, setData] = useState<RelatorioMensalResumo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    getRelatorioFinanceiro(mes, ano).then((res) => {
      if (res.error) setError(res.error)
      else setData(res.data)
      setIsLoading(false)
    })
  }, [mes, ano])

  function handleExportCSV() {
    if (!data) return
    const rows = [['Turma', 'Alunos', 'Previsto', 'Recebido', 'Pendente', 'Inadimplente', '% Recebido']]
    for (const t of data.porTurma) {
      rows.push([t.turmaCodigo, String(t.alunos), String(t.previsto), String(t.recebido), String(t.pendente), String(t.inadimplente), String(t.percRecebido)])
    }
    rows.push([])
    rows.push(['Total', '', String(data.totalPrevisto), String(data.totalRecebido), String(data.totalPendente), String(data.totalInadimplente), ''])
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `relatorio-financeiro-${mes}-${ano}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportPDF() {
    if (!data) return
    const win = window.open('', '_blank')
    if (!win) return
    const maxPrev = Math.max(...data.receitaMensal.map((r) => r.previsto), 1)
    win.document.write(`
      <html><head><meta charset="utf-8"><title>Relatório Financeiro</title>
      <style>
        body { font-family: 'Helvetica', sans-serif; padding: 40px; font-size: 12px; }
        h1 { font-size: 18px; text-align: center; margin-bottom: 5px; }
        h2 { font-size: 13px; text-align: center; color: #555; margin-bottom: 30px; font-weight: normal; }
        .cards { display: flex; gap: 15px; margin-bottom: 30px; }
        .card { flex: 1; padding: 15px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
        .card .value { font-size: 20px; font-weight: bold; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #003366; color: white; padding: 8px; text-align: left; font-size: 11px; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        .bar-chart { display: flex; align-items: end; gap: 10px; height: 150px; margin: 20px 0; padding: 10px 0; }
        .bar { flex: 1; background: #003366; position: relative; min-height: 2px; border-radius: 4px 4px 0 0; }
        .bar-label { text-align: center; font-size: 9px; margin-top: 5px; }
        .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: center; }
        .green { color: #16a34a; } .red { color: #dc2626; } .amber { color: #d97706; }
      </style></head><body>
      <h1>Relatório Financeiro Mensal</h1>
      <h2>${String(mes).padStart(2, '0')}/${ano}</h2>
      <div class="cards">
        <div class="card"><div>Previsto</div><div class="value">${formatCurrency(data.totalPrevisto)}</div></div>
        <div class="card"><div class="green">Recebido</div><div class="value green">${formatCurrency(data.totalRecebido)}</div></div>
        <div class="card"><div class="amber">Pendente</div><div class="value amber">${formatCurrency(data.totalPendente)}</div></div>
        <div class="card"><div class="red">Inadimplente</div><div class="value red">${formatCurrency(data.totalInadimplente)}</div></div>
      </div>
      <h3 style="margin-bottom:10px;">Receita por Turma</h3>
      <table>
        <tr><th>Turma</th><th>Alunos</th><th>Previsto</th><th>Recebido</th><th>Pendente</th><th>Inadimplente</th><th>%</th></tr>
        ${data.porTurma.map((t) => `
          <tr><td>${t.turmaCodigo} - ${t.turmaSerie}</td><td>${t.alunos}</td>
          <td>${formatCurrency(t.previsto)}</td><td class="green">${formatCurrency(t.recebido)}</td>
          <td class="amber">${formatCurrency(t.pendente)}</td><td class="red">${formatCurrency(t.inadimplente)}</td>
          <td>${t.percRecebido}%</td></tr>
        `).join('')}
      </table>
      <h3 style="margin-bottom:10px;">Receita Mensal (últimos 6 meses)</h3>
      <div class="bar-chart">
        ${data.receitaMensal.map((r) => `
          <div style="flex:1;text-align:center">
            <div style="font-size:10px;margin-bottom:3px;">${formatCurrency(r.recebido)}</div>
            <div style="background:#003366;height:${Math.max((r.recebido / maxPrev) * 120, 4)}px;width:100%;border-radius:4px 4px 0 0;margin:0 auto;max-width:50px;"></div>
            <div style="font-size:9px;margin-top:5px;color:#999;">${r.label}</div>
          </div>
        `).join('')}
      </div>
      <div class="footer">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
      <script>window.print()</script>
      </body></html>
    `)
    win.document.close()
  }

  const maxBar = data ? Math.max(...data.receitaMensal.map((r) => r.recebido), 1) : 1

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Relatório Financeiro</h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhamento mensal de receitas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1).padStart(2, '0') }))}
            value={String(mes)}
            onChange={(e) => setMes(Number(e.target.value))}
            className="w-20"
          />
          <Select
            options={Array.from({ length: 5 }, (_, i) => ({ value: String(ano - 2 + i), label: String(ano - 2 + i) }))}
            value={String(ano)}
            onChange={(e) => setAno(Number(e.target.value))}
            className="w-24"
          />
          {data && (
            <>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download size={14} className="mr-1" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download size={14} className="mr-1" /> PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-xl bg-stone-200" />)}
          </div>
          <div className="h-64 rounded-xl bg-stone-200" />
        </div>
      ) : data ? (
        <>
          {/* Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign size={20} className="mx-auto mb-1 text-gray-400" />
                <p className="text-xs text-gray-500">Previsto</p>
                <p className="text-lg font-bold text-gray-800">{formatCurrency(data.totalPrevisto)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp size={20} className="mx-auto mb-1 text-green-500" />
                <p className="text-xs text-gray-500">Recebido</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(data.totalRecebido)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock size={20} className="mx-auto mb-1 text-amber-500" />
                <p className="text-xs text-gray-500">Pendente</p>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(data.totalPendente)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertCircle size={20} className="mx-auto mb-1 text-red-500" />
                <p className="text-xs text-gray-500">Inadimplente</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(data.totalInadimplente)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela por Turma */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="text-base font-semibold text-gray-800 mb-3">Receita por Turma</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase text-gray-500">
                      <th className="px-3 py-2">Turma</th>
                      <th className="px-3 py-2">Alunos</th>
                      <th className="px-3 py-2">Previsto</th>
                      <th className="px-3 py-2">Recebido</th>
                      <th className="px-3 py-2">Pendente</th>
                      <th className="px-3 py-2">Inadimplente</th>
                      <th className="px-3 py-2">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.porTurma.map((t) => (
                      <tr key={t.turmaCodigo} className="hover:bg-surface-muted/50">
                        <td className="px-3 py-2 font-medium">{t.turmaCodigo} - {t.turmaSerie}</td>
                        <td className="px-3 py-2">{t.alunos}</td>
                        <td className="px-3 py-2">{formatCurrency(t.previsto)}</td>
                        <td className="px-3 py-2 text-green-600 font-medium">{formatCurrency(t.recebido)}</td>
                        <td className="px-3 py-2 text-amber-600">{formatCurrency(t.pendente)}</td>
                        <td className="px-3 py-2 text-red-600">{formatCurrency(t.inadimplente)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                              <div className="h-full rounded-full bg-green-500" style={{ width: `${t.percRecebido}%` }} />
                            </div>
                            <span className="text-xs">{t.percRecebido}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Barras CSS */}
          <Card>
            <CardContent className="p-4">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Receita Mensal (últimos 6 meses)</h2>
              <div className="flex items-end gap-3 h-48 px-2">
                {data.receitaMensal.map((r) => {
                  const pct = Math.max((r.recebido / maxBar) * 100, 2)
                  return (
                    <div key={r.label} className="flex-1 flex flex-col items-center justify-end h-full">
                      <span className="text-[10px] text-green-700 font-medium mb-1">
                        {formatCurrency(r.recebido)}
                      </span>
                      <div
                        className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-primary-light)] transition-all"
                        style={{ height: `${pct}%` }}
                      />
                      <span className="text-[10px] text-gray-500 mt-1">{r.label}</span>
                    </div>
                  )
                })}
              </div>
              {data.receitaMensal.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">Nenhum dado disponível.</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
