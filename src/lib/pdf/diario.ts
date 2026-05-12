import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface DiarioPDFData {
  schoolName: string
  turmaCodigo: string
  turmaSerie: string
  disciplinaNome: string
  periodoNome: string
  dataGeracao: string
  conteudo: {
    aulas: Array<{
      data_aula: string
      conteudo: string
      observacoes?: string | null
      carga_horaria_minutos: number
    }>
    notas: Array<{
      matricula_id: string
      valor: number
      tipo: string
    }>
    frequencias: Array<{
      matricula_id: string
      data_aula: string
      presenca: boolean
    }>
    planejamentos: Array<{
      semana_inicio: string
      conteudo_planejado: string
      objetivos?: string | null
      metodologia?: string | null
      recursos?: string | null
    }>
  }
  alunosNomes?: Record<string, string>
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'))
    return d.toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

export function gerarDiarioPDF(data: DiarioPDFData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = margin

  // Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(data.schoolName, pageWidth / 2, y, { align: 'center' })
  y += 8

  doc.setFontSize(14)
  doc.text('Diário de Classe', pageWidth / 2, y, { align: 'center' })
  y += 6

  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(`Gerado em: ${data.dataGeracao}`, pageWidth / 2, y, { align: 'center' })
  y += 8

  // Info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Turma: ${data.turmaCodigo} - ${data.turmaSerie}`, margin, y)
  y += 5
  doc.text(`Disciplina: ${data.disciplinaNome}`, margin, y)
  y += 5
  doc.text(`Período: ${data.periodoNome}`, margin, y)
  y += 10

  // ---- Section: Planejamentos ----
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('1. Planejamentos', margin, y)
  y += 6

  if (!data.conteudo.planejamentos || data.conteudo.planejamentos.length === 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text('Nenhum planejamento registrado.', margin, y)
    y += 6
  } else {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    for (const p of data.conteudo.planejamentos) {
      // Check page break
      if (y > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage()
        y = margin
      }
      doc.setFont('helvetica', 'bold')
      doc.text(`Semana: ${formatDate(p.semana_inicio)}`, margin, y)
      y += 4
      doc.setFont('helvetica', 'normal')
      doc.text(`Conteúdo: ${p.conteudo_planejado}`, margin, y)
      y += 4
      if (p.objetivos) {
        doc.text(`Objetivos: ${p.objetivos}`, margin, y)
        y += 4
      }
      if (p.metodologia) {
        doc.text(`Metodologia: ${p.metodologia}`, margin, y)
        y += 4
      }
      y += 3
    }
  }
  y += 3

  // ---- Section: Aulas ----
  if (y > doc.internal.pageSize.getHeight() - 30) {
    doc.addPage()
    y = margin
  }
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('2. Aulas Ministradas', margin, y)
  y += 6

  if (!data.conteudo.aulas || data.conteudo.aulas.length === 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text('Nenhuma aula registrada.', margin, y)
    y += 6
  } else {
    const aulasRows = data.conteudo.aulas.map((a) => [
      formatDate(a.data_aula),
      a.conteudo,
      `${a.carga_horaria_minutos} min`,
    ])
    autoTable(doc, {
      head: [['Data', 'Conteúdo', 'CH']],
      body: aulasRows,
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 51, 102] },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 20, halign: 'center' } },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  // ---- Section: Frequências ----
  if (y > doc.internal.pageSize.getHeight() - 30) {
    doc.addPage()
    y = margin
  }
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('3. Frequências', margin, y)
  y += 6

  if (!data.conteudo.frequencias || data.conteudo.frequencias.length === 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text('Nenhuma frequência registrada.', margin, y)
    y += 6
  } else {
    // Aggregate per student
    const freqMap: Record<string, { total: number; presencas: number; faltas: number }> = {}
    for (const f of data.conteudo.frequencias) {
      if (!freqMap[f.matricula_id]) freqMap[f.matricula_id] = { total: 0, presencas: 0, faltas: 0 }
      freqMap[f.matricula_id].total++
      if (f.presenca) freqMap[f.matricula_id].presencas++
      else freqMap[f.matricula_id].faltas++
    }

    const freqRows = Object.entries(freqMap).map(([matId, stats]) => [
      data.alunosNomes?.[matId] ?? matId.slice(0, 8),
      String(stats.presencas),
      String(stats.faltas),
      `${((stats.presencas / stats.total) * 100).toFixed(0)}%`,
    ])

    autoTable(doc, {
      head: [['Aluno', 'Presenças', 'Faltas', '%']],
      body: freqRows,
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 51, 102] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
      },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  // ---- Section: Notas ----
  if (y > doc.internal.pageSize.getHeight() - 30) {
    doc.addPage()
    y = margin
  }
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('4. Notas', margin, y)
  y += 6

  if (!data.conteudo.notas || data.conteudo.notas.length === 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text('Nenhuma nota registrada.', margin, y)
    y += 6
  } else {
    const tipoLabels: Record<string, string> = {
      prova: 'Prova',
      trabalho: 'Trabalho',
      recuperacao: 'Recuperação',
      media_final: 'Média Final',
    }
    const notasRows = data.conteudo.notas.map((n) => [
      data.alunosNomes?.[n.matricula_id] ?? n.matricula_id.slice(0, 8),
      tipoLabels[n.tipo] ?? n.tipo,
      n.valor.toFixed(1),
    ])

    autoTable(doc, {
      head: [['Aluno', 'Tipo', 'Nota']],
      body: notasRows,
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 51, 102] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 35 },
        2: { cellWidth: 20, halign: 'center' },
      },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  return doc
}
