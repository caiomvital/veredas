'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSchool } from '@/hooks/useSchool'
import { listarAlunos } from '@/lib/actions/alunos'
import {
  listarConfigMensalidades,
  salvarConfigMensalidade,
  excluirConfigMensalidade,
  listarLancamentos,
  criarLancamentoExtra,
  baixarPagamento,
  listarInadimplentes,
} from '@/lib/actions/financeiro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Badge, statusBadge } from '@/components/ui/badge'
import type { ConfigMensalidade, LancamentoFinanceiro, Aluno } from '@/types/entities'

type TabType = 'pendentes' | 'pagos' | 'inadimplentes' | 'extras'

function formatDate(dateStr: string): string {
  try { return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR') } catch { return dateStr }
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function FinanceiroPage() {
  const { config } = useSchool()
  const { perfil } = useAuth()
  const isAdmin = perfil === 'admin'

  // ---- Config state ----
  const [configs, setConfigs] = useState<ConfigMensalidade[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([])
  const [inadimplentes, setInadimplentes] = useState<LancamentoFinanceiro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('pendentes')

  // ---- Config form ----
  const [configSerie, setConfigSerie] = useState('')
  const [configAno, setConfigAno] = useState(new Date().getFullYear().toString())
  const [configValor, setConfigValor] = useState('')
  const [isSavingConfig, setIsSavingConfig] = useState(false)

  // ---- Baixar pagamento modal ----
  const [showBaixarModal, setShowBaixarModal] = useState(false)
  const [selectedLancamento, setSelectedLancamento] = useState<LancamentoFinanceiro | null>(null)
  const [pagamentoData, setPagamentoData] = useState(new Date().toISOString().split('T')[0])
  const [isBaixando, setIsBaixando] = useState(false)
  const [baixarResult, setBaixarResult] = useState<{ multa: number; numeroRecibo: string | null } | null>(null)

  // ---- Extra form ----
  const [extraAlunoId, setExtraAlunoId] = useState('')
  const [extraDescricao, setExtraDescricao] = useState('')
  const [extraValor, setExtraValor] = useState('')
  const [extraVencimento, setExtraVencimento] = useState('')
  const [isSavingExtra, setIsSavingExtra] = useState(false)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const ano = new Date().getFullYear()
    const [configRes, alunosRes] = await Promise.all([
      listarConfigMensalidades(ano),
      listarAlunos({ status: 'ativo' }),
    ])
    if (configRes.error && configRes.error !== 'Erro ao carregar configurações') setError(configRes.error)
    if (alunosRes.error) setError(alunosRes.error)
    setConfigs(configRes.data ?? [])
    setAlunos(alunosRes.data ?? [])
    setIsLoading(false)
  }, [])

  const fetchLancamentos = useCallback(async (tab: TabType) => {
    setError(null)
    if (tab === 'inadimplentes') {
      const res = await listarInadimplentes()
      if (res.error) setError(res.error)
      else setInadimplentes(res.data ?? [])
    } else {
      const status = tab === 'pendentes' ? 'pendente' : tab === 'pagos' ? 'pago' : undefined
      const tipo = tab === 'extras' ? 'extra' : undefined
      const res = await listarLancamentos({ status, tipo })
      if (res.error) setError(res.error)
      else setLancamentos(res.data ?? [])
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => { fetchLancamentos(activeTab) }, [activeTab, fetchLancamentos])

  // ---- Config handlers ----
  async function handleSalvarConfig() {
    if (!configSerie || !configAno || !configValor) { setError('Preencha todos os campos.'); return }
    setIsSavingConfig(true)
    setError(null)
    const fd = new FormData()
    fd.set('serie', configSerie)
    fd.set('ano_letivo', configAno)
    fd.set('valor', configValor)
    const res = await salvarConfigMensalidade(fd)
    if (res.error) setError(res.error)
    else {
      setConfigSerie(''); setConfigValor('')
      const refresh = await listarConfigMensalidades(parseInt(configAno))
      if (!refresh.error) setConfigs(refresh.data ?? [])
    }
    setIsSavingConfig(false)
  }

  async function handleExcluirConfig(id: string) {
    if (!window.confirm('Excluir esta configuração?')) return
    setError(null)
    const res = await excluirConfigMensalidade(id)
    if (res.error) setError(res.error)
    else setConfigs((prev) => prev.filter((c) => c.id !== id))
  }

  // ---- Baixar pagamento ----
  function openBaixarModal(lanc: LancamentoFinanceiro) {
    setSelectedLancamento(lanc)
    setPagamentoData(new Date().toISOString().split('T')[0])
    setShowBaixarModal(true)
    setBaixarResult(null)
    setError(null)
  }

  async function handleBaixarPagamento() {
    if (!selectedLancamento) return
    setIsBaixando(true)
    setError(null)
    setBaixarResult(null)
    const res = await baixarPagamento(selectedLancamento.id, pagamentoData)
    if (res.error) setError(res.error)
    else {
      setBaixarResult(res.data ?? { multa: 0, numeroRecibo: null })
      setTimeout(() => { setShowBaixarModal(false); setBaixarResult(null) }, 2000)
      fetchLancamentos(activeTab)
    }
    setIsBaixando(false)
  }

  // ---- Extra handler ----
  async function handleCriarExtra() {
    if (!extraDescricao || !extraValor || !extraVencimento) { setError('Preencha descrição, valor e vencimento.'); return }
    setIsSavingExtra(true)
    setError(null)
    const fd = new FormData()
    fd.set('aluno_id', extraAlunoId)
    fd.set('descricao', extraDescricao)
    fd.set('valor', extraValor)
    fd.set('data_vencimento', extraVencimento)
    const res = await criarLancamentoExtra(fd)
    if (res.error) setError(res.error)
    else {
      setExtraAlunoId(''); setExtraDescricao(''); setExtraValor(''); setExtraVencimento('')
      if (activeTab === 'extras') fetchLancamentos('extras')
    }
    setIsSavingExtra(false)
  }

  // ---- Modal Overlay ----
  function Modal({ children }: { children: React.ReactNode }) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBaixarModal(false)}>
        <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>{children}</div>
      </div>
    )
  }

  // ---- Columns ----
  const lancColumns: Column<LancamentoFinanceiro>[] = [
    { key: 'descricao', label: 'Descrição', sortable: true },
    {
      key: 'valor', label: 'Valor',
      render: (row) => formatCurrency(row.valor),
    },
    {
      key: 'multa', label: 'Multa',
      render: (row) => row.multa > 0 ? formatCurrency(row.multa) : '—',
    },
    { key: 'data_vencimento', label: 'Vencimento', render: (row) => formatDate(row.data_vencimento) },
    {
      key: 'status', label: 'Status',
      render: (row) => {
        const badge = statusBadge(row.status)
        return <Badge variant={badge.variant}>{badge.label}</Badge>
      },
    },
    ...(activeTab === 'pagos' ? [{
      key: 'data_pagamento' as const, label: 'Data Pagamento',
      render: (row: LancamentoFinanceiro) => row.data_pagamento ? formatDate(row.data_pagamento) : '—',
    }] : []),
  ]

  function getTabData(): LancamentoFinanceiro[] {
    if (activeTab === 'inadimplentes') return inadimplentes
    return lancamentos
  }

  function getTabEmptyMessage(): string {
    switch (activeTab) {
      case 'pendentes': return 'Nenhum lançamento pendente.'
      case 'pagos': return 'Nenhum lançamento pago.'
      case 'inadimplentes': return 'Nenhum aluno inadimplente.'
      case 'extras': return 'Nenhum lançamento extra.'
    }
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'pendentes', label: 'Pendentes' },
    { key: 'pagos', label: 'Pagos' },
    { key: 'inadimplentes', label: 'Inadimplentes' },
    { key: 'extras', label: 'Extras' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Financeiro</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAdmin ? 'Gerencie mensalidades, extras e pagamentos.' : 'Registre pagamentos e gerencie lançamentos.'}
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Config Mensalidades — Admin only */}
      {isAdmin && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="text-base font-semibold text-[var(--color-primary-800)] mb-3">Configuração de Mensalidades</h2>
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <Select
                label="Série"
                options={[
                  { value: '', label: 'Selecione...' },
                  { value: '1 Ano', label: '1º Ano' },
                  { value: '2 Ano', label: '2º Ano' },
                  { value: '3 Ano', label: '3º Ano' },
                  { value: '4 Ano', label: '4º Ano' },
                  { value: '5 Ano', label: '5º Ano' },
                  { value: '6 Ano', label: '6º Ano' },
                  { value: '7 Ano', label: '7º Ano' },
                  { value: '8 Ano', label: '8º Ano' },
                  { value: '9 Ano', label: '9º Ano' },
                ]}
                value={configSerie}
                onChange={(e) => setConfigSerie(e.target.value)}
                className="w-40"
              />
              <Input
                label="Ano"
                type="number"
                value={configAno}
                onChange={(e) => setConfigAno(e.target.value)}
                className="w-28"
              />
              <Input
                label="Valor (R$)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={configValor}
                onChange={(e) => setConfigValor(e.target.value)}
                className="w-36"
              />
              <Button onClick={handleSalvarConfig} isLoading={isSavingConfig} size="sm">
                Salvar
              </Button>
            </div>
            {configs.length > 0 ? (
              <DataTable
                columns={[
                  { key: 'serie', label: 'Série', sortable: true },
                  { key: 'ano_letivo', label: 'Ano', sortable: true },
                  { key: 'valor', label: 'Valor', render: (row: ConfigMensalidade) => formatCurrency(row.valor) },
                ]}
                data={configs}
                keyExtractor={(row) => row.id}
                searchable={false}
                actions={(row) => (
                  <Button variant="ghost" size="sm" onClick={() => handleExcluirConfig(row.id)}>
                    Excluir
                  </Button>
                )}
                emptyMessage="Nenhuma configuração."
              />
            ) : (
              !isLoading && <p className="text-sm text-gray-400">Nenhuma configuração cadastrada para {configAno}.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[var(--color-primary-600)] text-[var(--color-primary-700)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.key === 'inadimplentes' && inadimplentes.length > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-xs font-medium text-red-700">
                  {inadimplentes.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={lancColumns}
            data={getTabData()}
            keyExtractor={(row) => row.id}
            searchable={false}
            isLoading={isLoading}
            emptyMessage={getTabEmptyMessage()}
            actions={(row) =>
              row.status === 'pendente' ? (
                <Button variant="outline" size="sm" onClick={() => openBaixarModal(row)}>
                  Baixar Pagamento
                </Button>
              ) : null
            }
          />
        </CardContent>
      </Card>

      {/* Extra form */}
      {activeTab === 'extras' && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <h2 className="text-base font-semibold text-[var(--color-primary-800)] mb-3">Criar Lançamento Extra</h2>
            <div className="flex flex-wrap items-end gap-3">
              <Select
                label="Aluno (opcional)"
                options={[
                  { value: '', label: 'Nenhum (geral)' },
                  ...alunos.map((a) => ({ value: a.id, label: `${a.nome_completo} (${a.matricula})` })),
                ]}
                value={extraAlunoId}
                onChange={(e) => setExtraAlunoId(e.target.value)}
                className="w-64"
              />
              <Input
                label="Descrição"
                value={extraDescricao}
                onChange={(e) => setExtraDescricao(e.target.value)}
                placeholder="Ex: Almoço, Material..."
                className="w-48"
              />
              <Input
                label="Valor (R$)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={extraValor}
                onChange={(e) => setExtraValor(e.target.value)}
                className="w-32"
              />
              <Input
                label="Vencimento"
                type="date"
                value={extraVencimento}
                onChange={(e) => setExtraVencimento(e.target.value)}
                className="w-40"
              />
              <Button onClick={handleCriarExtra} isLoading={isSavingExtra} size="sm">
                Criar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Baixar Pagamento Modal */}
      {showBaixarModal && selectedLancamento && (
        <Modal>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold">Registrar Pagamento</h2>
              <div className="text-sm space-y-2">
                <p><span className="text-gray-500">Descrição:</span> <strong>{selectedLancamento.descricao}</strong></p>
                <p><span className="text-gray-500">Valor:</span> <strong>{formatCurrency(selectedLancamento.valor)}</strong></p>
                <p><span className="text-gray-500">Vencimento:</span> <strong>{formatDate(selectedLancamento.data_vencimento)}</strong></p>
                {pagamentoData > selectedLancamento.data_vencimento && (
                  <p className="text-amber-600 text-xs">Pagamento após o vencimento — multa de 2% será aplicada.</p>
                )}
              </div>
              <Input
                label="Data do Pagamento"
                type="date"
                value={pagamentoData}
                onChange={(e) => setPagamentoData(e.target.value)}
              />
              {baixarResult !== null && (
                <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 space-y-1">
                  <p className="font-medium">Pagamento registrado!</p>
                  {baixarResult.multa > 0 && <p>Multa de {formatCurrency(baixarResult.multa)} aplicada.</p>}
                  {baixarResult.numeroRecibo && (
                    <p>Recibo: <strong>{baixarResult.numeroRecibo}</strong></p>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setShowBaixarModal(false); setError(null); setBaixarResult(null) }}>
                  Cancelar
                </Button>
                <Button onClick={handleBaixarPagamento} isLoading={isBaixando} disabled={baixarResult !== null}>
                  Confirmar Pagamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </Modal>
      )}
    </div>
  )
}
