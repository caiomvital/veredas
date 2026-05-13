import jsPDF from 'jspdf'

export interface DeclaracaoFrequenciaPDFData {
  schoolName: string
  schoolCnpj?: string
  schoolEndereco?: { rua?: string; numero?: string; bairro?: string; cidade?: string; uf?: string }
  templateDeclaracao?: string
  alunoNome: string
  alunoMatricula: string
  turmaCodigo: string
  turmaSerie: string
  turmaTurno: string
  anoLetivo: number
  periodoNome: string
  totalAulas: number
  totalPresencas: number
  totalFaltas: number
  frequenciaPct: number
  dataAtual: string
  diretorNome?: string
  diretorCargo?: string
}

function replaceTemplateVars(text: string, data: DeclaracaoFrequenciaPDFData): string {
  return text
    .replace(/\{\{nome_aluno\}\}/g, data.alunoNome)
    .replace(/\{\{matricula\}\}/g, data.alunoMatricula)
    .replace(/\{\{ano_letivo\}\}/g, String(data.anoLetivo))
    .replace(/\{\{turma\}\}/g, data.turmaCodigo)
    .replace(/\{\{serie\}\}/g, data.turmaSerie)
    .replace(/\{\{turno\}\}/g, data.turmaTurno)
    .replace(/\{\{data_atual\}\}/g, data.dataAtual)
    .replace(/\{\{percentual_frequencia\}\}/g, data.frequenciaPct.toFixed(1))
    .replace(/\{\{total_aulas\}\}/g, String(data.totalAulas))
    .replace(/\{\{total_presencas\}\}/g, String(data.totalPresencas))
    .replace(/\{\{total_faltas\}\}/g, String(data.totalFaltas))
    .replace(/\{\{periodo\}\}/g, data.periodoNome)
    .replace(/\{\{diretor_nome\}\}/g, data.diretorNome ?? '')
    .replace(/\{\{diretor_cargo\}\}/g, data.diretorCargo ?? '')
}

export function gerarDeclaracaoFrequenciaPDF(data: DeclaracaoFrequenciaPDFData): jsPDF {
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
    if (enderecoStr) {
      doc.text(enderecoStr, pageWidth / 2, y, { align: 'center' })
      y += 4
    }
    if (cidadeStr) {
      doc.text(cidadeStr, pageWidth / 2, y, { align: 'center' })
      y += 4
    }
  }

  y += 3
  doc.setDrawColor(0, 51, 102)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('DECLARAÇÃO DE FREQUÊNCIA', pageWidth / 2, y, { align: 'center' })
  y += 12

  // Body
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  if (data.templateDeclaracao) {
    const bodyText = replaceTemplateVars(data.templateDeclaracao, data)
    const lines = doc.splitTextToSize(bodyText, pageWidth - 2 * margin)
    doc.text(lines, margin, y)
    y += lines.length * 6 + 10
  } else {
    const pctFormat = data.frequenciaPct.toFixed(1)
    const bodyText =
      `Declaramos para os devidos fins que o(a) aluno(a) ${data.alunoNome}, ` +
      `matrícula ${data.alunoMatricula}, regularmente matriculado(a) neste estabelecimento ` +
      `no ${data.anoLetivo}, na ${data.turmaSerie} - ${data.turmaCodigo}, turno ${data.turmaTurno}, ` +
      `apresentou no ${data.periodoNome} a seguinte frequência:`

    const lines = doc.splitTextToSize(bodyText, pageWidth - 2 * margin)
    doc.text(lines, margin, y)
    y += lines.length * 6 + 10
  }

  // Frequência table (always show this regardless of template)
  const tableX = margin + 20
  const col1X = tableX
  const col2X = tableX + 100
  const rowH = 7

  const pctFormat = data.frequenciaPct.toFixed(1)
  doc.setDrawColor(200)
  doc.setLineWidth(0.1)
  doc.rect(tableX, y, pageWidth - 2 * (margin + 20), rowH * 5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Indicador', col1X + 5, y + 5)
  doc.text('Resultado', col2X + 5, y + 5)

  doc.setFont('helvetica', 'normal')
  const rows = [
    ['Total de Aulas', String(data.totalAulas)],
    ['Presenças', String(data.totalPresencas)],
    ['Faltas', String(data.totalFaltas)],
    ['Frequência', `${pctFormat}%`],
  ]
  rows.forEach((r, i) => {
    const ry = y + rowH * (i + 1)
    doc.text(r[0], col1X + 5, ry + 5)
    doc.text(r[1], col2X + 5, ry + 5)
  })

  y += rowH * 6 + 10

  // Info text
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  const infoText = `A frequência escolar mínima exigida por lei é de 75% (setenta e cinco por cento) do total de aulas.`
  const infoLines = doc.splitTextToSize(infoText, pageWidth - 2 * margin)
  doc.text(infoLines, margin, y)
  y += infoLines.length * 5 + 15

  // Date
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const cidade = data.schoolEndereco?.cidade
  doc.text(
    cidade ? `${cidade}, ${data.dataAtual}` : data.dataAtual,
    pageWidth / 2, y,
    { align: 'center' }
  )
  y += 25

  // Signature - use diretor info or school name
  doc.line(pageWidth / 2 - 30, y, pageWidth / 2 + 30, y)
  y += 5
  doc.setFontSize(9)
  if (data.diretorNome && data.diretorCargo) {
    doc.text(data.diretorNome, pageWidth / 2, y, { align: 'center' })
    y += 4
    doc.text(data.diretorCargo, pageWidth / 2, y, { align: 'center' })
  } else {
    doc.text(data.schoolName, pageWidth / 2, y, { align: 'center' })
  }

  return doc
}
