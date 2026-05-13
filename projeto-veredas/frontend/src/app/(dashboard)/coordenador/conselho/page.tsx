'use client'

import { useEffect, useState } from 'react'
import {
  listarAlunosParaConselho,
  salvarDecisaoConselho,
  salvarDecisoesEmLote,
  type AlunoConselho,
} from '@/lib/actions/conselho'
import { listarTurmas } from '@/lib/actions/turmas'
import { listarPeriodos } from '@/lib/actions/periodos'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, FileText, Save, Download } from 'lucide-react'
import { toast } from 'sonner'
import type { Turma } from '@/types/entities'

const DECISAO_OPTIONS = [
  { value: '', label: 'Selecione...' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'reprovado', label: 'Reprovado' },
  { value: 'retido', label: 'Retido' },
  { value: 'aceleracao', label: 'Aceleração' },
  { value: 'transferido', label: 'Transferido' },
]

const DECISAO_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
  aprovado: 'success',
  reprovado: 'danger',
  retido: 'danger',
  aceleracao: 'info',
  transferido: 'warning',
}

export default function ConselhoPage() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [periodos, setPeriodos] = useState<{ id: string; nome: string }[]>([])
  const [selectedTurma, setSelectedTurma] = useState('')
  const [selectedPeriodo, setSelectedPeriodo] = useState('')
  const [alunos, setAlunos] = useState<AlunoConselho[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      listarTurmas(),
      listarPeriodos(),
    ]).then(([turmasRes, periodosRes]) => {
      if (turmasRes.data) setTurmas(turmasRes.data)
      if (!periodosRes.error) setPeriodos((periodosRes.data ?? []).map((p: any) => ({ id: p.id, nome: p.nome })))
    })
  }, [])

  useEffect(() => {
    if (!selectedTurma || !selectedPeriodo) return
    setIsLoading(true)
    setError(null)
    listarAlunosParaConselho(selectedTurma, selectedPeriodo).then((res) => {
      if (res.error) setError(res.error)
      else setAlunos(res.data ?? [])
      setIsLoading(false)
    })
  }, [selectedTurma, selectedPeriodo])

  async function handleSalvarAluno(alunoId: string) {
    const form = document.getElementById(`form-${alunoId}`) as HTMLFormElement
    if (!form) return
    const decisao = new FormData(form).get('decisao') as string
    const observacoes = new FormData(form).get('observacoes') as string
    if (!decisao) { toast.error('Selecione uma decisão'); return }
    setIsSaving(true)
    const res = await salvarDecisaoConselho(selectedTurma, selectedPeriodo, alunoId, decisao, observacoes)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Decisão salva!')
      setAlunos((prev) => prev.map((a) => a.alunoId === alunoId ? { ...a, decisao, observacoes } : a))
    }
    setIsSaving(false)
  }

  async function handleSalvarTodas() {
    const decisoes = alunos
      .filter((a) => a.decisao)
      .map((a) => ({ alunoId: a.alunoId, decisao: a.decisao!, observacoes: a.observacoes ?? '' }))
    if (decisoes.length === 0) { toast.error('Nenhuma decisão pendente para salvar'); return }
    setIsSaving(true)
    const res = await salvarDecisoesEmLote(selectedTurma, selectedPeriodo, decisoes)
    if (res.error) toast.error(res.error)
    else toast.success(`${res.data?.salvos} decisão(ões) salva(s)!`)
    setIsSaving(false)
  }

  function handleGerarRelatorio() {
    const turma = turmas.find((t) => t.id === selectedTurma)
    const periodo = periodos.find((p) => p.id === selectedPeriodo)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><meta charset="utf-8"><title>Conselho de Classe</title>
      <style>
        body { font-family: 'Helvetica', sans-serif; padding: 40px; font-size: 12px; }
        h1 { font-size: 18px; text-align: center; margin-bottom: 5px; }
        h2 { font-size: 14px; text-align: center; color: #555; margin-bottom: 30px; font-weight: normal; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #003366; color: white; padding: 8px 10px; text-align: left; font-size: 11px; }
        td { padding: 8px 10px; border-bottom: 1px solid #ddd; }
        .aprovado { color: #16a34a; font-weight: bold; }
        .reprovado, .retido { color: #dc2626; font-weight: bold; }
        .info { color: #2563eb; }
        .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: center; }
      </style></head><body>
      <h1>ATA DE CONSELHO DE CLASSE</h1>
      <h2>${turma?.codigo ?? ''} - ${turma?.serie ?? ''} · ${periodo?.nome ?? ''}</h2>
      <table>
        <tr><th>Matrícula</th><th>Aluno</th><th>Média</th><th>Frequência</th><th>Decisão</th><th>Observações</th></tr>
        ${alunos.map((a) => `
          <tr>
            <td>${a.matricula}</td>
            <td>${a.alunoNome}</td>
            <td>${a.mediaAtual.toFixed(1)}</td>
            <td>${a.frequenciaPct}%</td>
            <td class="${a.decisao === 'aprovado' ? 'aprovado' : (a.decisao === 'reprovado' || a.decisao === 'retido') ? 'reprovado' : ''}">
              ${a.decisao ? DECISAO_OPTIONS.find(o => o.value === a.decisao)?.label ?? a.decisao : '—'}
            </td>
            <td>${a.observacoes ?? '—'}</td>
          </tr>
        `).join('')}
      </table>
      <div class="footer">Documento gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')}.</div>
      <script>window.print()</script>
      </body></html>
    `)
    win.document.close()
  }

  const temDecisoes = alunos.some((a) => a.decisao)

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Conselho de Classe</h1>
          <p className="text-sm text-gray-500 mt-1">Registre as decisões do conselho por aluno.</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select
                label="Turma"
                placeholder="Selecione..."
                options={turmas.map((t) => ({ value: t.id, label: `${t.codigo} — ${t.serie}` }))}
                value={selectedTurma}
                onChange={(e) => setSelectedTurma(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select
                label="Período"
                placeholder="Selecione..."
                options={periodos.map((p) => ({ value: p.id, label: p.nome }))}
                value={selectedPeriodo}
                onChange={(e) => setSelectedPeriodo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 rounded-xl bg-stone-200" />)}
        </div>
      ) : alunos.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">
              {alunos.length} aluno(s) · {alunos.filter((a) => a.decisao).length} com decisão
            </p>
            <div className="flex gap-2">
              {temDecisoes && (
                <Button variant="outline" size="sm" onClick={handleSalvarTodas} isLoading={isSaving}>
                  <Save size={16} className="mr-1" /> Salvar Todas
                </Button>
              )}
              {temDecisoes && (
                <Button variant="outline" size="sm" onClick={handleGerarRelatorio}>
                  <Download size={16} className="mr-1" /> Relatório PDF
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {alunos.map((a) => (
              <Card key={a.alunoId}>
                <CardContent className="p-4">
                  <form id={`form-${a.alunoId}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800">{a.alunoNome}</h3>
                        <p className="text-xs text-gray-500">Matrícula: {a.matricula}</p>
                        <div className="flex gap-4 mt-1 text-sm">
                          <span className={a.mediaAtual >= 7 ? 'text-green-600' : 'text-red-600'}>
                            Média: <strong>{a.mediaAtual.toFixed(1)}</strong>
                          </span>
                          <span className={a.frequenciaPct >= 75 ? 'text-green-600' : 'text-red-600'}>
                            Frequência: <strong>{a.frequenciaPct}%</strong>
                          </span>
                        </div>
                      </div>
                      <div className="w-full sm:w-48">
                        <Select
                          name="decisao"
                          value={a.decisao ?? ''}
                          onChange={(e) => {
                            const value = e.target.value
                            if (!value) return
                            setAlunos((prev) => prev.map((al) => al.alunoId === a.alunoId ? { ...al, decisao: value } : al))
                          }}
                          options={DECISAO_OPTIONS}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Textarea
                        name="observacoes"
                        placeholder="Observações..."
                        rows={2}
                        value={a.observacoes ?? ''}
                        onChange={(e) => setAlunos((prev) => prev.map((al) => al.alunoId === a.alunoId ? { ...al, observacoes: e.target.value } : al))}
                      />
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button size="sm" onClick={() => handleSalvarAluno(a.alunoId)} disabled={!a.decisao} isLoading={isSaving}>
                        <CheckCircle size={14} className="mr-1" /> Salvar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : selectedTurma && selectedPeriodo ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-gray-400">
            <CheckCircle size={40} className="mb-2 text-gray-300" />
            <p className="text-sm">Nenhum aluno encontrado para esta turma/período.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
