'use client'

import { useState } from 'react'
import { exportarCensoCSV } from '@/lib/actions/censo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { FileDown, Download, AlertTriangle, Info } from 'lucide-react'

export default function CensoPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [exportedAt, setExportedAt] = useState<string | null>(null)

  async function handleExport() {
    setIsLoading(true)
    const result = await exportarCensoCSV()
    if (result.error) {
      toast.error("Erro ao exportar: " + result.error)
      setIsLoading(false)
      return
    }

    const csv = result.data!
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `educacenso_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setExportedAt(new Date().toLocaleString('pt-BR'))
    toast.success("Arquivo CSV gerado com sucesso")
    setIsLoading(false)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Exportação Educacenso / INEP</h1>
        <p className="mt-1 text-sm text-gray-500">
          Exporte os dados da escola, turmas, alunos e funcionários no formato CSV para importação no Educacenso.
        </p>
      </div>

      {/* Aviso importante */}
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="text-sm text-amber-800 space-y-1">
              <p className="font-semibold">Atenção — Layout do Educacenso</p>
              <p>
                O layout do Educacenso é atualizado anualmente pelo INEP. Este arquivo CSV contém os
                dados do seu sistema organizados em seções (escola, turmas, alunos, funcionários),
                mas <strong>pode não seguir exatamente o formato exigido pelo Educacenso no ano vigente</strong>.
              </p>
              <p>
                Recomenda-se verificar o layout oficial no site do INEP e ajustar as colunas conforme necessário
                antes de realizar a importação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* O que é exportado */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info size={20} className="mt-0.5 shrink-0 text-blue-600" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-gray-800">Dados incluídos na exportação</p>
              <ul className="list-disc pl-5 text-gray-600 space-y-0.5">
                <li><strong>Escola</strong> — INEP, nome, CNPJ, endereço, contato, diretor, ano letivo</li>
                <li><strong>Turmas</strong> — código, série, turno, ano letivo, professor(es) vinculado(s)</li>
                <li><strong>Alunos</strong> — dados cadastrais, endereço, saúde, filiação, turma atual, responsável</li>
                <li><strong>Funcionários</strong> — dados cadastrais, cargo, formação, data de admissão</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ação */}
      <Card>
        <CardContent className="p-6 text-center">
          <FileDown size={48} className="mx-auto mb-4 text-[var(--color-primary-600)]" />
          <h2 className="mb-2 text-lg font-semibold text-gray-800">Gerar arquivo CSV</h2>
          <p className="mb-6 text-sm text-gray-500">
            Clique no botão abaixo para gerar o arquivo CSV com todos os dados cadastrados.
          </p>
          <Button onClick={handleExport} isLoading={isLoading} size="lg">
            <Download size={18} className="mr-2" />
            {isLoading ? 'Exportando...' : 'Exportar CSV'}
          </Button>
          {exportedAt && (
            <p className="mt-3 text-xs text-gray-400">
              Última exportação: {exportedAt}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Links úteis */}
      <div className="mt-6 rounded-lg border p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Links úteis</h3>
        <ul className="space-y-1 text-sm">
          <li>
            <a
              href="https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/censo-escolar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              INEP — Censo Escolar
            </a>
          </li>
          <li>
            <a
              href="https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/censo-escolar/orientacoes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Orientações e manuais do Censo Escolar
            </a>
          </li>
          <li>
            <a
              href="https://www.gov.br/inep/pt-br/servicos/sistemas-educacenso"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Sistema Educacenso
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}
