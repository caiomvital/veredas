'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Download, Database } from 'lucide-react'
import {
  exportarAlunosCSV,
  exportarFinanceiroCSV,
  exportarNotasCSV,
  exportarFrequenciaCSV,
  exportarFuncionariosCSV,
  exportarBackupJSON,
} from '@/lib/actions/exportacao'

interface ExportItem {
  id: string
  titulo: string
  descricao: string
  filename: string
  action: () => Promise<{ data: string | null; error: string | null }>
}

const EXPORTS: ExportItem[] = [
  {
    id: 'alunos',
    titulo: 'Alunos',
    descricao: 'Nome, CPF, data de nascimento, turma, responsável, telefone e status.',
    filename: 'alunos',
    action: exportarAlunosCSV,
  },
  {
    id: 'financeiro',
    titulo: 'Financeiro',
    descricao: 'Aluno, mês, ano, valor, status, data de pagamento e descrição dos lançamentos.',
    filename: 'financeiro',
    action: exportarFinanceiroCSV,
  },
  {
    id: 'notas',
    titulo: 'Notas',
    descricao: 'Aluno, turma, disciplina, período, tipo e valor das notas (últimas 5.000).',
    filename: 'notas',
    action: exportarNotasCSV,
  },
  {
    id: 'frequencia',
    titulo: 'Frequência',
    descricao: 'Aluno, turma, disciplina, total de aulas, presenças, faltas e percentual agregado.',
    filename: 'frequencia',
    action: exportarFrequenciaCSV,
  },
  {
    id: 'funcionarios',
    titulo: 'Funcionários',
    descricao: 'Nome, CPF, cargo, e-mail, telefone, formação, data de admissão e status.',
    filename: 'funcionarios',
    action: exportarFuncionariosCSV,
  },
  {
    id: 'backup',
    titulo: 'Backup Completo (JSON)',
    descricao: 'Todas as tabelas do sistema em um único arquivo JSON para importação posterior.',
    filename: 'backup',
    action: exportarBackupJSON,
  },
]

function hoje() {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${yyyy}_${mm}_${dd}`
}

function triggerDownload(content: string, filename: string, ext: string) {
  const mime = ext === 'json' ? 'application/json' : 'text/csv;charset=utf-8;'
  const blob = new Blob(['﻿' + content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${hoje()}.${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function AdminExportacaoPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleExport(item: ExportItem) {
    setLoading(item.id)
    setError(null)
    try {
      const result = await item.action()
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        const ext = item.id === 'backup' ? 'json' : 'csv'
        triggerDownload(result.data, item.filename, ext)
      }
    } catch {
      setError('Erro ao exportar. Tente novamente.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-primary-800)]">Exportação de Dados</h1>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPORTS.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-zab-verde/10 p-2 text-zab-verde">
                  {item.id === 'backup' ? <Database size={20} /> : <Download size={20} />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{item.titulo}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.descricao}</p>
                </div>
              </div>
              <button
                onClick={() => handleExport(item)}
                disabled={loading === item.id}
                className="flex items-center justify-center gap-2 rounded-lg bg-zab-verde px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zab-verde/90 disabled:opacity-60"
              >
                {loading === item.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                {loading === item.id ? 'Exportando...' : 'Download'}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">
        Os arquivos CSV utilizam ponto e vírgula (;) como separador e codificação UTF-8 com BOM.
      </p>
    </div>
  )
}
