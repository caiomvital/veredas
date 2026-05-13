'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

export interface AniversarianteAluno {
  id: string
  nome_completo: string
  data_nascimento: string
  turma_codigo: string | null
  turma_serie: string | null
}

export interface AniversarianteFuncionario {
  id: string
  nome_completo: string
  data_nascimento: string
  cargo: string
}

export interface AniversariantesMes {
  alunos: AniversarianteAluno[]
  funcionarios: AniversarianteFuncionario[]
}

export interface AniversariantesHoje {
  total: number
  alunos: AniversarianteAluno[]
  funcionarios: AniversarianteFuncionario[]
}

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date()
  const nasc = new Date(dataNascimento + 'T12:00:00')
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const mesAtual = hoje.getMonth() + 1
  const diaAtual = hoje.getDate()
  const mesNasc = nasc.getMonth() + 1
  const diaNasc = nasc.getDate()
  if (mesAtual < mesNasc || (mesAtual === mesNasc && diaAtual < diaNasc)) {
    idade--
  }
  return idade
}

export async function getAniversariantesMes(
  mes: number,
  ano: number
): Promise<ActionResult<AniversariantesMes>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const mesStr = String(mes).padStart(2, '0')

    // Alunos ativos com aniversário no mês
    const { data: alunos, error: err1 } = await supabase
      .from('alunos')
      .select(`
        id, nome_completo, data_nascimento,
        matriculas!left(
          status,
          turmas!left(codigo, serie)
        )
      `)
      .eq('escola_id', escolaId)
      .eq('status', 'ativo')
      .filter('data_nascimento', 'like', `%-${mesStr}-%`)
      .order('data_nascimento')

    if (err1) return { data: null, error: err1.message }

    // Funcionários ativos com aniversário no mês
    const { data: funcionarios, error: err2 } = await supabase
      .from('funcionarios')
      .select('id, nome_completo, data_nascimento, cargo')
      .eq('escola_id', escolaId)
      .eq('ativo', true)
      .filter('data_nascimento', 'like', `%-${mesStr}-%`)
      .order('data_nascimento')

    if (err2) return { data: null, error: err2.message }

    const alunosMapped: AniversarianteAluno[] = (alunos ?? []).map((a) => {
      const matriculas = (a.matriculas as Record<string, unknown>[] | undefined) ?? []
      const matriculaAtiva = matriculas.find((m) => m.status === 'ativa')
      const turma = matriculaAtiva?.turmas as Record<string, unknown> | null | undefined
      return {
        id: a.id,
        nome_completo: a.nome_completo,
        data_nascimento: a.data_nascimento,
        turma_codigo: (turma?.codigo as string) ?? null,
        turma_serie: (turma?.serie as string) ?? null,
      }
    })

    const funcsMapped: AniversarianteFuncionario[] = (funcionarios ?? []).map((f) => ({
      id: f.id,
      nome_completo: f.nome_completo,
      data_nascimento: f.data_nascimento,
      cargo: f.cargo,
    }))

    return { data: { alunos: alunosMapped, funcionarios: funcsMapped }, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar aniversariantes' }
  }
}

export async function getAniversariantesHoje(): Promise<ActionResult<AniversariantesHoje>> {
  try {
    const hoje = new Date()
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const dia = String(hoje.getDate()).padStart(2, '0')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    // Alunos que fazem aniversário hoje
    const { data: alunos, error: err1 } = await supabase
      .from('alunos')
      .select(`
        id, nome_completo, data_nascimento,
        matriculas!left(
          status,
          turmas!left(codigo, serie)
        )
      `)
      .eq('escola_id', escolaId)
      .eq('status', 'ativo')
      .filter('data_nascimento', 'like', `%-${mes}-${dia}`)
      .order('nome_completo')

    if (err1) return { data: null, error: err1.message }

    // Funcionários que fazem aniversário hoje
    const { data: funcionarios, error: err2 } = await supabase
      .from('funcionarios')
      .select('id, nome_completo, data_nascimento, cargo')
      .eq('escola_id', escolaId)
      .eq('ativo', true)
      .filter('data_nascimento', 'like', `%-${mes}-${dia}`)
      .order('nome_completo')

    if (err2) return { data: null, error: err2.message }

    const alunosMapped: AniversarianteAluno[] = (alunos ?? []).map((a) => {
      const matriculas = (a.matriculas as Record<string, unknown>[] | undefined) ?? []
      const matriculaAtiva = matriculas.find((m) => m.status === 'ativa')
      const turma = matriculaAtiva?.turmas as Record<string, unknown> | null | undefined
      return {
        id: a.id,
        nome_completo: a.nome_completo,
        data_nascimento: a.data_nascimento,
        turma_codigo: (turma?.codigo as string) ?? null,
        turma_serie: (turma?.serie as string) ?? null,
      }
    })

    const funcsMapped: AniversarianteFuncionario[] = (funcionarios ?? []).map((f) => ({
      id: f.id,
      nome_completo: f.nome_completo,
      data_nascimento: f.data_nascimento,
      cargo: f.cargo,
    }))

    return {
      data: {
        total: alunosMapped.length + funcsMapped.length,
        alunos: alunosMapped,
        funcionarios: funcsMapped,
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'Erro ao carregar aniversariantes de hoje' }
  }
}
