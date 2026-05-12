'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getEscolaConfig, salvarEscolaConfig } from '@/lib/actions/escola-config'
import { Save, Building, Palette, Calendar, GraduationCap, Share2, FileText, Loader2 } from 'lucide-react'

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

type TabId = 'identidade' | 'institucional' | 'ano' | 'niveis' | 'sociais' | 'textos'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'identidade', label: 'Identidade Visual', icon: <Palette size={16} /> },
  { id: 'institucional', label: 'Dados Institucionais', icon: <Building size={16} /> },
  { id: 'ano', label: 'Ano Letivo', icon: <Calendar size={16} /> },
  { id: 'niveis', label: 'Níveis de Ensino', icon: <GraduationCap size={16} /> },
  { id: 'sociais', label: 'Redes Sociais', icon: <Share2 size={16} /> },
  { id: 'textos', label: 'Textos', icon: <FileText size={16} /> },
]

export default function AdminConfiguracoes() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('identidade')

  useEffect(() => {
    getEscolaConfig().then((res) => {
      if (res.data) setData(res.data)
      setIsLoading(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const form = new FormData(e.currentTarget)
    const res = await salvarEscolaConfig(form)
    if (res.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
      // Recarregar dados
      const fresh = await getEscolaConfig()
      if (fresh.data) setData(fresh.data)
    }
    setSaving(false)
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

      {/* Tabs */}
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

        {/* Identidade Visual */}
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

        {/* Dados Institucionais */}
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
                  <Input name="cnpj" defaultValue={data?.cnpj as string} placeholder="00.000.000/0001-00" />
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
                  <Input name="endereco_cep" defaultValue={(getNested(data, 'endereco.cep') as string) ?? ''} placeholder="53030-000" />
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

        {/* Ano Letivo */}
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

        {/* Níveis de Ensino */}
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

        {/* Redes Sociais */}
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

        {/* Textos */}
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
