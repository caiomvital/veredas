import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface HistoricoEntryPDF {
  anoLetivo: number
  turmaCodigo: string
  turmaSerie: string
  situacao: string
  observacoes?: string | null
}

export interface HistoricoPDFData {
  schoolName: string
  schoolCnpj?: string
  schoolEndereco?: { rua?: string; numero?: string; bairro?: string; cidade?: string; uf?: string }
  alunoNome: string
  alunoMatricula: string
  alunoDataNascimento: string
  nomeMae?: string
  nomePai?: string
  historicos: HistoricoEntryPDF[]
  dataAtual: string
}

const situacaoLabels: Record<string, string> = {
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  transferido: 'Transferido',
}

export function gerarHistoricoPDF(data: HistoricoPDFData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 25
  let y = margin

  // School letterhead
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(data.schoolName, pageWidth / 2, y, { align: 'center' })
  y += 7

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  if (data.schoolCnpj) {
    doc.text(`CNPJ: ${data.schoolCnpj}`, pageWidth / 2, y, { align: 'center' })
    y += 4
  }
  if (data.schoolEndereco) {
    const addr = data.schoolEndereco
    const enderecoStr = [addr.rua, addr.numero, addr.bairro].filter(Boolean).join(', ')
    const cidadeStr = [addr.cidade, addr.uf].filter(Boolean).join(' - ')
    if (enderecoStr) { doc.text(enderecoStr, pageWidth / 2, y, { align: 'center' }); y += 4 }
    if (cidadeStr) { doc.text(cidadeStr, pageWidth / 2, y, { align: 'center' }); y += 4 }
  }

  // Horizontal line
  y += 3
  doc.setDrawColor(0, 51, 102)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('HISTÓRICO ESCOLAR', pageWidth / 2, y, { align: 'center' })
  y += 12

  // Student info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const infoLines = [
    `Nome: ${data.alunoNome}`,
    `Matrícula: ${data.alunoMatricula}`,
    `Data de Nascimento: ${data.alunoDataNascimento}`,
  ]
  if (data.nomeMae) infoLines.push(`Mãe: ${data.nomeMae}`)
  if (data.nomePai) infoLines.push(`Pai: ${data.nomePai}`)

  for (const line of infoLines) {
    doc.text(line, margin, y)
    y += 5
  }
  y += 4

  // History table
  if (data.historicos.length === 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text('Nenhum registro de histórico encontrado.', margin, y)
    y += 6
  } else {
    const rows = data.historicos.map((h) => [
      String(h.anoLetivo),
      h.turmaCodigo,
      h.turmaSerie,
      situacaoLabels[h.situacao] ?? h.situacao,
      h.observacoes ?? '—',
    ])

    autoTable(doc, {
      head: [['Ano Letivo', 'Turma', 'Série', 'Situação', 'Observações']],
      body: rows,
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 51, 102] },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 'auto' },
      },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
  }

  // Check page break for date/signature
  if (y > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage()
    y = margin
  }

  // Date
  const cidade = data.schoolEndereco?.cidade
  doc.setFontSize(10)
  doc.setFont('helvetica', 'italic')
  doc.text(
    cidade ? `${cidade}, ${data.dataAtual}` : data.dataAtual,
    pageWidth / 2, y,
    { align: 'center' }
  )
  y += 25

  // Signature
  doc.setFont('helvetica', 'normal')
  doc.line(pageWidth / 2 - 30, y, pageWidth / 2 + 30, y)
  y += 5
  doc.setFontSize(9)
  doc.text(data.schoolName, pageWidth / 2, y, { align: 'center' })

  return doc
}
