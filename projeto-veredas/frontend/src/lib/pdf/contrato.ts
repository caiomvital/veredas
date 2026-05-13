import jsPDF from 'jspdf'
import type { ContratoData } from '@/lib/actions/contrato'

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR')
  } catch { return dateStr }
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function gerarContratoPDF(data: ContratoData): jsPDF {
  const doc = new jsPDF()
  const pw = doc.internal.pageSize.getWidth()
  const m = 25
  let y = m

  const cidade = (data.escola.endereco?.cidade as string) ?? ''
  const uf = (data.escola.endereco?.uf as string) ?? ''
  const rua = (data.escola.endereco?.rua as string) ?? ''
  const numero = (data.escola.endereco?.numero as string) ?? ''
  const bairro = (data.escola.endereco?.bairro as string) ?? ''

  const assinanteNome = (data.escola.textos?.assinante_nome as string) ?? data.escola.nome
  const assinanteCargo = (data.escola.textos?.assinante_cargo as string) ?? 'Diretor(a)'
  const cidadeRodape = (data.escola.textos?.cidade_rodape as string) ?? cidade
  const ufRodape = (data.escola.textos?.uf_rodape as string) ?? uf
  const clausulas = (data.escola.textos?.clausulas_contrato as string) ?? ''
  const diaVenc = (data.escola.config_financeira?.dia_vencimento as number) ?? 10
  const multa = (data.escola.config_financeira?.percentual_multa as number) ?? 2
  const juros = (data.escola.config_financeira?.juros_ao_dia as number) ?? 0.033

  function addHeader() {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(data.escola.nome, pw / 2, y, { align: 'center' })
    y += 6
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    if (data.escola.cnpj) {
      doc.text(`CNPJ: ${data.escola.cnpj}`, pw / 2, y, { align: 'center' })
      y += 4
    }
    const addrParts = [rua, numero, bairro].filter(Boolean)
    if (addrParts.length > 0) {
      doc.text(addrParts.join(', '), pw / 2, y, { align: 'center' })
      y += 4
    }
    if (cidade || uf) {
      doc.text([cidade, uf].filter(Boolean).join(' - '), pw / 2, y, { align: 'center' })
      y += 4
    }
    y += 2
  }

  function line() {
    doc.setDrawColor(0, 51, 102)
    doc.setLineWidth(0.5)
    doc.line(m, y, pw - m, y)
    y += 8
  }

  function section(title: string) {
    y += 4
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(title, m, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
  }

  function body(text: string) {
    const lines = doc.splitTextToSize(text, pw - 2 * m)
    doc.text(lines, m, y)
    y += lines.length * 4.5 + 3
  }

  // ======== HEADER ========
  addHeader()
  line()

  // Title
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS', pw / 2, y, { align: 'center' })
  y += 6
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nº ${data.numeroContrato}`, pw / 2, y, { align: 'center' })
  y += 12

  // ======== QUALIFICAÇÃO PARTES ========
  section('CLÁUSULA 1 — QUALIFICAÇÃO DAS PARTES')

  const escolaEnd = [rua, numero, bairro, cidade, uf].filter(Boolean).join(', ')
  body(
    `${data.escola.nome}, inscrita no CNPJ sob nº ${data.escola.cnpj ?? '—'}, ` +
    `com sede na ${escolaEnd || '—'}, doravante denominada CONTRATADA.`
  )

  if (data.responsavel) {
    body(
      `${data.responsavel.nome_completo}, inscrito(a) no CPF sob nº ${data.responsavel.cpf}, ` +
      `${data.responsavel.telefone ? `telefone ${data.responsavel.telefone}, ` : ''}` +
      `na qualidade de ${data.responsavel.grau_parentesco} do(a) aluno(a) abaixo qualificado(a), ` +
      `doravante denominado(a) CONTRATANTE.`
    )
  }

  // ======== DADOS DO ALUNO ========
  section('CLÁUSULA 2 — DO ALUNO')
  body(
    `Nome: ${data.aluno.nome_completo} | Matrícula: ${data.aluno.matricula} | ` +
    `Nascimento: ${formatDate(data.aluno.data_nascimento)} | ` +
    `CPF: ${data.aluno.cpf ?? '—'}`
  )
  body(
    `Turma: ${data.turma.serie} — ${data.turma.codigo} | Turno: ${data.turma.turno} | ` +
    `Ano Letivo: ${data.turma.ano_letivo}`
  )

  // ======== CLÁUSULAS ========
  if (clausulas) {
    section('CLÁUSULAS CONTRATUAIS')
    body(clausulas)
  } else {
    // Cláusulas padrão
    section('CLÁUSULA 3 — DO OBJETO')
    body(
      'O presente contrato tem por objeto a prestação de serviços educacionais pela CONTRATADA ' +
      `ao(à) aluno(a) acima qualificado(a), durante o ano letivo de ${data.turma.ano_letivo}, ` +
      'em conformidade com a proposta pedagógica e o regimento escolar.'
    )

    section('CLÁUSULA 4 — DO VALOR E FORMA DE PAGAMENTO')
    if (data.valorMensalidade) {
      body(
        `O valor da mensalidade é de ${formatCurrency(data.valorMensalidade)}, ` +
        `com vencimento todo dia ${diaVenc} de cada mês. ` +
        `O pagamento deverá ser efetuado por meio de boleto bancário ou transferência.`
      )
      body(
        `O atraso no pagamento sujeitará o CONTRATANTE à multa de ${multa}% ` +
        `e juros de ${juros}% ao dia sobre o valor devido.`
      )
    } else {
      body('O valor da mensalidade será definido conforme tabela vigente da CONTRATADA.')
    }

    section('CLÁUSULA 5 — DAS OBRIGAÇÕES DA CONTRATADA')
    body(
      'A CONTRATADA obriga-se a: (a) ministrar os serviços educacionais conforme a legislação vigente; ' +
      '(b) disponibilizar corpo docente qualificado; (c) manter registro do desempenho acadêmico do(a) aluno(a); ' +
      '(d) fornecer documentos solicitados (declarações, históricos, transferências); ' +
      '(e) zelar pela segurança e bem-estar do(a) aluno(a) no ambiente escolar.'
    )

    section('CLÁUSULA 6 — DAS OBRIGAÇÕES DO CONTRATANTE')
    body(
      'O CONTRATANTE obriga-se a: (a) efetuar pontualmente o pagamento das mensalidades; ' +
      '(b) manter atualizados seus dados cadastrais junto à CONTRATADA; ' +
      '(c) comparecer às reuniões e eventos escolares; ' +
      '(d) zelar pelo cumprimento do regimento escolar; ' +
      '(e) comunicar à CONTRATADA qualquer alteração relevante.'
    )

    section('CLÁUSULA 7 — DA RESCISÃO')
    body(
      'O presente contrato poderá ser rescindido: (a) por solicitação do CONTRATANTE, mediante ' +
      'comunicação por escrito com antecedência mínima de 30 dias; (b) pela CONTRATADA, em caso ' +
      'de inadimplemento ou descumprimento das obrigações contratuais pelo CONTRATANTE; ' +
      '(c) por transferência do(a) aluno(a), formalizada junto à secretaria da escola.'
    )
  }

  // ======== CHECK PAGE BREAK ========
  if (y > 230) {
    doc.addPage()
    y = m
  }

  // ======== LOCAL E DATA ========
  y += 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  const hoje = new Date().toLocaleDateString('pt-BR')
  doc.text(`${cidadeRodape}${cidadeRodape ? ', ' : ''}${hoje}.`, pw / 2, y, { align: 'center' })
  y += 16

  // ======== ASSINATURAS ========
  const colW = (pw - 2 * m - 20) / 2

  // Linha de assinatura - CONTRATADA
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const y1 = y
  doc.line(m, y, m + colW, y)
  y += 5
  doc.text(assinanteNome, m + colW / 2, y, { align: 'center' })
  y += 4
  doc.setFontSize(8)
  doc.text(assinanteCargo, m + colW / 2, y, { align: 'center' })
  y += 4
  doc.text('CONTRATADA', m + colW / 2, y, { align: 'center' })

  // Linha de assinatura - CONTRATANTE
  doc.setFontSize(9)
  const y2 = y1
  const x2 = m + colW + 20
  doc.line(x2, y2, x2 + colW, y2)
  doc.text(data.responsavel?.nome_completo ?? 'Responsável', x2 + colW / 2, y2 + 5, { align: 'center' })
  doc.setFontSize(8)
  doc.text('CONTRATANTE', x2 + colW / 2, y2 + 14, { align: 'center' })

  y = y1 + 24

  // ======== TESTEMUNHAS ========
  y += 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Testemunhas:', m, y)
  y += 10
  doc.setFont('helvetica', 'normal')

  const yt = y
  doc.line(m, y, m + colW, y)
  doc.text('Nome:', m, y + 5)
  doc.text('CPF:', m, y + 10)

  const x3 = m + colW + 20
  doc.line(x3, yt, x3 + colW, yt)
  doc.text('Nome:', x3, yt + 5)
  doc.text('CPF:', x3, yt + 10)

  return doc
}
