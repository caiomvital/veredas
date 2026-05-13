'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

export interface FichaAlunoData {
  aluno: {
    id: string
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
    status: string
    lgpd_autorizacao_imagem: boolean
    lgpd_autorizacao_dados: boolean
    tipo_sanguineo: string | null
    alergias: string | null
    medicamentos: string | null
    plano_saude: string | null
    observacoes_medicas: string | null
    pode_sair_sozinho: boolean
    created_at: string
  }
  matricula: {
    id: string
    data_matricula: string
    status: string
    turma_id: string
  }
  turma: {
    codigo: string
    serie: string
    turno: string
    ano_letivo: number
  }
  responsaveis: {
    nome_completo: string
    grau_parentesco: string
    cpf: string
    telefone: string | null
    email: string
  }[]
  escola: {
    nome: string
    cnpj: string | null
    endereco: Record<string, unknown>
    contato: Record<string, unknown>
  }
}

export async function getFichaAluno(alunoId: string): Promise<ActionResult<FichaAlunoData>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    // Buscar dados do aluno
    const { data: aluno, error: alunoErr } = await supabase
      .from('alunos')
      .select('*')
      .eq('id', alunoId)
      .single()

    if (alunoErr || !aluno) return { data: null, error: alunoErr?.message ?? 'Aluno não encontrado' }

    // Buscar matrícula ativa
    const { data: matricula } = await supabase
      .from('matriculas')
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('status', 'ativa')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let turmaData = { codigo: '', serie: '', turno: '', ano_letivo: new Date().getFullYear() }
    if (matricula) {
      const { data: turma } = await supabase
        .from('turmas')
        .select('codigo, serie, turno, ano_letivo')
        .eq('id', matricula.turma_id)
        .single()

      if (turma) {
        turmaData = turma as unknown as { codigo: string; serie: string; turno: string; ano_letivo: number }
      }
    }

    // Buscar responsáveis vinculados
    const { data: vinculos } = await supabase
      .from('aluno_responsavel')
      .select('grau_parentesco, responsaveis!inner(id, nome_completo, cpf, telefone, email)')
      .eq('aluno_id', alunoId)

    const responsaveis = (vinculos ?? []).map((v) => {
      const r = v.responsaveis as unknown as { nome_completo: string; cpf: string; telefone: string | null; email: string }
      return {
        nome_completo: r.nome_completo,
        grau_parentesco: v.grau_parentesco,
        cpf: r.cpf,
        telefone: r.telefone,
        email: r.email,
      }
    })

    // Buscar dados da escola
    const { data: escola } = await supabase
      .from('escolas')
      .select('nome, cnpj, endereco, contato')
      .eq('id', escolaId)
      .single()

    return {
      data: {
        aluno: aluno as unknown as FichaAlunoData['aluno'],
        matricula: matricula
          ? { id: matricula.id, data_matricula: matricula.data_matricula, status: matricula.status, turma_id: matricula.turma_id }
          : { id: '', data_matricula: '', status: 'sem_matricula', turma_id: '' },
        turma: turmaData,
        responsaveis,
        escola: escola
          ? { nome: escola.nome, cnpj: escola.cnpj, endereco: escola.endereco as Record<string, unknown>, contato: escola.contato as Record<string, unknown> }
          : { nome: 'Escola', cnpj: null, endereco: {}, contato: {} },
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'Erro ao carregar dados da ficha' }
  }
}
