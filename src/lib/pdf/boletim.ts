import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface BoletimAlunoPDF {
  nome: string
  notas: { prova?: number; trabalho?: number; recuperacao?: number }
  frequencia: { totalAulas: number; presencas: number; percentual: number }
}

export interface BoletimPDFData {
  schoolName: string
  tituloBoletim?: string
  rodapeBoletim?: string
  turmaCodigo: string
  turmaSerie: string
  disciplinaNome: string
  periodoNome: string
  alunos: BoletimAlunoPDF[]
}

export function gerarBoletimPDF(data: BoletimPDFData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = margin

  // School header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(data.schoolName, pageWidth / 2, y, { align: 'center' })
  y += 10

  // Title
  doc.setFontSize(14)
  doc.text(data.tituloBoletim ?? 'Boletim Escolar', pageWidth / 2, y, { align: 'center' })
  y += 8

  // Turma info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Turma: ${data.turmaCodigo} - ${data.turmaSerie}`, margin, y)
  y += 5
  doc.text(`Disciplina: ${data.disciplinaNome}`, margin, y)
  y += 5
  doc.text(`Período: ${data.periodoNome}`, margin, y)
  y += 10

  for (const aluno of data.alunos) {
    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage()
      y = margin
    }

    // Student name header
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(aluno.nome, margin, y)
    y += 2

    // Grades table
    const notas = [
      ['Prova', aluno.notas.prova !== undefined ? aluno.notas.prova.toFixed(1) : '---'],
      ['Trabalho', aluno.notas.trabalho !== undefined ? aluno.notas.trabalho.toFixed(1) : '---'],
      ['Recuperação', aluno.notas.recuperacao !== undefined ? aluno.notas.recuperacao.toFixed(1) : '---'],
    ]

    autoTable(doc, {
      head: [['Avaliação', 'Nota']],
      body: notas,
      startY: y + 2,
      margin: { left: margin, right: margin },
      tableWidth: 100,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [0, 51, 102] },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 40, halign: 'center' } },
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

    // Attendance line
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const freq = aluno.frequencia
    doc.text(
      `Frequência: ${freq.totalAulas} aula(s), ${freq.presencas} presença(s) (${freq.percentual.toFixed(0)}%)`,
      margin, y
    )
    y += 8
  }

  // Footer
  if (data.rodapeBoletim) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    const footerY = doc.internal.pageSize.getHeight() - 10
    doc.text(data.rodapeBoletim, pageWidth / 2, footerY, { align: 'center' })
  }

  return doc
}
