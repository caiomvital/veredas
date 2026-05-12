'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarComunicado } from '@/lib/actions/comunicados'
import { gerarAvisosComunicado } from '@/lib/actions/avisos-whatsapp'
import { listarTurmas } from '@/lib/actions/turmas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import type { Turma } from '@/types/entities'

type DestinatarioItem = { tipo: string; turma_id?: string; perfil?: string }

const PERFIS_OPCOES = [
  { value: 'admin', label: 'Administradores' },
  { value: 'coordenador', label: 'Coordenadores' },
  { value: 'secretaria', label: 'Secretaria' },
  { value: 'professor', label: 'Professores' },
]

export default function NovoComunicadoPage() {
  const router = useRouter()
  const [titulo, setTitulo] = useState('')
  const [corpo, setCorpo] = useState('')
  const [dataPublicacao, setDataPublicacao] = useState(new Date().toISOString().split('T')[0])
  const [destinatarios, setDestinatarios] = useState<DestinatarioItem[]>([{ tipo: 'toda_escola' }])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notificarWhatsApp, setNotificarWhatsApp] = useState(false)

  useEffect(() => {
    listarTurmas({}).then((res) => {
      if (!res.error) setTurmas(res.data ?? [])
    })
  }, [])

  function addDestinatario() {
    setDestinatarios([...destinatarios, { tipo: 'perfil', perfil: 'professor' }])
  }

  function updateDestinatario(idx: number, field: string, value: string) {
    const updated = [...destinatarios]
    updated[idx] = { ...updated[idx], [field]: value }
    if (field === 'tipo') {
      updated[idx].turma_id = undefined
      updated[idx].perfil = undefined
    }
    setDestinatarios(updated)
  }

  function removeDestinatario(idx: number) {
    setDestinatarios(destinatarios.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    if (!titulo || !corpo) { setError('Preencha título e corpo.'); return }
    setIsSaving(true)
    setError(null)
    const fd = new FormData()
    fd.set('titulo', titulo)
    fd.set('corpo', corpo)
    fd.set('data_publicacao', dataPublicacao)
    fd.set('destinatarios', JSON.stringify(destinatarios))
    const res = await criarComunicado(fd)
    if (res.error) { setError(res.error); setIsSaving(false); return }

    // Notificar responsáveis por WhatsApp se marcado
    if (notificarWhatsApp && res.data?.id) {
      // Extrair IDs das turmas selecionadas
      const turmaIds = destinatarios
        .filter((d) => d.tipo === 'turma' && d.turma_id)
        .map((d) => d.turma_id!)
      const turmasEspecificas = turmaIds.length > 0 ? turmaIds : undefined
      await gerarAvisosComunicado(res.data.id, titulo, turmasEspecificas)
    }

    router.push('/comunicados')
    setIsSaving(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Novo Comunicado</h1>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <Input label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título do comunicado" />
          <Textarea label="Corpo" value={corpo} onChange={(e) => setCorpo(e.target.value)} placeholder="Escreva o comunicado..." rows={6} />
          <Input label="Data de Publicação" type="date" value={dataPublicacao} onChange={(e) => setDataPublicacao(e.target.value)} />

          {/* Destinatários */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Destinatários</label>
            <div className="space-y-2">
              {destinatarios.map((d, idx) => (
                <div key={idx} className="flex items-end gap-2">
                  <Select
                    options={[
                      { value: 'toda_escola', label: 'Toda a Escola' },
                      { value: 'perfil', label: 'Perfil específico' },
                      { value: 'turma', label: 'Turma específica' },
                    ]}
                    value={d.tipo}
                    onChange={(e) => updateDestinatario(idx, 'tipo', e.target.value)}
                    className="flex-1"
                  />
                  {d.tipo === 'perfil' && (
                    <Select
                      options={PERFIS_OPCOES}
                      value={d.perfil ?? 'professor'}
                      onChange={(e) => updateDestinatario(idx, 'perfil', e.target.value)}
                      className="flex-1"
                    />
                  )}
                  {d.tipo === 'turma' && (
                    <Select
                      options={turmas.map((t) => ({ value: t.id, label: `${t.codigo} - ${t.serie} (${t.turno})` }))}
                      value={d.turma_id ?? ''}
                      onChange={(e) => updateDestinatario(idx, 'turma_id', e.target.value)}
                      className="flex-1"
                    />
                  )}
                  <Button variant="ghost" size="sm" onClick={() => removeDestinatario(idx)}>
                    Remover
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-2" onClick={addDestinatario}>
              + Adicionar destinatário
            </Button>
          </div>

          {/* Notificar responsáveis */}
          <label className="flex items-center gap-2 rounded-lg border border-stone-200 p-3 cursor-pointer hover:bg-stone-50">
            <input type="checkbox" checked={notificarWhatsApp} onChange={(e) => setNotificarWhatsApp(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-green-600 focus:ring-green-500" />
            <div>
              <span className="text-sm font-medium text-stone-700">Notificar responsáveis por WhatsApp</span>
              <p className="text-xs text-gray-400">Gera avisos pendentes na seção de WhatsApp para os responsáveis dos alunos.</p>
            </div>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
            <Button onClick={handleSubmit} isLoading={isSaving}>Publicar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
