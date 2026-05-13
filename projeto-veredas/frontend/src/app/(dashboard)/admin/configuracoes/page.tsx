'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getEscolaConfig, salvarEscolaConfig } from '@/lib/actions/escola-config'
import { toast } from 'sonner'
import { Save, Building, Palette, Calendar, GraduationCap, Share2, FileText, Loader2, BookOpen, DollarSign, ShieldCheck, Smartphone, Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react'
import { formatarCNPJ, validarCNPJ, limparCNPJ, buscarCNPJReceitaWS } from '@/lib/utils/cnpj'
import { formatarCEP, limparCEP, buscarCEP } from '@/lib/utils/viacep'
import { listarSeries, criarSerie, excluirSerie, reordenarSerie } from '@/lib/actions/series-escolares'
import type { SerieEscolar } from '@/lib/actions/series-escolares'

const NIVEIS_OPCOES = [
  { value: 'maternal1', label: 'Maternal I' },
  { value: 'maternal2', label: 'Maternal II' },
  { value: 'jardim1', label: 'Jardim I' },
  { value: 'jardim2', label: 'Jardim II' },
  { value: '1ano', label: '1º Ano' },
  { value: '2ano', label: '2º Ano' },
  { value: '3ano', label: '3º Ano' },
  { value: '4ano', label: '4º Ano' },
  { value: '5ano', label: '5º Ano' },
  { value: '6ano', label: '6º Ano' },
  { value: '7ano', label: '7º Ano' },
  { value: '8ano', label: '8º Ano' },
  { value: '9ano', label: '9º Ano' },
]

type TabId = 'identidade' | 'institucional' | 'ano' | 'niveis' | 'estrutura' | 'sociais' | 'textos' | 'pedagogico' | 'financeiro' | 'documentos' | 'portal'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'identidade', label: 'Identidade Visual', icon: <Palette size={16} /> },
  { id: 'institucional', label: 'Dados Institucionais', icon: <Building size={16} /> },
  { id: 'pedagogico', label: 'Pedagógico', icon: <BookOpen size={16} /> },
  { id: 'financeiro', label: 'Financeiro', icon: <DollarSign size={16} /> },
  { id: 'ano', label: 'Ano Letivo', icon: <Calendar size={16} /> },
  { id: 'niveis', label: 'Níveis de Ensino', icon: <GraduationCap size={16} /> },
  { id: 'estrutura', label: 'Estrutura Escolar', icon: <ShieldCheck size={16} /> },
  { id: 'documentos', label: 'Documentos', icon: <FileText size={16} /> },
  { id: 'portal', label: 'Portal', icon: <Smartphone size={16} /> },
  { id: 'sociais', label: 'Redes Sociais', icon: <Share2 size={16} /> },
  { id: 'textos', label: 'Textos', icon: <FileText size={16} /> },
]

export default function AdminConfiguracoes() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('identidade')

  // CNPJ state
  const [cnpj, setCnpj] = useState('')
  const [cnpjError, setCnpjError] = useState<string | null>(null)
  const [cnpjLoading, setCnpjLoading] = useState(false)

  // CEP state
  const [cep, setCep] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)
  const cepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Estrutura Escolar state
  const [series, setSeries] = useState<SerieEscolar[]>([])
  const [novaSerieNome, setNovaSerieNome] = useState('')
  const [novaSerieNivel, setNovaSerieNivel] = useState('infantil')
  const [addingSerie, setAddingSerie] = useState(false)

  useEffect(() => {
    getEscolaConfig().then((res) => {
      if (res.data) {
        setData(res.data)
        setCnpj(formatarCNPJ((res.data?.cnpj as string) ?? ''))
        const end = (res.data?.endereco as Record<string, unknown>) ?? {}
        setCep(formatarCEP((end.cep as string) ?? ''))
      }
      setIsLoading(false)
    })
    listarSeries().then((res) => { if (res.data) setSeries(res.data) })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const form = new FormData(e.currentTarget)
    form.set('cnpj', limparCNPJ(form.get('cnpj') as string))
    form.set('endereco_cep', limparCEP(form.get('endereco_cep') as string))

    const res = await salvarEscolaConfig(form)
    if (res.error) {
      setMessage({ type: 'error', text: res.error })
      toast.error("Erro: " + res.error)
    } else {
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
      toast.success("Configurações salvas com sucesso")
      const fresh = await getEscolaConfig()
      if (fresh.data) setData(fresh.data)
    }
    setSaving(false)
  }

  function handleCnpjChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCnpj(formatarCNPJ(e.target.value.replace(/\D/g, '')))
    setCnpjError(null)
  }

  async function handleCnpjBlur() {
    const cleaned = limparCNPJ(cnpj)
    if (cleaned.length > 0 && cleaned.length !== 14) {
      setCnpjError('CNPJ inválido')
      return
    }
    if (cleaned.length === 14 && !validarCNPJ(cnpj)) {
      setCnpjError('CNPJ inválido')
      return
    }
    setCnpjError(null)

    if (cleaned.length === 14) {
      setCnpjLoading(true)
      const result = await buscarCNPJReceitaWS(cnpj)
      if (result?.nome) {
        const nomeInput = document.querySelector('input[name="nome"]') as HTMLInputElement
        if (nomeInput && !nomeInput.value) {
          nomeInput.value = result.nome
        }
      }
      setCnpjLoading(false)
    }
  }

  function handleCepChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.replace(/\D/g, '')
    const formatted = formatarCEP(cleaned)
    setCep(formatted)
    setCepError(null)

    if (cepTimeoutRef.current) clearTimeout(cepTimeoutRef.current)

    if (cleaned.length === 8) {
      setCepLoading(true)
      cepTimeoutRef.current = setTimeout(async () => {
        const result = await buscarCEP(formatted)
        if (result) {
          const setVal = (name: string, val: string) => {
            const el = document.querySelector(`input[name="${name}"]`) as HTMLInputElement
            if (el) el.value = val
          }
          setVal('endereco_rua', result.logradouro)
          setVal('endereco_bairro', result.bairro)
          setVal('endereco_cidade', result.cidade)
          setVal('endereco_uf', result.uf)
          setCepError(null)
        } else {
          setCepError('CEP não encontrado')
        }
        setCepLoading(false)
      }, 300)
    }
  }

  function getNested(obj: Record<string, unknown> | null, path: string): unknown {
    if (!obj) return undefined
    return path.split('.').reduce((acc: unknown, key) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
      return undefined
    }, obj)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-zab-verde" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-zab-verde">Configurações da Escola</h1>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-stone-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === tab.id
                ? 'border-zab-verde text-zab-verde'
                : 'border-transparent text-zab-texto-claro hover:text-zab-texto'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input type="hidden" name="escola_id" value={data?.id as string} />

        {activeTab === 'identidade' && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Palette size={18} className="text-zab-verde" />
                <h2 className="text-base font-semibold text-zab-texto-escuro">Identidade Visual</h2>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zab-texto">Nome da Escola</label>
                <Input name="nome" defaultValue={data?.nome as string} required />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zab-texto">URL da Logo</label>
                <Input name="logo_url" defaultValue={(getNested(data, 'identidade_visual.logo_url') as string) ?? ''} placeholder="https://..." />
                <p className="mt-1 text-xs text-zab-texto-claro">URL da imagem da logo (pode ser upload para Supabase Storage)</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Cor Primária</label>
                  <div className="flex gap-2">
                    <Input name="cor_primaria" type="color" defaultValue={(getNested(data, 'identidade_visual.cor_primaria') as string) ?? '#1B5E20'} className="w-12 p-1" />
                    <Input name="cor_primaria_hex" defaultValue={(getNested(data, 'identidade_visual.cor_primaria') as string) ?? '#1B5E20'} className="flex-1" placeholder="#1B5E20" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Cor Secundária</label>
                  <div className="flex gap-2">
                    <Input name="cor_secundaria" type="color" defaultValue={(getNested(data, 'identidade_visual.cor_secundaria') as string) ?? '#B8860B'} className="w-12 p-1" />
                    <Input name="cor_secundaria_hex" defaultValue={(getNested(data, 'identidade_visual.cor_secundaria') as string) ?? '#B8860B'} className="flex-1" placeholder="#B8860B" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-lg border" style={{ backgroundColor: (getNested(data, 'identidade_visual.cor_primaria') as string) ?? '#1B5E20' }} />
                <div className="w-16 h-16 rounded-lg border" style={{ backgroundColor: (getNested(data, 'identidade_visual.cor_secundaria') as string) ?? '#B8860B' }} />
                <span className="text-xs text-zab-texto-claro">Prévia das cores</span>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'institucional' && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Building size={18} className="text-zab-verde" />
                <h2 className="text-base font-semibold text-zab-texto-escuro">Dados Institucionais</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">CNPJ</label>
                  <Input name="cnpj"
                    value={cnpj}
                    onChange={handleCnpjChange}
                    onBlur={handleCnpjBlur}
                    error={cnpjError ?? undefined}
                    placeholder="00.000.000/0001-00"
                  />
                  {cnpjLoading && <span className="text-xs text-gray-400">Consultando ReceitaWS...</span>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Telefone</label>
                  <Input name="telefone" defaultValue={(getNested(data, 'contato.telefone') as string) ?? ''} placeholder="(81) 3456-7890" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zab-texto">E-mail de Contato</label>
                <Input name="email_contato" defaultValue={(getNested(data, 'contato.email') as string) ?? ''} placeholder="contato@escola.com.br" type="email" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">CEP</label>
                  <Input name="endereco_cep"
                    value={cep}
                    onChange={handleCepChange}
                    error={cepError ?? undefined}
                    placeholder="53030-000"
                  />
                  {cepLoading && <span className="text-xs text-gray-400">Buscando CEP...</span>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Rua</label>
                  <Input name="endereco_rua" defaultValue={(getNested(data, 'endereco.rua') as string) ?? ''} placeholder="Rua Principal" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Número</label>
                  <Input name="endereco_numero" defaultValue={(getNested(data, 'endereco.numero') as string) ?? ''} placeholder="321" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Bairro</label>
                  <Input name="endereco_bairro" defaultValue={(getNested(data, 'endereco.bairro') as string) ?? ''} placeholder="Centro" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Cidade</label>
                  <Input name="endereco_cidade" defaultValue={(getNested(data, 'endereco.cidade') as string) ?? ''} placeholder="Recife" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">UF</label>
                  <Input name="endereco_uf" defaultValue={(getNested(data, 'endereco.uf') as string) ?? ''} placeholder="PE" maxLength={2} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Nome do Diretor(a)</label>
                  <Input name="diretor_nome" defaultValue={(data?.diretor_nome as string) ?? ''} placeholder="Maria Silva" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Cargo do Diretor(a)</label>
                  <Input name="diretor_cargo" defaultValue={(data?.diretor_cargo as string) ?? ''} placeholder="Diretora Pedagógica" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'ano' && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={18} className="text-zab-verde" />
                <h2 className="text-base font-semibold text-zab-texto-escuro">Ano Letivo</h2>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zab-texto">Ano Letivo Atual</label>
                <Input name="ano_letivo_atual" type="number" defaultValue={data?.ano_letivo_atual as number ?? new Date().getFullYear()} min={2024} max={2030} className="w-32" />
                <p className="mt-1 text-xs text-zab-texto-claro">Usado como padrão ao criar novos registros (matrículas, lançamentos, etc.)</p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'niveis' && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap size={18} className="text-zab-verde" />
                <h2 className="text-base font-semibold text-zab-texto-escuro">Níveis de Ensino</h2>
              </div>
              <p className="text-sm text-zab-texto-claro">Selecione os níveis oferecidos pela escola:</p>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {NIVEIS_OPCOES.map((nivel) => {
                  const selecionados = (data?.niveis_ensino as string[]) ?? []
                  const checked = selecionados.includes(nivel.value)
                  return (
                    <label key={nivel.value} className="flex items-center gap-2 rounded-lg border border-stone-200 p-3 text-sm hover:bg-stone-50 cursor-pointer">
                      <input type="checkbox" name="niveis_ensino" value={nivel.value} defaultChecked={checked} className="rounded border-stone-300" />
                      {nivel.label}
                    </label>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'estrutura' && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={18} className="text-zab-verde" />
                <h2 className="text-base font-semibold text-zab-texto-escuro">Estrutura Escolar</h2>
              </div>
              <p className="text-sm text-zab-texto-claro">
                Gerencie as séries disponíveis na escola. As séries ativas aparecem nos formulários de turma.
              </p>

              {(['infantil', 'fund1', 'fund2', 'medio'] as const).map((nivel) => {
                const seriesNivel = series.filter((s) => s.nivel === nivel && s.ativo)
                if (seriesNivel.length === 0) return null
                return (
                  <div key={nivel}>
                    <h3 className="text-sm font-semibold text-zab-texto mb-2">{({ infantil: 'Educação Infantil', fund1: 'Ensino Fundamental I', fund2: 'Ensino Fundamental II', medio: 'Ensino Médio' } as Record<string, string>)[nivel]}</h3>
                    <div className="space-y-1">
                      {seriesNivel.map((s, idx) => (
                        <div key={s.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm">
                          <span className="text-zab-texto">{s.nome}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                await reordenarSerie(s.id, 'cima')
                                const res = await listarSeries()
                                if (res.data) setSeries(res.data)
                              }}
                              disabled={idx === 0}
                              className="rounded p-1 text-zab-texto-claro hover:bg-stone-100 disabled:opacity-30"
                              title="Subir"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await reordenarSerie(s.id, 'baixo')
                                const res = await listarSeries()
                                if (res.data) setSeries(res.data)
                              }}
                              disabled={idx === seriesNivel.length - 1}
                              className="rounded p-1 text-zab-texto-claro hover:bg-stone-100 disabled:opacity-30"
                              title="Descer"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm(`Desativar "${s.nome}"?`)) return
                                await excluirSerie(s.id)
                                const res = await listarSeries()
                                if (res.data) setSeries(res.data)
                              }}
                              className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                              title="Desativar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              <div className="border-t border-stone-200 pt-4">
                <button
                  type="button"
                  onClick={() => setAddingSerie(!addingSerie)}
                  className="flex items-center gap-1 text-sm text-zab-verde hover:underline"
                >
                  <Plus size={16} /> {addingSerie ? 'Cancelar' : 'Adicionar série'}
                </button>

                {addingSerie && (
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zab-texto">Nome</label>
                      <input
                        value={novaSerieNome}
                        onChange={(e) => setNovaSerieNome(e.target.value)}
                        className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        placeholder="Ex: 4ª Série"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zab-texto">Nível</label>
                      <select
                        value={novaSerieNivel}
                        onChange={(e) => setNovaSerieNivel(e.target.value)}
                        className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                      >
                        <option value="infantil">Educação Infantil</option>
                        <option value="fund1">Ensino Fundamental I</option>
                        <option value="fund2">Ensino Fundamental II</option>
                        <option value="medio">Ensino Médio</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={!novaSerieNome.trim()}
                      onClick={async () => {
                        const fd = new FormData()
                        fd.set('nome', novaSerieNome.trim())
                        fd.set('nivel', novaSerieNivel)
                        fd.set('ordem', String(series.length + 1))
                        const res = await criarSerie(fd)
                        if (res.error) { toast.error(res.error); return }
                        setNovaSerieNome('')
                        setAddingSerie(false)
                        const fresh = await listarSeries()
                        if (fresh.data) setSeries(fresh.data)
                        toast.success('Série adicionada')
                      }}
                      className="rounded-lg bg-zab-verde px-4 py-2 text-sm text-white hover:bg-zab-verde-escuro disabled:opacity-50"
                    >
                      Adicionar
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'pedagogico' && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={18} className="text-zab-verde" />
                <h2 className="text-base font-semibold text-zab-texto-escuro">Configurações Pedagógicas</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Sistema de Avaliação</label>
                  <select name="sistema_avaliacao" defaultValue={(getNested(data, 'config_academica.sistema_avaliacao') as string) ?? 'numerico'}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
                    <option value="numerico">Numérico (0–10)</option>
                    <option value="conceitual">Conceitual (A/B/C/D)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Média Mínima para Aprovação</label>
                  <Input name="media_minima" type="number" step="0.1" min="0" max="10"
                    defaultValue={(getNested(data, 'config_academica.media_minima') as number) ?? 7.0} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Períodos Letivos</label>
                  <select name="num_periodos" defaultValue={(getNested(data, 'config_academica.num_periodos') as number) ?? 4}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
                    <option value="4">Bimestral (4 períodos)</option>
                    <option value="3">Trimestral (3 períodos)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Nome dos Períodos</label>
                  <Input name="nomes_periodos" placeholder="Ex: 1º Bimestre, 2º Bimestre..."
                    defaultValue={(getNested(data, 'config_academica.nomes_periodos') as string) ?? ''} />
                  <p className="mt-1 text-xs text-zab-texto-claro">Separados por vírgula, na ordem</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Tem Recuperação Paralela?</label>
                  <select name="tem_recuperacao_paralela" defaultValue={(getNested(data, 'config_academica.tem_recuperacao_paralela') as boolean) ? 'sim' : 'nao'}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Tem Recuperação Final?</label>
                  <select name="tem_recuperacao_final" defaultValue={(getNested(data, 'config_academica.tem_recuperacao_final') as boolean) ? 'sim' : 'nao'}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Peso da Prova (%)</label>
                  <Input name="peso_prova" type="number" min="0" max="100"
                    defaultValue={(getNested(data, 'config_academica.peso_prova') as number) ?? 60} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Peso do Trabalho (%)</label>
                  <Input name="peso_trabalho" type="number" min="0" max="100"
                    defaultValue={(getNested(data, 'config_academica.peso_trabalho') as number) ?? 40} />
                </div>
              </div>
              <p className="text-xs text-zab-texto-claro">Os pesos devem somar 100%. Usado no cálculo da média.</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'financeiro' && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={18} className="text-zab-verde" />
                <h2 className="text-base font-semibold text-zab-texto-escuro">Configurações Financeiras</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Dia de Vencimento Padrão</label>
                  <Input name="dia_vencimento" type="number" min="1" max="28"
                    defaultValue={(getNested(data, 'config_financeira.dia_vencimento') as number) ?? 10} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Multa por Atraso (%)</label>
                  <Input name="percentual_multa" type="number" step="0.1" min="0" max="100"
                    defaultValue={(getNested(data, 'config_financeira.percentual_multa') as number) ?? 2.0} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Juros ao Dia (%)</label>
                  <Input name="juros_ao_dia" type="number" step="0.001" min="0"
                    defaultValue={(getNested(data, 'config_financeira.juros_ao_dia') as number) ?? 0.033} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Cobra Taxa de Matrícula?</label>
                  <select name="cobra_taxa_matricula" defaultValue={(getNested(data, 'config_financeira.cobra_taxa_matricula') as boolean) ? 'sim' : 'nao'}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Valor da Taxa de Matrícula (R$)</label>
                  <Input name="valor_taxa_matricula" type="number" step="0.01" min="0"
                    defaultValue={(getNested(data, 'config_financeira.valor_taxa_matricula') as number) ?? 0} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Desconto por Pontualidade?</label>
                  <select name="desconto_pontualidade" defaultValue={(getNested(data, 'config_financeira.desconto_pontualidade') as boolean) ? 'sim' : 'nao'}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Percentual de Desconto (%)</label>
                  <Input name="percentual_desconto_pontualidade" type="number" step="0.1" min="0" max="100"
                    defaultValue={(getNested(data, 'config_financeira.percentual_desconto_pontualidade') as number) ?? 0} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'documentos' && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={18} className="text-zab-verde" />
                <h2 className="text-base font-semibold text-zab-texto-escuro">Configurações de Documentos</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Nome de quem assina</label>
                  <Input name="assinante_nome" placeholder="Nome do diretor(a) ou secretário(a)"
                    defaultValue={(getNested(data, 'textos.assinante_nome') as string) ?? ''} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Cargo de quem assina</label>
                  <Input name="assinante_cargo" placeholder="Ex: Diretor(a) Pedagógico(a)"
                    defaultValue={(getNested(data, 'textos.assinante_cargo') as string) ?? ''} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">Cidade (rodapé)</label>
                  <Input name="cidade_rodape" placeholder="Recife"
                    defaultValue={(getNested(data, 'textos.cidade_rodape') as string) ?? ''} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zab-texto">UF (rodapé)</label>
                  <Input name="uf_rodape" placeholder="PE" maxLength={2}
                    defaultValue={(getNested(data, 'textos.uf_rodape') as string) ?? ''} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zab-texto">Texto Padrão — Declaração de Matrícula</label>
                <textarea name="template_declaracao_matricula"
                  defaultValue={(getNested(data, 'textos.template_declaracao_matricula') as string) ?? ''}
                  className="w-full rounded-lg border border-stone-300 p-3 text-sm min-h-[120px] font-mono"
                  placeholder={'Declaro para os devidos fins que {{nome_aluno}} está matriculado(a) na turma {{turma}} no ano letivo {{ano_letivo}}.'}
                />
                <p className="mt-1 text-xs text-zab-texto-claro">Use {'{{nome_aluno}}'}, {'{{turma}}'}, {'{{ano_letivo}}'} como variáveis</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zab-texto">Texto Padrão — Declaração de Frequência</label>
                <textarea name="template_declaracao_frequencia"
                  defaultValue={(getNested(data, 'textos.template_declaracao_frequencia') as string) ?? ''}
                  className="w-full rounded-lg border border-stone-300 p-3 text-sm min-h-[120px] font-mono"
                  placeholder={'Declaro para os devidos fins que {{nome_aluno}} teve {{frequencia}}% de frequência no ano letivo {{ano_letivo}}.'}
                />
                <p className="mt-1 text-xs text-zab-texto-claro">Use {'{{nome_aluno}}'}, {'{{frequencia}}'}, {'{{ano_letivo}}'} como variáveis</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zab-texto">Cláusulas do Contrato de Matrícula</label>
                <textarea name="clausulas_contrato"
                  defaultValue={(getNested(data, 'textos.clausulas_contrato') as string) ?? ''}
                  className="w-full rounded-lg border border-stone-300 p-3 text-sm min-h-[150px] font-mono"
                  placeholder="Cláusula 1 — ..."
                />
                <p className="mt-1 text-xs text-zab-texto-claro">Texto livre que será incluído no contrato de matrícula</p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'portal' && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Smartphone size={18} className="text-zab-verde" />
                <h2 className="text-base font-semibold text-zab-texto-escuro">Portal do Responsável</h2>
              </div>

              <p className="text-sm text-zab-texto">O que o responsável pode <strong>ver</strong>:</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { name: 'pode_ver_notas', label: 'Notas/Boletim' },
                  { name: 'pode_ver_frequencia', label: 'Frequência' },
                  { name: 'pode_ver_financeiro', label: 'Financeiro' },
                  { name: 'pode_ver_agenda', label: 'Agenda' },
                  { name: 'pode_ver_comunicados', label: 'Comunicados' },
                  { name: 'pode_ver_calendario', label: 'Calendário' },
                ].map((item) => (
                  <label key={item.name} className="flex items-center gap-2 rounded-lg border border-stone-200 p-3 text-sm hover:bg-stone-50 cursor-pointer">
                    <input type="checkbox" name={item.name} className="rounded border-stone-300"
                      defaultChecked={(getNested(data, `config_portal.${item.name}`) as boolean) ?? true}
                    />
                    {item.label}
                  </label>
                ))}
              </div>

              <p className="text-sm text-zab-texto mt-4">O que o responsável pode <strong>fazer</strong>:</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { name: 'pode_justificar_falta', label: 'Justificar falta' },
                  { name: 'pode_solicitar_documentos', label: 'Solicitar documentos' },
                  { name: 'pode_responder_agenda', label: 'Responder agenda' },
                ].map((item) => (
                  <label key={item.name} className="flex items-center gap-2 rounded-lg border border-stone-200 p-3 text-sm hover:bg-stone-50 cursor-pointer">
                    <input type="checkbox" name={item.name} className="rounded border-stone-300"
                      defaultChecked={(getNested(data, `config_portal.${item.name}`) as boolean) ?? false}
                    />
                    {item.label}
                  </label>
                ))}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zab-texto">Responsável pode atualizar dados de contato?</label>
                <select name="pode_atualizar_dados" defaultValue={(getNested(data, 'config_portal.pode_atualizar_dados') as boolean) ? 'sim' : 'nao'}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'sociais' && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Share2 size={18} className="text-zab-verde" />
                <h2 className="text-base font-semibold text-zab-texto-escuro">Redes Sociais</h2>
              </div>

              {(() => {
                const redes = (getNested(data, 'contato.redes_sociais') as Array<{ tipo: string; url: string }> | undefined) ?? []
                const getUrl = (tipo: string) => redes.find((r) => r.tipo === tipo)?.url ?? ''
                return (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zab-texto">Instagram</label>
                      <Input name="instagram_url" defaultValue={getUrl('instagram')} placeholder="https://instagram.com/suaescola" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zab-texto">Facebook</label>
                      <Input name="facebook_url" defaultValue={getUrl('facebook')} placeholder="https://facebook.com/suaescola" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zab-texto">WhatsApp</label>
                      <Input name="whatsapp_numero" defaultValue={getUrl('whatsapp')} placeholder="5581999999999" />
                      <p className="mt-1 text-xs text-zab-texto-claro">Número com código do país, apenas dígitos. Ex: 5581999999999</p>
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {activeTab === 'textos' && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={18} className="text-zab-verde" />
                <h2 className="text-base font-semibold text-zab-texto-escuro">Textos</h2>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zab-texto">Mensagem de Boas-Vindas</label>
                <textarea
                  name="mensagem_boasvindas"
                  defaultValue={(getNested(data, 'textos.mensagem_boasvindas') as string) ?? ''}
                  className="w-full rounded-lg border border-stone-300 p-3 text-sm min-h-[100px]"
                  placeholder="Seja bem-vindo(a) à nossa escola!..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zab-texto">Rodapé (PDFs e documentos)</label>
                <textarea
                  name="rodape"
                  defaultValue={(getNested(data, 'textos.rodape') as string) ?? ''}
                  className="w-full rounded-lg border border-stone-300 p-3 text-sm min-h-[60px]"
                  placeholder="© 2026 Escola. Todos os direitos reservados."
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <><Loader2 size={16} className="mr-2 animate-spin" /> Salvando...</>
            ) : (
              <><Save size={16} className="mr-2" /> Salvar Configurações</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
