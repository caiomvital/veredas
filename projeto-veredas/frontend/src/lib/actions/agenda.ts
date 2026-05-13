'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'
import type { AgendaRegistro, AgendaTipo } from '@/types/entities'

// ───── Listar alunos de uma turma com dados da agenda ─────

export interface AlunoAgendaResumo {
  id: string
  nome_completo: string
  tem_resposta_nao_lida: boolean
}

export async function listarAlunosPorTurma(turmaId: string): Promise<ActionResult<AlunoAgendaResumo[]>> {
  try {
    const supabase = await createClient()
    const { data: matriculas, error } = await supabase
      .from('matriculas')
      .select('aluno_id, alunos!inner(id, nome_completo)')
      .eq('turma_id', turmaId)
      .eq('status', 'ativa')

    if (error) return { data: null, error: error.message }

    const result: AlunoAgendaResumo[] = []

    for (const m of matriculas) {
      const aluno = m.alunos as unknown as { id: string; nome_completo: string }

      const { count } = await supabase
        .from('agenda_registros')
        .select('*', { count: 'exact', head: true })
        .eq('aluno_id', aluno.id)
        .eq('tipo', 'resposta_responsavel')
        .eq('lido_professor', false)

      result.push({
        id: aluno.id,
        nome_completo: aluno.nome_completo,
        tem_resposta_nao_lida: (count ?? 0) > 0,
      })
    }

    return { data: result, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar alunos' }
  }
}

// ───── Listar registros da agenda de um aluno (com dados do autor) ─────

export interface AgendaRegistroDetalhado extends AgendaRegistro {
  autor_nome: string
  autor_perfil: string
}

export async function listarAgendaDetalhada(alunoId: string): Promise<ActionResult<AgendaRegistroDetalhado[]>> {
  try {
    const supabase = await createClient()
    const { data: registros, error } = await supabase
      .from('agenda_registros')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('data_registro', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) return { data: null, error: error.message }
    if (!registros || registros.length === 0) return { data: [], error: null }

    const autorIds = [...new Set(registros.map((r) => r.autor_id))]

    const [funcData, respData] = await Promise.all([
      supabase.from('funcionarios').select('id, nome_completo').in('id', autorIds),
      supabase.from('responsaveis').select('id, nome_completo').in('id', autorIds),
    ])

    const autorMap = new Map<string, { nome: string; perfil: string }>()
    for (const f of funcData.data ?? []) autorMap.set(f.id, { nome: f.nome_completo, perfil: 'funcionario' })
    for (const r of respData.data ?? []) autorMap.set(r.id, { nome: r.nome_completo, perfil: 'responsavel' })

    const detalhado = registros.map((r) => {
      const autor = autorMap.get(r.autor_id)
      return {
        ...r,
        autor_nome: autor?.nome ?? 'Desconhecido',
        autor_perfil: autor?.perfil ?? 'desconhecido',
      }
    })

    return { data: detalhado, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar agenda' }
  }
}

// ───── Listar registros (simplificado, sem dados do autor) ─────

export async function listarAgenda(alunoId: string): Promise<ActionResult<AgendaRegistro[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('agenda_registros')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('data_registro', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) return { data: null, error: error.message }
    return { data: data as unknown as AgendaRegistro[], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar agenda' }
  }
}

// ───── Criar registro (professor) ─────

export async function criarRegistro(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const { data: func } = await supabase
      .from('funcionarios')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    if (!func) return { data: null, error: 'Perfil não autorizado' }

    const dados = {
      escola_id: escolaId,
      aluno_id: formData.get('aluno_id') as string,
      autor_id: func.id,
      tipo: formData.get('tipo') as AgendaTipo,
      conteudo: formData.get('conteudo') as string,
      data_registro: (formData.get('data_registro') as string) || new Date().toISOString().split('T')[0],
    }

    const { error } = await supabase.from('agenda_registros').insert(dados)
    if (error) return { data: null, error: error.message }

    revalidatePath(`/professor/agenda/${dados.aluno_id}`)
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao criar registro' }
  }
}

// ───── Responsável: responder ─────

export async function responderAgenda(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const { data: resp } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    if (!resp) return { data: null, error: 'Perfil não autorizado' }

    const dados = {
      escola_id: escolaId,
      aluno_id: formData.get('aluno_id') as string,
      autor_id: resp.id,
      tipo: 'resposta_responsavel' as AgendaTipo,
      conteudo: formData.get('conteudo') as string,
      data_registro: new Date().toISOString().split('T')[0],
    }

    const { error } = await supabase.from('agenda_registros').insert(dados)
    if (error) return { data: null, error: error.message }

    revalidatePath('/responsavel/agenda')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao responder' }
  }
}

// ───── Marcar como lido ─────

export async function marcarLido(alunoId: string, perfil: 'responsavel' | 'professor'): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const campo = perfil === 'responsavel' ? 'lido_responsavel' : 'lido_professor'

    const { error } = await supabase
      .from('agenda_registros')
      .update({ [campo]: true })
      .eq('aluno_id', alunoId)
      .eq(campo, false)

    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao marcar como lido' }
  }
}

// ───── Contar não lidos (professor: respostas não lidas) ─────

export async function contarNaoLidosProfessor(): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: 0, error: null }

    const { data: func } = await supabase
      .from('funcionarios')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    if (!func) return { data: 0, error: null }

    const { count, error } = await supabase
      .from('agenda_registros')
      .select('*', { count: 'exact', head: true })
      .eq('tipo', 'resposta_responsavel')
      .eq('lido_professor', false)

    if (error) return { data: 0, error: null }
    return { data: count ?? 0, error: null }
  } catch {
    return { data: 0, error: null }
  }
}

// ───── Contar não lidos (responsável) ─────

export async function contarNaoLidosResponsavel(): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: 0, error: null }

    const { data: resp } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    if (!resp) return { data: 0, error: null }

    const { data: vinculos } = await supabase
      .from('aluno_responsavel')
      .select('aluno_id')
      .eq('responsavel_id', resp.id)

    if (!vinculos || vinculos.length === 0) return { data: 0, error: null }

    const alunoIds = vinculos.map((v) => v.aluno_id)

    const { count, error } = await supabase
      .from('agenda_registros')
      .select('*', { count: 'exact', head: true })
      .in('aluno_id', alunoIds)
      .neq('tipo', 'resposta_responsavel')
      .eq('lido_responsavel', false)

    if (error) return { data: 0, error: null }
    return { data: count ?? 0, error: null }
  } catch {
    return { data: 0, error: null }
  }
}

// ───── Coordenação: listar alunos com último registro ─────

export interface AlunoComUltimoRegistro {
  id: string
  nome_completo: string
  matricula: string
  turma_nome: string
  ultimo_registro: string | null
  ultima_data: string | null
  autor_nome: string | null
}

export async function listarAgendaCoordenacao(turmaId?: string): Promise<ActionResult<AlunoComUltimoRegistro[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('matriculas')
      .select(`
        aluno_id,
        alunos!inner(id, nome_completo, matricula),
        turmas!inner(id, codigo, serie)
      `)
      .eq('status', 'ativa')

    if (turmaId) query = query.eq('turma_id', turmaId)

    const { data: matriculas, error } = await query
    if (error) return { data: null, error: error.message }

    const result: AlunoComUltimoRegistro[] = []

    for (const m of matriculas) {
      const aluno = m.alunos as unknown as { id: string; nome_completo: string; matricula: string }
      const turma = m.turmas as unknown as { codigo: string; serie: string }

      const { data: ultimo } = await supabase
        .from('agenda_registros')
        .select('conteudo, data_registro, autor_id')
        .eq('aluno_id', aluno.id)
        .order('data_registro', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)

      result.push({
        id: aluno.id,
        nome_completo: aluno.nome_completo,
        matricula: aluno.matricula,
        turma_nome: `${turma.serie} - ${turma.codigo}`,
        ultimo_registro: ultimo?.[0]?.conteudo ?? null,
        ultima_data: ultimo?.[0]?.data_registro ?? null,
        autor_nome: null, // nome do autor pode ser resolvido no client se necessário
      })
    }

    return { data: result, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar agenda' }
  }
}
