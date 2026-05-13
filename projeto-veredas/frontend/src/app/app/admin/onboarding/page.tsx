'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { salvarOnboarding } from '@/lib/actions/onboarding'

type Step = 1 | 2 | 3 | 4 | 5

const NIVEIS = [
  { value: 'infantil', label: 'Educação Infantil' },
  { value: 'fund1', label: 'Fundamental I (1º ao 5º)' },
  { value: 'fund2', label: 'Fundamental II (6º ao 9º)' },
  { value: 'medio', label: 'Ensino Médio' },
]

const STEP_LABELS = ['Identidade', 'Instituição', 'Estrutura', 'Pedagógico', 'Financeiro']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busyCep, setBusyCep] = useState(false)

  // Step 1 — Identidade
  const [nome, setNome] = useState('')
  const [slogan, setSlogan] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [corPrimaria, setCorPrimaria] = useState('#2d6a4f')
  const [corSecundaria, setCorSecundaria] = useState('#1a2e4a')

  // Step 2 — Dados institucionais
  const [cep, setCep] = useState('')
  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [emailContato, setEmailContato] = useState('')
  const [diretorNome, setDiretorNome] = useState('')
  const [diretorCargo, setDiretorCargo] = useState('')

  // Step 3 — Estrutura
  const [niveisSelecionados, setNiveisSelecionados] = useState<string[]>([])
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear().toString())

  // Step 4 — Pedagógico
  const [sistemaAvaliacao, setSistemaAvaliacao] = useState('numerico')
  const [mediaMinima, setMediaMinima] = useState('7.0')
  const [numPeriodos, setNumPeriodos] = useState('4')
  const [temRecuperacao, setTemRecuperacao] = useState('sim')

  // Step 5 — Financeiro
  const [diaVencimento, setDiaVencimento] = useState('10')
  const [percentualMulta, setPercentualMulta] = useState('2.0')

  // ── ViaCEP ──
  const buscarCep = useCallback(async () => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return
    setBusyCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setRua(data.logradouro ?? '')
        setBairro(data.bairro ?? '')
        setCidade(data.localidade ?? '')
        setUf(data.uf ?? '')
      }
    } catch { /* ignore */ }
    setBusyCep(false)
  }, [cep])

  // ── Navegação ──
  const canAdvance = (): boolean => {
    switch (step) {
      case 1: return nome.trim().length > 0
      case 2: return telefone.trim().length > 0
      case 3: return niveisSelecionados.length > 0 && anoLetivo.trim().length > 0
      case 4: return true
      case 5: return diaVencimento.trim().length > 0
      default: return false
    }
  }

  const nextStep = () => {
    if (step < 5 && canAdvance()) setStep((step + 1) as Step)
  }
  const prevStep = () => {
    if (step > 1) setStep((step - 1) as Step)
  }

  const toggleNivel = (nivel: string) => {
    setNiveisSelecionados((prev) =>
      prev.includes(nivel) ? prev.filter((n) => n !== nivel) : [...prev, nivel]
    )
  }

  // ── Submit ──
  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const fd = new FormData()
    fd.set('nome', nome)
    fd.set('slogan', slogan)
    fd.set('cnpj', cnpj)
    fd.set('cor_primaria', corPrimaria)
    fd.set('cor_secundaria', corSecundaria)
    fd.set('cep', cep)
    fd.set('endereco_cep', cep)
    fd.set('endereco_rua', rua)
    fd.set('endereco_numero', numero)
    fd.set('endereco_bairro', bairro)
    fd.set('endereco_cidade', cidade)
    fd.set('endereco_uf', uf)
    fd.set('telefone', telefone)
    fd.set('email_contato', emailContato)
    fd.set('diretor_nome', diretorNome)
    fd.set('diretor_cargo', diretorCargo)
    fd.set('ano_letivo_atual', anoLetivo)
    for (const n of niveisSelecionados) fd.append('niveis_ensino', n)
    fd.set('sistema_avaliacao', sistemaAvaliacao)
    fd.set('media_minima', mediaMinima)
    fd.set('num_periodos', numPeriodos)
    fd.set('tem_recuperacao', temRecuperacao)
    fd.set('dia_vencimento', diaVencimento)
    fd.set('percentual_multa', percentualMulta)

    const result = await salvarOnboarding(fd)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/app/admin?onboarding=ok')
    }
  }

  // ── Render ──
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEP_LABELS.map((label, i) => {
              const s = (i + 1) as Step
              const active = s === step
              const done = s < step
              return (
                <div key={label} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      active ? 'text-white' : done ? 'text-white' : 'text-gray-400 bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: active || done ? '#2d6a4f' : undefined,
                    }}
                  >
                    {done ? '✓' : s}
                  </div>
                  <span className={`text-[10px] mt-1 hidden sm:block ${active ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="relative mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
              style={{ width: `${((step - 1) / 4) * 100}%`, backgroundColor: '#2d6a4f' }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* STEP 1: Identidade */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Identidade da Escola</h2>
              <p className="text-sm text-gray-500">Como sua escola será conhecida no sistema.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Escola *</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Escola Exemplo"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slogan</label>
                <input type="text" value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Educação que transforma"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Primária</label>
                  <input type="color" value={corPrimaria} onChange={(e) => setCorPrimaria(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Secundária</label>
                  <input type="color" value={corSecundaria} onChange={(e) => setCorSecundaria(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Dados institucionais */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Dados Institucionais</h2>
              <p className="text-sm text-gray-500">Informações de contato e endereço da escola.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <div className="flex gap-2">
                  <input type="text" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" maxLength={9}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
                  <button type="button" onClick={buscarCep} disabled={busyCep}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: '#2d6a4f' }}>
                    {busyCep ? '...' : 'Buscar'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
                  <input type="text" value={rua} onChange={(e) => setRua(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                  <input type="text" value={uf} onChange={(e) => setUf(e.target.value)} maxLength={2} placeholder="PE"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                  <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(81) 3000-0000"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input type="email" value={emailContato} onChange={(e) => setEmailContato(e.target.value)} placeholder="contato@escola.com.br"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diretor(a)</label>
                  <input type="text" value={diretorNome} onChange={(e) => setDiretorNome(e.target.value)} placeholder="Nome do diretor"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                  <input type="text" value={diretorCargo} onChange={(e) => setDiretorCargo(e.target.value)} placeholder="Diretor(a) Geral"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Estrutura escolar */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Estrutura Escolar</h2>
              <p className="text-sm text-gray-500">Selecione os níveis de ensino oferecidos pela escola.</p>

              <div className="space-y-3">
                {NIVEIS.map((n) => (
                  <label key={n.value} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="checkbox" checked={niveisSelecionados.includes(n.value)} onChange={() => toggleNivel(n.value)}
                      className="h-4 w-4 rounded border-gray-300 accent-[#2d6a4f]" />
                    <span className="text-sm font-medium text-gray-900">{n.label}</span>
                  </label>
                ))}
              </div>

              {niveisSelecionados.length > 0 && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                  Séries padrão serão criadas automaticamente para os níveis selecionados.
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ano Letivo Atual *</label>
                <input type="number" value={anoLetivo} onChange={(e) => setAnoLetivo(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
              </div>
            </div>
          )}

          {/* STEP 4: Pedagógico */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Configurações Pedagógicas</h2>
              <p className="text-sm text-gray-500">Defina o sistema de avaliação da escola.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sistema de Avaliação</label>
                <select value={sistemaAvaliacao} onChange={(e) => setSistemaAvaliacao(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20">
                  <option value="numerico">Numérico (0–10)</option>
                  <option value="conceitual">Conceitual (A–D)</option>
                </select>
              </div>

              {sistemaAvaliacao === 'numerico' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Média Mínima para Aprovação</label>
                  <input type="number" step="0.1" min="0" max="10" value={mediaMinima} onChange={(e) => setMediaMinima(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Períodos Letivos</label>
                <select value={numPeriodos} onChange={(e) => setNumPeriodos(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20">
                  <option value="4">Bimestral (4 períodos)</option>
                  <option value="3">Trimestral (3 períodos)</option>
                  <option value="2">Semestral (2 períodos)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recuperação?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="tem_recuperacao" checked={temRecuperacao === 'sim'} onChange={() => setTemRecuperacao('sim')}
                      className="accent-[#2d6a4f]" />
                    <span className="text-sm text-gray-700">Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="tem_recuperacao" checked={temRecuperacao === 'nao'} onChange={() => setTemRecuperacao('nao')}
                      className="accent-[#2d6a4f]" />
                    <span className="text-sm text-gray-700">Não</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Financeiro */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Configurações Financeiras</h2>
              <p className="text-sm text-gray-500">Defina as configurações básicas de cobrança.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dia de Vencimento Padrão</label>
                <input type="number" min="1" max="28" value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
                <p className="text-xs text-gray-400 mt-1">Dia do mês para vencimento das mensalidades (1–28)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Multa por Atraso (%)</label>
                <input type="number" step="0.1" min="0" max="100" value={percentualMulta} onChange={(e) => setPercentualMulta(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20" />
              </div>

              {/* Resumo */}
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-5 mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Resumo da Configuração</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-gray-500">Escola:</dt><dd className="font-medium text-gray-900">{nome || '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Níveis:</dt><dd className="font-medium text-gray-900">{niveisSelecionados.length} selecionado(s)</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Avaliação:</dt><dd className="font-medium text-gray-900">{sistemaAvaliacao === 'numerico' ? 'Numérico' : 'Conceitual'}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Períodos:</dt><dd className="font-medium text-gray-900">{numPeriodos}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Vencimento:</dt><dd className="font-medium text-gray-900">Dia {diaVencimento}</dd></div>
                </dl>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button onClick={prevStep} disabled={step === 1}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              Voltar
            </button>

            {step < 5 ? (
              <button onClick={nextStep} disabled={!canAdvance()}
                className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ backgroundColor: '#2d6a4f' }}>
                Avançar
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ backgroundColor: '#2d6a4f' }}>
                {loading ? 'Salvando...' : 'Confirmar e Finalizar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
