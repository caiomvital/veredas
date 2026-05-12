'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { listarEventos, criarEvento, excluirEvento } from '@/lib/actions/calendario'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import type { EventoCalendario, EventoTipo } from '@/types/entities'

const TIPO_EVENTO: { value: EventoTipo; label: string; cor: string; bg: string }[] = [
  { value: 'feriado', label: 'Feriado', cor: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  { value: 'prova', label: 'Prova', cor: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  { value: 'reuniao', label: 'Reunião', cor: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  { value: 'evento', label: 'Evento', cor: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  { value: 'recesso', label: 'Recesso', cor: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
]

const TIPO_MAP = Object.fromEntries(TIPO_EVENTO.map((t) => [t.value, t]))
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function CalendarioPage() {
  const { perfil } = useAuth()
  const podeGerenciar = perfil === 'admin' || perfil === 'coordenador'

  const [eventos, setEventos] = useState<EventoCalendario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'lista'>('grid')

  // Form state
  const [fNome, setFNome] = useState('')
  const [fDescricao, setFDescricao] = useState('')
  const [fDataInicio, setFDataInicio] = useState('')
  const [fDataFim, setFDataFim] = useState('')
  const [fTipo, setFTipo] = useState<EventoTipo>('evento')
  const [isSaving, setIsSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const res = await listarEventos({ mes, ano })
    if (res.error) setError(res.error)
    else setEventos(res.data ?? [])
    setIsLoading(false)
  }, [mes, ano])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleCriar() {
    if (!fNome || !fDataInicio || !fTipo) { setError('Preencha nome, data e tipo.'); return }
    setIsSaving(true)
    setError(null)
    const fd = new FormData()
    fd.set('nome', fNome)
    fd.set('descricao', fDescricao)
    fd.set('data_inicio', fDataInicio)
    fd.set('data_fim', fDataFim || fDataInicio)
    fd.set('tipo', fTipo)
    const res = await criarEvento(fd)
    if (res.error) setError(res.error)
    else { setShowForm(false); resetForm(); fetchData() }
    setIsSaving(false)
  }

  async function handleExcluir(id: string) {
    if (!window.confirm('Excluir este evento?')) return
    const res = await excluirEvento(id)
    if (res.error) setError(res.error)
    else fetchData()
  }

  function resetForm() {
    setFNome(''); setFDescricao(''); setFDataInicio(''); setFDataFim(''); setFTipo('evento')
  }

  function mesAnterior() {
    if (mes === 1) { setMes(12); setAno(ano - 1) }
    else setMes(mes - 1)
  }

  function mesSeguinte() {
    if (mes === 12) { setMes(1); setAno(ano + 1) }
    else setMes(mes + 1)
  }

  // --- Grid mensal ---
  function renderGrid() {
    const primeiroDia = new Date(ano, mes - 1, 1)
    const ultimoDia = new Date(ano, mes, 0)
    const diasNoMes = ultimoDia.getDate()
    const inicioSemana = primeiroDia.getDay()
    const eventosPorDia: Record<number, EventoCalendario[]> = {}
    eventos.forEach((e) => {
      const d = new Date(e.data_inicio + 'T00:00:00')
      if (d.getMonth() + 1 === mes && d.getFullYear() === ano) {
        const dia = d.getDate()
        if (!eventosPorDia[dia]) eventosPorDia[dia] = []
        eventosPorDia[dia].push(e)
      }
    })

    const cells: React.ReactNode[] = []
    // Dias vazios antes do primeiro
    for (let i = 0; i < inicioSemana; i++) {
      cells.push(<div key={`empty-start-${i}`} className="min-h-[80px] bg-gray-50/50 rounded-lg" />)
    }
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const diaEventos = eventosPorDia[dia] ?? []
      const hoje = new Date()
      const isHoje = dia === hoje.getDate() && mes === hoje.getMonth() + 1 && ano === hoje.getFullYear()
      cells.push(
        <div key={dia} className={`min-h-[80px] rounded-lg border p-1 ${isHoje ? 'border-[var(--color-primary)] bg-[var(--color-primary-50)]' : 'border-gray-200'}`}>
          <span className={`text-xs font-medium ${isHoje ? 'text-[var(--color-primary)]' : 'text-gray-500'}`}>{dia}</span>
          <div className="space-y-0.5 mt-0.5">
            {diaEventos.slice(0, 2).map((e) => (
              <div key={e.id} className={`text-[10px] px-1 py-0.5 rounded truncate ${TIPO_MAP[e.tipo]?.bg ?? 'bg-gray-100'}`}>
                {e.nome}
              </div>
            ))}
            {diaEventos.length > 2 && (
              <div className="text-[10px] text-gray-400 px-1">+{diaEventos.length - 2} mais</div>
            )}
          </div>
        </div>
      )
    }
    return cells
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Calendário Escolar</h1>
          <p className="text-sm text-gray-500 mt-1">{MESES[mes - 1]} de {ano}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'grid' ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-gray-600'}`}>Grade</button>
            <button onClick={() => setViewMode('lista')} className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'lista' ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-gray-600'}`}>Lista</button>
          </div>
          {podeGerenciar && (
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancelar' : 'Novo Evento'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Form novo evento */}
      {showForm && podeGerenciar && (
        <Card className="mb-6">
          <CardContent className="p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-primary-800)]">Novo Evento</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Nome" value={fNome} onChange={(e) => setFNome(e.target.value)} />
              <Select label="Tipo" options={TIPO_EVENTO.map((t) => ({ value: t.value, label: t.label }))} value={fTipo} onChange={(e) => setFTipo(e.target.value as EventoTipo)} />
              <Input label="Data Início" type="date" value={fDataInicio} onChange={(e) => setFDataInicio(e.target.value)} />
              <Input label="Data Fim (opcional)" type="date" value={fDataFim} onChange={(e) => setFDataFim(e.target.value)} />
            </div>
            <Textarea label="Descrição (opcional)" value={fDescricao} onChange={(e) => setFDescricao(e.target.value)} rows={2} />
            <div className="flex justify-end">
              <Button onClick={handleCriar} isLoading={isSaving}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navegação meses */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={mesAnterior}>{'<'} Anterior</Button>
        <span className="text-sm font-semibold">{MESES[mes - 1]} {ano}</span>
        <Button variant="outline" size="sm" onClick={mesSeguinte}>Próximo {'>'}</Button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2"><div className="h-96 rounded-lg bg-gray-100" /></div>
      ) : viewMode === 'grid' ? (
        <>
          {/* Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
            ))}
            {renderGrid()}
          </div>
        </>
      ) : (
        /* Lista */
        <div className="space-y-2">
          {eventos.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-sm text-gray-400">Nenhum evento neste mês.</CardContent></Card>
          ) : (
            eventos.map((e) => {
              const tipoInfo = TIPO_MAP[e.tipo]
              return (
                <Card key={e.id} className={`${tipoInfo?.bg ?? ''}`}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${tipoInfo?.cor ?? ''}`}>{tipoInfo?.label ?? e.tipo}</span>
                        <h3 className="text-sm font-medium">{e.nome}</h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(e.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}
                        {e.data_fim && e.data_fim !== e.data_inicio && ` — ${new Date(e.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                      </p>
                      {e.descricao && <p className="text-xs text-gray-600 mt-1">{e.descricao}</p>}
                    </div>
                    {podeGerenciar && (
                      <Button variant="ghost" size="sm" onClick={() => handleExcluir(e.id)} className="text-red-500">Excluir</Button>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Legenda */}
      <div className="mt-6 flex flex-wrap gap-3">
        {TIPO_EVENTO.map((t) => (
          <span key={t.value} className={`text-xs px-2 py-1 rounded ${t.bg} ${t.cor}`}>{t.label}</span>
        ))}
      </div>
    </div>
  )
}
