'use client'

import { useEffect, useState } from 'react'
import { getEventosCalendario } from '@/lib/actions/responsavel'
import type { EventoCalendario } from '@/types/entities'

const TIPO_EVENTO: Record<string, { label: string; cor: string; bg: string }> = {
  feriado: { label: 'Feriado', cor: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  prova: { label: 'Prova', cor: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  reuniao: { label: 'Reunião', cor: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  evento: { label: 'Evento', cor: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  recesso: { label: 'Recesso', cor: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function ResponsavelCalendarioPage() {
  const [eventos, setEventos] = useState<EventoCalendario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<'grid' | 'lista'>('grid')

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    getEventosCalendario({ mes, ano }).then((res) => {
      if (res.error) setError(res.error)
      else setEventos(res.data ?? [])
      setIsLoading(false)
    })
  }, [mes, ano])

  function mesAnterior() {
    if (mes === 1) { setMes(12); setAno(ano - 1) }
    else setMes(mes - 1)
  }

  function mesSeguinte() {
    if (mes === 12) { setMes(1); setAno(ano + 1) }
    else setMes(mes + 1)
  }

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
    for (let i = 0; i < inicioSemana; i++) {
      cells.push(<div key={`empty-start-${i}`} className="min-h-[72px] bg-gray-50/50 rounded-lg" />)
    }
    const hoje = new Date()
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const diaEventos = eventosPorDia[dia] ?? []
      const isHoje = dia === hoje.getDate() && mes === hoje.getMonth() + 1 && ano === hoje.getFullYear()
      cells.push(
        <div key={dia} className={`min-h-[72px] rounded-lg border p-1 ${isHoje ? 'border-zab-verde bg-zab-verde-claro' : 'border-gray-200'}`}>
          <span className={`text-xs font-medium ${isHoje ? 'text-zab-verde' : 'text-gray-500'}`}>{dia}</span>
          <div className="space-y-0.5 mt-0.5">
            {diaEventos.slice(0, 2).map((e) => {
              const info = TIPO_EVENTO[e.tipo] ?? { bg: 'bg-gray-100', cor: 'text-gray-700' }
              return (
                <div key={e.id} className={`text-[10px] px-1 py-0.5 rounded truncate ${info.bg} ${info.cor}`}>
                  {e.nome}
                </div>
              )
            })}
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
      <h1 className="text-xl font-bold text-zab-verde mb-6">Calendário Escolar</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Navegação */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={mesAnterior}
          className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg hover:bg-stone-50 text-zab-texto">
          {'<'} Anterior
        </button>
        <span className="text-sm font-semibold text-zab-verde">{MESES[mes - 1]} {ano}</span>
        <button onClick={mesSeguinte}
          className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg hover:bg-stone-50 text-zab-texto">
          Próximo {'>'}
        </button>
      </div>

      {/* View toggle */}
      <div className="flex justify-end mb-3">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'grid' ? 'bg-zab-verde text-white' : 'bg-white text-gray-600'}`}>
            Grade
          </button>
          <button onClick={() => setViewMode('lista')}
            className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'lista' ? 'bg-zab-verde text-white' : 'bg-white text-gray-600'}`}>
            Lista
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse h-72 rounded-xl bg-stone-200" />
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-7 gap-1.5">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
            ))}
            {renderGrid()}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          {eventos.length === 0 ? (
            <div className="rounded-xl bg-white border border-stone-200 p-8 text-center text-sm text-gray-400">
              Nenhum evento neste mês.
            </div>
          ) : (
            eventos.map((e) => {
              const info = TIPO_EVENTO[e.tipo] ?? { label: e.tipo, cor: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' }
              return (
                <div key={e.id} className={`rounded-xl border ${info.bg} p-3`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${info.cor}`}>{info.label}</span>
                    <h3 className="text-sm font-medium text-zab-texto">{e.nome}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(e.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}
                    {e.data_fim && e.data_fim !== e.data_inicio && ` — ${new Date(e.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                  </p>
                  {e.descricao && <p className="text-xs text-gray-600 mt-1">{e.descricao}</p>}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Legenda */}
      <div className="mt-6 flex flex-wrap gap-3">
        {Object.entries(TIPO_EVENTO).map(([key, t]) => (
          <span key={key} className={`text-xs px-2 py-1 rounded ${t.bg} ${t.cor}`}>{t.label}</span>
        ))}
      </div>
    </div>
  )
}
