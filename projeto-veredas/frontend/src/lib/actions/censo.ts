'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

interface CensoDados {
  escola: Record<string, unknown>
  turmas: Record<string, unknown>[]
  alunos: Record<string, unknown>[]
  funcionarios: Record<string, unknown>[]
}

export async function exportarCenso(): Promise<ActionResult<CensoDados>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    // 1. Dados da escola
    const { data: escola, error: err1 } = await supabase
      .from('escolas').select('*').eq('id', escolaId).single()
    if (err1) return { data: null, error: err1.message }

    // 2. Turmas ativas com professor via alocações
    const { data: turmas, error: err2 } = await supabase
      .from('turmas')
      .select(`
        *,
        turma_disciplina_professor!left(
          funcionario_id,
          funcionarios!left(nome_completo, cargo)
        )
      `)
      .eq('escola_id', escolaId)
      .eq('ativa', true)
      .order('codigo')
    if (err2) return { data: null, error: err2.message }

    // 3. Alunos ativos com matrículas e responsáveis
    const { data: alunos, error: err3 } = await supabase
      .from('alunos')
      .select(`
        *,
        matriculas!left(
          id, turma_id, status, data_matricula,
          turmas!left(codigo, serie, turno)
        ),
        aluno_responsavel!left(
          grau_parentesco,
          responsaveis!left(nome_completo, cpf, telefone, email)
        )
      `)
      .eq('escola_id', escolaId)
      .eq('status', 'ativo')
      .order('nome_completo')
    if (err3) return { data: null, error: err3.message }

    // 4. Funcionários ativos
    const { data: funcionarios, error: err4 } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('escola_id', escolaId)
      .eq('ativo', true)
      .order('nome_completo')
    if (err4) return { data: null, error: err4.message }

    return {
      data: {
        escola: escola as Record<string, unknown>,
        turmas: turmas as unknown as Record<string, unknown>[],
        alunos: alunos as unknown as Record<string, unknown>[],
        funcionarios: funcionarios as unknown as Record<string, unknown>[],
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'Erro ao exportar dados do censo' }
  }
}

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatDate(d: string | null | undefined): string {
  if (!d) return ''
  return d.substring(0, 10)
}

function getEndereco(endereco: unknown, campo: string): string {
  if (!endereco || typeof endereco !== 'object') return ''
  return String((endereco as Record<string, unknown>)[campo] ?? '')
}

export async function exportarCensoCSV(): Promise<ActionResult<string>> {
  const result = await exportarCenso()
  if (result.error || !result.data) {
    return { data: null, error: result.error }
  }

  const { escola, turmas, alunos, funcionarios } = result.data
  const lines: string[] = []

  // === HEADER: dados da escola ===
  lines.push('=== DADOS DA ESCOLA ===')
  lines.push([
    'inep', 'nome', 'cnpj', 'telefone', 'email',
    'cep', 'rua', 'numero', 'bairro', 'cidade', 'uf',
    'diretor_nome', 'diretor_cargo', 'ano_letivo_atual',
  ].join(','))
  const contato = (escola.contato as Record<string, unknown>) ?? {}
  const end = (escola.endereco as Record<string, unknown>) ?? {}
  lines.push([
    escapeCSV(escola.inep),
    escapeCSV(escola.nome),
    escapeCSV(escola.cnpj),
    escapeCSV(contato.telefone),
    escapeCSV(contato.email),
    escapeCSV(end.cep),
    escapeCSV(end.rua),
    escapeCSV(end.numero),
    escapeCSV(end.bairro),
    escapeCSV(end.cidade),
    escapeCSV(end.uf),
    escapeCSV(escola.diretor_nome),
    escapeCSV(escola.diretor_cargo),
    escapeCSV(escola.ano_letivo_atual),
  ].join(','))
  lines.push('')

  // === TURMAS ===
  lines.push('=== TURMAS ===')
  lines.push([
    'codigo', 'serie', 'turno', 'ano_letivo', 'capacidade',
    'professor_nome', 'professor_cargo',
  ].join(','))
  for (const t of turmas) {
    // professores vinculados via alocações
    const alocacoes = (t.turma_disciplina_professor as Record<string, unknown>[] | undefined) ?? []
    const profSet = new Set<string>()
    const profCargoSet = new Set<string>()
    for (const a of alocacoes) {
      const func = a.funcionarios as Record<string, unknown> | null
      if (func?.nome_completo) {
        profSet.add(String(func.nome_completo))
        if (func.cargo) profCargoSet.add(String(func.cargo))
      }
    }
    const profNomes = [...profSet].join('; ')
    const profCargos = [...profCargoSet].join('; ')

    lines.push([
      escapeCSV(t.codigo),
      escapeCSV(t.serie),
      escapeCSV(t.turno),
      escapeCSV(t.ano_letivo),
      escapeCSV(t.capacidade),
      escapeCSV(profNomes),
      escapeCSV(profCargos),
    ].join(','))
  }
  lines.push('')

  // === ALUNOS ===
  lines.push('=== ALUNOS ===')
  lines.push([
    'matricula', 'nome_completo', 'data_nascimento', 'cpf', 'rg', 'orgao_emissor',
    'naturalidade', 'nome_mae', 'nome_pai',
    'cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'uf',
    'tipo_sanguineo', 'alergias', 'medicamentos', 'plano_saude',
    'pode_sair_sozinho', 'lgpd_imagem', 'lgpd_dados',
    'status', 'turma_codigo', 'turma_serie', 'turma_turno',
    'responsavel_nome', 'responsavel_parentesco', 'responsavel_cpf', 'responsavel_telefone',
  ].join(','))
  for (const a of alunos) {
    const endAluno = (a.endereco as Record<string, unknown>) ?? {}
    const matriculas = (a.matriculas as Record<string, unknown>[] | undefined) ?? []
    const matriculaAtiva = matriculas.find((m) => m.status === 'ativa')
    const turmaMat = matriculaAtiva?.turmas as Record<string, unknown> | null | undefined
    const responsaveis = (a.aluno_responsavel as Record<string, unknown>[] | undefined) ?? []

    // Pega primeiro responsável como principal
    const respPrincipal = responsaveis[0]
    const respData = respPrincipal?.responsaveis as Record<string, unknown> | null | undefined

    lines.push([
      escapeCSV(a.matricula),
      escapeCSV(a.nome_completo),
      formatDate(a.data_nascimento as string | null),
      escapeCSV(a.cpf),
      escapeCSV(a.rg),
      escapeCSV(a.orgao_emissor),
      escapeCSV(a.naturalidade),
      escapeCSV(a.nome_mae),
      escapeCSV(a.nome_pai),
      getEndereco(endAluno, 'cep'),
      getEndereco(endAluno, 'rua'),
      getEndereco(endAluno, 'numero'),
      getEndereco(endAluno, 'complemento'),
      getEndereco(endAluno, 'bairro'),
      getEndereco(endAluno, 'cidade'),
      getEndereco(endAluno, 'uf'),
      escapeCSV(a.tipo_sanguineo),
      escapeCSV(a.alergias),
      escapeCSV(a.medicamentos),
      escapeCSV(a.plano_saude),
      escapeCSV(a.pode_sair_sozinho),
      escapeCSV(a.lgpd_autorizacao_imagem),
      escapeCSV(a.lgpd_autorizacao_dados),
      escapeCSV(a.status),
      escapeCSV(turmaMat?.codigo),
      escapeCSV(turmaMat?.serie),
      escapeCSV(turmaMat?.turno),
      escapeCSV(respData?.nome_completo),
      escapeCSV(respPrincipal?.grau_parentesco),
      escapeCSV(respData?.cpf),
      escapeCSV(respData?.telefone),
    ].join(','))
  }
  lines.push('')

  // === FUNCIONÁRIOS ===
  lines.push('=== FUNCIONÁRIOS ===')
  lines.push([
    'nome_completo', 'cpf', 'rg', 'orgao_emissor', 'email', 'telefone',
    'cargo', 'formacao', 'data_admissao',
  ].join(','))
  for (const f of funcionarios) {
    lines.push([
      escapeCSV(f.nome_completo),
      escapeCSV(f.cpf),
      escapeCSV(f.rg),
      escapeCSV(f.orgao_emissor),
      escapeCSV(f.email),
      escapeCSV(f.telefone),
      escapeCSV(f.cargo),
      escapeCSV(f.formacao),
      formatDate(f.data_admissao as string | null),
    ].join(','))
  }

  return { data: lines.join('\n'), error: null }
}
