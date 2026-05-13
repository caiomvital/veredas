import jsPDF from 'jspdf'
import type { FichaAlunoData } from '@/lib/actions/ficha-aluno'

function fmt(data: string | null | undefined, fallback = '—'): string {
  return data || fallback
}

function enderecoStr(endereco: Record<string, unknown>): string {
  const parts = [
    endereco.rua as string,
    endereco.numero as string,
    endereco.complemento as string,
    endereco.bairro as string,
  ].filter(Boolean)
  const cidade = [endereco.cidade as string, endereco.uf as string].filter(Boolean).join(' - ')
  const linha1 = parts.length ? parts.join(', ') : ''
  return [linha1, cidade].filter(Boolean).join('\n')
}

function idade(dataNasc: string): number {
  const hoje = new Date()
  const nasc = new Date(dataNasc + 'T12:00:00')
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

function calcIdade(dataNasc: string): string {
  const hoje = new Date()
  const nasc = new Date(dataNasc + 'T12:00:00')
  let anos = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--
  let mes = (hoje.getMonth() - nasc.getMonth() + 12) % 12
  if (hoje.getDate() < nasc.getDate()) {
    mes = (mes - 1 + 12) % 12
  }
  if (anos > 0) return `${anos} ano(s) e ${mes} mes(es)`
  return `${mes} mes(es)`
}

export function gerarFichaAlunoPDF(data: FichaAlunoData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin
  let y = margin

  const a = data.aluno
  const t = data.turma
  const m = data.matricula
  const e = data.escola

  // ═══════════════ HEADER ═══════════════
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(e.nome, pageWidth / 2, y, { align: 'center' })
  y += 6

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  if (e.cnpj) {
    doc.text(`CNPJ: ${e.cnpj}`, pageWidth / 2, y, { align: 'center' })
    y += 4
  }

  const endEscola = e.endereco as Record<string, unknown>
  const endStr = enderecoStr(endEscola)
  if (endStr) {
    const lines = doc.splitTextToSize(endStr, contentWidth)
    lines.forEach((l: string) => {
      doc.text(l, pageWidth / 2, y, { align: 'center' })
      y += 3.5
    })
  }

  const contato = e.contato as Record<string, unknown>
  if (contato.telefone) {
    doc.text(`Tel: ${contato.telefone}`, pageWidth / 2, y, { align: 'center' })
    y += 4
  }

  // Line
  y += 2
  doc.setDrawColor(0, 51, 102)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  // Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('FICHA COMPLETA DO ALUNO', pageWidth / 2, y, { align: 'center' })
  y += 10

  // ═══════════════ HELPER ═══════════════
  function sectionTitle(title: string) {
    y += 2
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 51, 102)
    doc.text(title, margin, y)
    y += 1
    doc.setDrawColor(0, 51, 102)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageWidth - margin, y)
    y += 5
    doc.setTextColor(0, 0, 0)
  }

  function field(label: string, value: string, x = margin, w = contentWidth) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    const labelW = doc.getTextWidth(label + ': ')
    doc.text(label + ':', x, y)
    doc.setFont('helvetica', 'normal')
    const val = value || '—'
    if (labelW + doc.getTextWidth(val) < w) {
      doc.text(val, x + labelW, y)
    } else {
      doc.text(val, x + labelW, y)
    }
    y += 5
  }

  function fieldInline(label: string, value: string, x: number, w: number) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    const labelW = doc.getTextWidth(label + ': ')
    doc.text(label + ':', x, y)
    doc.setFont('helvetica', 'normal')
    const maxTextW = w - labelW
    const val = value || '—'
    const textW = doc.getTextWidth(val)
    if (textW <= maxTextW) {
      doc.text(val, x + labelW, y)
    } else {
      const truncated = doc.splitTextToSize(val, maxTextW)
      doc.text(truncated[0], x + labelW, y)
    }
  }

  // ═══════════════ CHECK PAGE BREAK ═══════════════
  function checkPage(needed: number) {
    if (y + needed > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  // ═══════════════ DADOS DO ALUNO ═══════════════
  sectionTitle('DADOS DO ALUNO')

  field('Nome Completo', a.nome_completo)
  field('Data de Nascimento', `${a.data_nascimento} (${calcIdade(a.data_nascimento)})`)
  field('CPF', fmt(a.cpf))
  field('RG', a.rg ? `${a.rg}${a.orgao_emissor ? ` — ${a.orgao_emissor}` : ''}` : '—')
  field('Naturalidade', fmt(a.naturalidade))
  field('Nº Matrícula', a.matricula)

  // ═══════════════ DADOS ESCOLARES ═══════════════
  checkPage(35)
  sectionTitle('DADOS ESCOLARES')

  field('Turma', t.codigo ? `${t.serie} — ${t.codigo}` : '—')
  field('Turno', t.turno ? (t.turno.charAt(0).toUpperCase() + t.turno.slice(1)) : '—')
  field('Ano Letivo', t.ano_letivo ? String(t.ano_letivo) : '—')
  field('Data da Matrícula', m.data_matricula || '—')
  field('Status da Matrícula', m.status === 'ativa' ? 'Ativa' : m.status || '—')

  // ═══════════════ FILIAÇÃO ═══════════════
  checkPage(25)
  sectionTitle('FILIAÇÃO')

  field('Mãe', a.nome_mae)
  field('Pai', fmt(a.nome_pai))

  // ═══════════════ RESPONSÁVEIS VINCULADOS ═══════════════
  checkPage(15 + data.responsaveis.length * 20)
  sectionTitle('RESPONSÁVEIS VINCULADOS')

  if (data.responsaveis.length === 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Nenhum responsável vinculado.', margin, y)
    y += 6
  } else {
    for (const r of data.responsaveis) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`${r.grau_parentesco}:`, margin, y)
      doc.setFont('helvetica', 'normal')
      doc.text(r.nome_completo, margin + 45, y)
      y += 4.5
      doc.text(`CPF: ${r.cpf}`, margin + 45, y)
      doc.text(`Tel: ${fmt(r.telefone)}`, margin + 45 + 55, y)
      y += 4.5
      doc.text(`E-mail: ${r.email}`, margin + 45, y)
      y += 7
    }
  }

  // ═══════════════ ENDEREÇO ═══════════════
  checkPage(20)
  sectionTitle('ENDEREÇO')

  const endAluno = a.endereco as Record<string, unknown>
  const endAlunoStr = enderecoStr(endAluno)
  if (endAlunoStr) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(endAlunoStr, contentWidth)
    lines.forEach((l: string) => {
      doc.text(l, margin, y)
      y += 4
    })
    y += 2
  } else {
    field('Endereço', '—')
  }

  // ═══════════════ SAÚDE ═══════════════
  checkPage(35)
  sectionTitle('INFORMAÇÕES DE SAÚDE')

  field('Tipo Sanguíneo', fmt(a.tipo_sanguineo))
  field('Alergias', fmt(a.alergias))
  field('Medicamentos', fmt(a.medicamentos))
  field('Plano de Saúde', fmt(a.plano_saude))
  field('Observações Médicas', fmt(a.observacoes_medicas))

  // ═══════════════ AUTORIZAÇÕES ═══════════════
  checkPage(20)
  sectionTitle('AUTORIZAÇÕES')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Pode sair sozinho: ${a.pode_sair_sozinho ? 'Sim' : 'Não'}`, margin, y)
  y += 5
  doc.text(`Autorização de imagem (LGPD): ${a.lgpd_autorizacao_imagem ? 'Sim' : 'Não'}`, margin, y)
  y += 5
  doc.text(`Autorização de dados (LGPD): ${a.lgpd_autorizacao_dados ? 'Sim' : 'Não'}`, margin, y)
  y += 8

  // ═══════════════ ASSINATURAS ═══════════════
  checkPage(30)
  const dataEmissao = new Date().toLocaleDateString('pt-BR')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text(`Data de emissão: ${dataEmissao}`, margin, y)
  y += 15

  const sigW = 70
  const sigX1 = margin
  const sigX2 = pageWidth - margin - sigW
  const lineY = y

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.line(sigX1, lineY, sigX1 + sigW, lineY)
  doc.text('Responsável', sigX1, lineY + 5)

  doc.line(sigX2, lineY, sigX2 + sigW, lineY)
  doc.text('Secretaria', sigX2, lineY + 5)

  return doc
}
