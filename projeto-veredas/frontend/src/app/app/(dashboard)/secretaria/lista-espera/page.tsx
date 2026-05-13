'use client'

import { useEffect, useState } from 'react'
import { listarTurmas } from '@/lib/actions/turmas'
import {
  listarCandidatos,
  adicionarCandidato,
  excluirCandidato,
  marcarNotificado,
  type CandidatoListaEspera,
} from '@/lib/actions/lista-espera'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { Plus, Trash2, Phone, MessageCircle, Users, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import type { Turma } from '@/types/entities'

function limparTelefone(tel: string): string {
  return tel.replace(/\D/g, '')
}

export default function ListaEsperaPage() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [selectedTurma, setSelectedTurma] = useState('')
  const [candidatos, setCandidatos] = useState<CandidatoListaEspera[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listarTurmas().then((res) => {
      if (res.data) setTurmas(res.data)
    })
  }, [])

  useEffect(() => {
    if (!selectedTurma) { setCandidatos([]); return }
    setIsLoading(true)
    listarCandidatos(selectedTurma).then((res) => {
      if (res.data) setCandidatos(res.data)
      setIsLoading(false)
    })
  }, [selectedTurma])

  async function handleAdicionar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('turma_id', selectedTurma)
    const res = await adicionarCandidato(formData)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Candidato adicionado!')
      setShowForm(false)
      form.reset()
      const r = await listarCandidatos(selectedTurma)
      if (r.data) setCandidatos(r.data)
    }
  }

  async function handleExcluir(id: string) {
    const res = await excluirCandidato(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Candidato removido')
      setCandidatos((prev) => prev.filter((c) => c.id !== id))
    }
  }

  async function handleNotificar(c: CandidatoListaEspera) {
    const tel = c.telefone ? limparTelefone(c.telefone) : ''
    if (tel) {
      const msg = encodeURIComponent(
        `Olá! Temos uma vaga disponível na turma ${turmas.find(t => t.id === selectedTurma)?.codigo ?? ''}. Se tiver interesse, entre em contato conosco para realizar a matrícula.`
      )
      window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank')
    }
    await marcarNotificado(c.id)
    setCandidatos((prev) => prev.map((c) => c.id === c.id ? { ...c, notificado: true } : c))
  }

  const turmaSelecionada = turmas.find((t) => t.id === selectedTurma)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Lista de Espera</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie candidatos por turma.</p>
        </div>
      </div>

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Seleção de Turma */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select
                label="Turma"
                placeholder="Selecione uma turma..."
                options={turmas.map((t) => ({ value: t.id, label: `${t.codigo} — ${t.serie} (${t.turno})` }))}
                value={selectedTurma}
                onChange={(e) => setSelectedTurma(e.target.value)}
              />
            </div>
            {turmaSelecionada && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Users size={16} />
                Capacidade: {candidatos.length}/{turmaSelecionada.capacidade}
              </div>
            )}
            {selectedTurma && (
              <Button onClick={() => setShowForm(true)}>
                <UserPlus size={16} className="mr-1" /> Adicionar Candidato
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Novo Candidato</h3>
            <form onSubmit={handleAdicionar} className="space-y-4">
              <Input name="candidato_nome" required placeholder="Nome do candidato *" />
              <Input name="responsavel_nome" placeholder="Nome do responsável" />
              <Input name="telefone" placeholder="Telefone (com DDD)" />
              <Input name="data_interesse" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit">Adicionar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-stone-200" />)}
        </div>
      ) : selectedTurma && candidatos.length > 0 ? (
        <div className="space-y-2">
          {candidatos.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800">{c.candidato_nome}</h3>
                  <p className="text-xs text-gray-500">
                    {c.responsavel_nome && `${c.responsavel_nome}`}
                    {c.telefone && ` · ${c.telefone}`}
                    {` · Desde ${new Date(c.data_interesse).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {c.notificado ? (
                    <Badge variant="success">Notificado</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleNotificar(c)}>
                      <MessageCircle size={14} className="mr-1" /> Notificar
                    </Button>
                  )}
                  <button onClick={() => handleExcluir(c.id)} className="text-gray-400 hover:text-red-600 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : selectedTurma ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-gray-400">
            <Users size={40} className="mb-2 text-gray-300" />
            <p className="text-sm">Nenhum candidato na lista de espera.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
