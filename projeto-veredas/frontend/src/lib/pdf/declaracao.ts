import jsPDF from 'jspdf'

export interface DeclaracaoPDFData {
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
  dataAtual: string
  nomeMae?: string
  diretorNome?: string
  diretorCargo?: string
}

function replaceTemplateVars(text: string, data: DeclaracaoPDFData): string {
  return text
    .replace(/\{\{nome_aluno\}\}/g, data.alunoNome)
    .replace(/\{\{matricula\}\}/g, data.alunoMatricula)
    .replace(/\{\{ano_letivo\}\}/g, String(data.anoLetivo))
    .replace(/\{\{turma\}\}/g, data.turmaCodigo)
    .replace(/\{\{serie\}\}/g, data.turmaSerie)
    .replace(/\{\{turno\}\}/g, data.turmaTurno)
    .replace(/\{\{data_atual\}\}/g, data.dataAtual)
    .replace(/\{\{nome_mae\}\}/g, data.nomeMae ?? '')
    .replace(/\{\{diretor_nome\}\}/g, data.diretorNome ?? '')
    .replace(/\{\{diretor_cargo\}\}/g, data.diretorCargo ?? '')
}

export function gerarDeclaracaoPDF(data: DeclaracaoPDFData): jsPDF {
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

  // Horizontal line
  y += 3
  doc.setDrawColor(0, 51, 102)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('DECLARAÇÃO DE MATRÍCULA', pageWidth / 2, y, { align: 'center' })
  y += 12

  // Body text
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  let bodyText: string
  if (data.templateDeclaracao) {
    bodyText = replaceTemplateVars(data.templateDeclaracao, data)
  } else {
    bodyText =
      `Declaramos para os devidos fins que o(a) aluno(a) ${data.alunoNome}, ` +
      `matrícula ${data.alunoMatricula}, encontra-se regularmente matriculado(a) ` +
      `no ${data.anoLetivo}, na ${data.turmaSerie} - ${data.turmaCodigo}, turno ${data.turmaTurno}, ` +
      `neste estabelecimento de ensino.`
  }

  const lines = doc.splitTextToSize(bodyText, pageWidth - 2 * margin)
  doc.text(lines, margin, y)
  y += lines.length * 6 + 15

  // Date
  const cidade = data.schoolEndereco?.cidade
  doc.setFont('helvetica', 'italic')
  doc.text(
    cidade ? `${cidade}, ${data.dataAtual}` : data.dataAtual,
    pageWidth / 2, y,
    { align: 'center' }
  )
  y += 25

  // Signature area
  doc.setFont('helvetica', 'normal')
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
