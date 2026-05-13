'use client'

import { useEffect, useState, useCallback } from 'react'
import { listarDisciplinas, criarDisciplina, excluirDisciplina } from '@/lib/actions/turmas'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Disciplina } from '@/types/entities'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

const AREA_LABELS: Record<string, string> = {
  Linguagens: 'Linguagens',
  Matematica: 'Matemática',
  Ciencias: 'Ciências da Natureza',
  Humanas: 'Ciências Humanas',
}

const columns: Column<Disciplina>[] = [
  { key: 'nome', label: 'Disciplina', sortable: true },
  { key: 'codigo', label: 'Código' },
  {
    key: 'area_conhecimento', label: 'Área',
    render: (row) => <Badge>{AREA_LABELS[row.area_conhecimento] ?? row.area_conhecimento}</Badge>,
  },
]

export default function DisciplinasPage() {
  const [data, setData] = useState<Disciplina[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await listarDisciplinas()
    if (result.error) setError(result.error)
    else setData(result.data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleCreate(formData: FormData) {
    setIsSaving(true)
    setFormError(null)
    const result = await criarDisciplina(formData)
    if (result.error) {
      setFormError(result.error)
      toast.error("Erro: " + result.error)
      setIsSaving(false)
    } else {
      toast.success("Disciplina criada com sucesso")
      setShowForm(false)
      fetchData()
    }
  }

  function handleDelete(id: string) {
    setSelectedId(id)
    setShowConfirm(true)
  }

  async function confirmDelete() {
    if (!selectedId) return
    setIsDeleting(true)
    const result = await excluirDisciplina(selectedId)
    setIsDeleting(false)
    setShowConfirm(false)
    setSelectedId(null)
    if (result.error) {
      setError(result.error)
      toast.error("Erro: " + result.error)
    } else {
      toast.success("Disciplina excluída com sucesso")
      fetchData()
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Disciplinas</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> {showForm ? 'Fechar' : 'Nova Disciplina'}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--color-primary-800)]">Nova Disciplina</h2>
            <form action={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Input id="nome" name="nome" label="Nome" required placeholder="Matemática" />
                <Input id="codigo" name="codigo" label="Código" required placeholder="MAT" />
                <Select id="area_conhecimento" name="area_conhecimento" label="Área" required
                  options={[
                    { value: 'Linguagens', label: 'Linguagens' },
                    { value: 'Matematica', label: 'Matemática' },
                    { value: 'Ciencias', label: 'Ciências da Natureza' },
                    { value: 'Humanas', label: 'Ciências Humanas' },
                  ]}
                  placeholder="Selecione"
                />
              </div>
              {formError && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{formError}</div>}
              <div className="flex justify-end">
                <Button type="submit" isLoading={isSaving}>Salvar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Buscar disciplina..."
        searchKeys={['nome', 'codigo']}
        isLoading={isLoading}
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
              <Trash2 size={16} className="text-red-500" />
            </Button>
          </div>
        )}
      />
      <ConfirmDialog
        open={showConfirm}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir esta disciplina? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => { setShowConfirm(false); setSelectedId(null); }}
      />
    </div>
  )
}