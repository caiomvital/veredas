'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

export interface ContratoData {
  matriculaId: string
  escola: {
    nome: string
    cnpj: string | null
    endereco: Record<string, unknown>
    contato: Record<string, unknown>
    textos: Record<string, unknown>
    config_financeira: Record<string, unknown>
  }
  aluno: {
    nome_completo: string
    data_nascimento: string
    cpf: string | null
    rg: string | null
    matricula: string
  }
  turma: {
    codigo: string
    serie: string
    turno: string
    ano_letivo: number
  }
  responsavel: {
    nome_completo: string
    cpf: string
    telefone: string | null
    grau_parentesco: string
  } | null
  valorMensalidade: number | null
  numeroContrato: string
}

export async function getDadosContrato(alunoId: string): Promise<ActionResult<ContratoData>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const { data: escola, error: errEscola } = await supabase
      .from('escolas')
      .select('nome, cnpj, endereco, contato, textos, config_financeira')
      .eq('id', escolaId)
      .single()
    if (errEscola) return { data: null, error: errEscola.message }

    const { data: aluno, error: errAluno } = await supabase
      .from('alunos')
      .select('nome_completo, data_nascimento, cpf, rg, matricula')
      .eq('id', alunoId)
      .single()
    if (errAluno) return { data: null, error: errAluno.message }

    const { data: matriculas } = await supabase
      .from('matriculas')
      .select('*, turmas!inner(codigo, serie, turno, ano_letivo)')
      .eq('aluno_id', alunoId)
      .eq('status', 'ativa')
      .order('created_at', { ascending: false })
      .limit(1)
    if (!matriculas || matriculas.length === 0) return { data: null, error: 'Aluno não possui matrícula ativa' }

    const matricula = matriculas[0]
    const turma = matricula.turmas as unknown as { codigo: string; serie: string; turno: string; ano_letivo: number }

    let numeroContrato = matricula.numero_contrato as string | null
    if (!numeroContrato) {
      const ano = turma.ano_letivo
      const { count } = await supabase
        .from('matriculas')
        .select('*', { count: 'estimated', head: true })
        .gte('created_at', `${ano}-01-01`)
        .lt('created_at', `${ano + 1}-01-01`)
      const seq = ((count ?? 0) + 1).toString().padStart(5, '0')
      numeroContrato = `CONT-${ano}-${seq}`
      // Save immediately
      await supabase.from('matriculas').update({ numero_contrato: numeroContrato }).eq('id', matricula.id)
    }

    const { data: vinculos } = await supabase
      .from('responsavel_aluno')
      .select('grau_parentesco, responsaveis!inner(nome_completo, cpf, telefone)')
      .eq('aluno_id', alunoId)
      .limit(1)
    const vinculo = vinculos?.[0]
    const responsavel = vinculo ? {
      nome_completo: (vinculo.responsaveis as unknown as { nome_completo: string }).nome_completo,
      cpf: (vinculo.responsaveis as unknown as { cpf: string }).cpf,
      telefone: (vinculo.responsaveis as unknown as { telefone: string | null }).telefone,
      grau_parentesco: vinculo.grau_parentesco,
    } : null

    const { data: configs } = await supabase
      .from('config_mensalidades')
      .select('valor')
      .eq('serie', turma.serie)
      .eq('ano_letivo', turma.ano_letivo)
      .maybeSingle()
    const valorMensalidade = (configs as { valor: number } | null)?.valor ?? null

    return {
      data: {
        matriculaId: matricula.id,
        escola: {
          nome: escola.nome,
          cnpj: escola.cnpj,
          endereco: escola.endereco as Record<string, unknown>,
          contato: escola.contato as Record<string, unknown>,
          textos: escola.textos as Record<string, unknown>,
          config_financeira: escola.config_financeira as Record<string, unknown>,
        },
        aluno: {
          nome_completo: aluno.nome_completo,
          data_nascimento: aluno.data_nascimento,
          cpf: aluno.cpf,
          rg: aluno.rg,
          matricula: aluno.matricula,
        },
        turma: {
          codigo: turma.codigo,
          serie: turma.serie,
          turno: turma.turno,
          ano_letivo: turma.ano_letivo,
        },
        responsavel,
        valorMensalidade,
        numeroContrato,
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'Erro ao carregar dados do contrato' }
  }
}
