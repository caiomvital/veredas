export interface Funcionario {
  id: string
  escola_id: string
  usuario_id: string | null
  nome_completo: string
  cpf: string
  rg: string | null
  orgao_emissor: string | null
  email: string
  telefone: string | null
  cargo: string
  disciplinas: string[]
  formacao: string | null
  data_admissao: string
  ativo: boolean
  created_at: string
}

export interface Aluno {
  id: string
  escola_id: string
  matricula: string
  nome_completo: string
  data_nascimento: string
  cpf: string | null
  rg: string | null
  orgao_emissor: string | null
  naturalidade: string | null
  nome_mae: string
  nome_pai: string | null
  endereco: Record<string, unknown>
  contato_responsavel: Record<string, unknown>
  foto_url: string | null
  status: 'ativo' | 'inativo' | 'transferido' | 'concluido'
  lgpd_autorizacao_imagem: boolean
  lgpd_autorizacao_dados: boolean
  created_at: string
}

export interface Responsavel {
  id: string
  escola_id: string
  usuario_id: string | null
  nome_completo: string
  cpf: string
  rg: string | null
  email: string
  telefone: string | null
  profissao: string | null
  created_at: string
}

export interface AlunoResponsavel {
  aluno_id: string
  responsavel_id: string
  grau_parentesco: string
}

export interface Turma {
  id: string
  escola_id: string
  codigo: string
  serie: string
  turno: 'manha' | 'tarde' | 'noite'
  ano_letivo: number
  capacidade: number
  ativa: boolean
  created_at: string
}

export interface Disciplina {
  id: string
  escola_id: string
  nome: string
  codigo: string
  area_conhecimento: string
  created_at: string
}

export interface TurmaDisciplinaProfessor {
  id: string
  turma_id: string
  disciplina_id: string
  funcionario_id: string
  carga_horaria_semanal: number
}

export interface Matricula {
  id: string
  aluno_id: string
  turma_id: string
  data_matricula: string
  data_cancelamento: string | null
  status: 'ativa' | 'cancelada' | 'concluida'
  created_at: string
}

export interface PeriodoLetivo {
  id: string
  escola_id: string
  nome: string
  ordem: number
  data_inicio: string
  data_fim: string
  ano_letivo: number
}

export interface Nota {
  id: string
  matricula_id: string
  turma_disciplina_id: string
  periodo_id: string
  valor: number
  tipo: 'prova' | 'trabalho' | 'recuperacao' | 'media_final'
  lancado_por: string
  created_at: string
  updated_at: string
}

export interface HistoricoEscolar {
  id: string
  aluno_id: string
  turma_id: string
  ano_letivo: number
  situacao: 'aprovado' | 'reprovado' | 'transferido'
  observacoes: string | null
  criado_por: string | null
  created_at: string
  updated_at: string
}

export interface ConfigMensalidade {
  id: string
  escola_id: string
  serie: string
  ano_letivo: number
  valor: number
  created_at: string
  updated_at: string
}

export type LancamentoTipo = 'mensalidade' | 'extra'
export type LancamentoStatus = 'pendente' | 'pago'

export interface LancamentoFinanceiro {
  id: string
  escola_id: string
  aluno_id: string | null
  tipo: LancamentoTipo
  descricao: string
  valor: number
  data_vencimento: string
  status: LancamentoStatus
  data_pagamento: string | null
  multa: number
  pago_em: string | null
  baixado_por: string | null
  criado_por: string | null
  numero_recibo: string | null
  mes_referencia: number | null
  ano_referencia: number | null
  created_at: string
  updated_at: string
}

export interface Frequencia {
  id: string
  matricula_id: string
  turma_disciplina_id: string
  data_aula: string
  presenca: boolean
  justificada: boolean
  motivo_justificativa: string | null
  lancado_por: string
  created_at: string
}

// ---- Fase 6: Comunicados ----

export interface Comunicado {
  id: string
  escola_id: string
  titulo: string
  corpo: string
  data_publicacao: string
  criado_por: string | null
  created_at: string
  updated_at: string
  destinatarios: ComunicadoDestinatario[]
  lida?: boolean
  lida_em?: string | null
}

export interface ComunicadoDestinatario {
  id: string
  comunicado_id: string
  tipo: 'toda_escola' | 'turma' | 'perfil'
  turma_id: string | null
  perfil: string | null
}

export interface ComunicadoLeitura {
  id: string
  comunicado_id: string
  usuario_id: string
  lida_em: string
}

// ---- Fase 6: Calendário ----

export type EventoTipo = 'feriado' | 'prova' | 'reuniao' | 'evento' | 'recesso'

export interface EventoCalendario {
  id: string
  escola_id: string
  nome: string
  descricao: string | null
  data_inicio: string
  data_fim: string | null
  tipo: EventoTipo
  criado_por: string | null
  created_at: string
}

// ---- Agenda do Aluno ----

export type AgendaTipo = 'recado' | 'tarefa' | 'observacao' | 'resposta_responsavel'

export interface AgendaRegistro {
  id: string
  escola_id: string
  aluno_id: string
  autor_id: string
  tipo: AgendaTipo
  conteudo: string
  data_registro: string
  lido_responsavel: boolean
  lido_professor: boolean
  created_at: string
}

// ---- Fase 7: Avisos WhatsApp ----

export type AvisoTipo = 'falta' | 'financeiro' | 'comunicado'

export type AvisoStatus = 'pendente' | 'enviado' | 'descartado'

export interface AvisoWhatsApp {
  id: string
  escola_id: string
  tipo: AvisoTipo
  aluno_id: string | null
  responsavel_id: string
  responsavel_nome: string
  responsavel_telefone: string
  aluno_nome: string | null
  mensagem: string
  metadata: Record<string, unknown>
  status: AvisoStatus
  enviado_em: string | null
  enviado_por: string | null
  created_at: string
}
