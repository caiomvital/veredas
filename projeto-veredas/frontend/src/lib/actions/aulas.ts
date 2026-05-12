'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'

// ---- Registro de Aulas ----

export async function listarRegistroAulas(turmaDisciplinaId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('registro_aulas')
      .select('*')
      .eq('turma_disciplina_id', turmaDisciplinaId)
      .order('data_aula', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: data ?? [], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar registros' }
  }
}

export async function criarRegistroAula(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const dados = {
      turma_disciplina_id: formData.get('turma_disciplina_id') as string,
      data_aula: formData.get('data_aula') as string,
      conteudo: formData.get('conteudo') as string,
      observacoes: (formData.get('observacoes') as string) || null,
      carga_horaria_minutos: parseInt(formData.get('carga_horaria_minutos') as string) || 50,
    }
    const { error } = await supabase.from('registro_aulas').insert(dados)
    if (error) return { data: null, error: error.message }
    revalidatePath('/professor/registro-aulas')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao registrar aula' }
  }
}

export async function getRegistroAula(id: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('registro_aulas').select('*').eq('id', id).single()
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar registro' }
  }
}

export async function atualizarRegistroAula(id: string, formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const dados = {
      conteudo: formData.get('conteudo') as string,
      observacoes: (formData.get('observacoes') as string) || null,
      carga_horaria_minutos: parseInt(formData.get('carga_horaria_minutos') as string) || 50,
    }
    const { error } = await supabase.from('registro_aulas').update(dados).eq('id', id)
    if (error) return { data: null, error: error.message }
    revalidatePath('/professor/registro-aulas')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao atualizar registro' }
  }
}

// ---- Atividades de Casa ----

export async function listarAtividades(turmaDisciplinaId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('atividades_casa')
      .select('*')
      .eq('turma_disciplina_id', turmaDisciplinaId)
      .order('data_entrega', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: data ?? [], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar atividades' }
  }
}

export async function criarAtividade(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const dados = {
      turma_disciplina_id: formData.get('turma_disciplina_id') as string,
      titulo: formData.get('titulo') as string,
      descricao: formData.get('descricao') as string,
      data_atribuicao: formData.get('data_atribuicao') as string || new Date().toISOString().split('T')[0],
      data_entrega: formData.get('data_entrega') as string,
    }
    const { error } = await supabase.from('atividades_casa').insert(dados)
    if (error) return { data: null, error: error.message }
    revalidatePath('/professor/atividades')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao criar atividade' }
  }
}

export async function getAtividade(id: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('atividades_casa').select('*').eq('id', id).single()
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar atividade' }
  }
}

export async function atualizarAtividade(id: string, formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const dados = {
      titulo: formData.get('titulo') as string,
      descricao: formData.get('descricao') as string,
      data_entrega: formData.get('data_entrega') as string,
    }
    const { error } = await supabase.from('atividades_casa').update(dados).eq('id', id)
    if (error) return { data: null, error: error.message }
    revalidatePath('/professor/atividades')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao atualizar atividade' }
  }
}

export async function excluirAtividade(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('atividades_casa').delete().eq('id', id)
    if (error) return { data: null, error: error.message }
    revalidatePath('/professor/atividades')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao excluir atividade' }
  }
}

export async function getEntregas(atividadeId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('atividade_casa_entrega')
      .select('*')
      .eq('atividade_id', atividadeId)
    if (error) return { data: null, error: error.message }
    return { data: data ?? [], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar entregas' }
  }
}

export async function registrarEntrega(atividadeId: string, matriculaId: string, entregue: boolean, observacao?: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('atividade_casa_entrega').upsert({
      atividade_id: atividadeId,
      matricula_id: matriculaId,
      entregue,
      data_entrega: entregue ? new Date().toISOString() : null,
      observacao_professor: observacao ?? null,
    }, { onConflict: 'atividade_id, matricula_id' })
    if (error) return { data: null, error: error.message }
    revalidatePath('/professor/atividades')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao registrar entrega' }
  }
}

// ---- Planejamento de Aula ----

export async function listarPlanejamentos(turmaDisciplinaId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('planejamento_aulas')
      .select('*')
      .eq('turma_disciplina_id', turmaDisciplinaId)
      .order('semana_inicio', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: data ?? [], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar planejamentos' }
  }
}

export async function criarPlanejamento(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const dados = {
      turma_disciplina_id: formData.get('turma_disciplina_id') as string,
      periodo_id: formData.get('periodo_id') as string,
      semana_inicio: formData.get('semana_inicio') as string,
      objetivos: (formData.get('objetivos') as string) || null,
      conteudo_planejado: formData.get('conteudo_planejado') as string,
      metodologia: (formData.get('metodologia') as string) || null,
      recursos: (formData.get('recursos') as string) || null,
    }
    const { error } = await supabase.from('planejamento_aulas').insert(dados)
    if (error) return { data: null, error: error.message }
    revalidatePath('/professor/planejamento')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao criar planejamento' }
  }
}

export async function getPlanejamento(id: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('planejamento_aulas').select('*').eq('id', id).single()
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar planejamento' }
  }
}

export async function atualizarPlanejamento(id: string, formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const dados = {
      periodo_id: formData.get('periodo_id') as string,
      semana_inicio: formData.get('semana_inicio') as string,
      objetivos: (formData.get('objetivos') as string) || null,
      conteudo_planejado: formData.get('conteudo_planejado') as string,
      metodologia: (formData.get('metodologia') as string) || null,
      recursos: (formData.get('recursos') as string) || null,
    }
    const { error } = await supabase.from('planejamento_aulas').update(dados).eq('id', id)
    if (error) return { data: null, error: error.message }
    revalidatePath('/professor/planejamento')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao atualizar planejamento' }
  }
}

export async function excluirPlanejamento(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('planejamento_aulas').delete().eq('id', id)
    if (error) return { data: null, error: error.message }
    revalidatePath('/professor/planejamento')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao excluir planejamento' }
  }
}

// ---- Diários de Classe ----

export async function getDiario(id: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('diarios_classe').select('*').eq('id', id).single()
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar diário' }
  }
}

export async function listarDiarios(params?: { turma_disciplina_id?: string }) {
  try {
    const supabase = await createClient()
    let query = supabase.from('diarios_classe').select('*').order('data_geracao', { ascending: false })
    if (params?.turma_disciplina_id) query = query.eq('turma_disciplina_id', params.turma_disciplina_id)
    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data: data ?? [], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar diários' }
  }
}

export async function listarDiariosCoordenador() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('diarios_classe')
      .select('*')
      .order('data_geracao', { ascending: false })

    if (error) return { data: null, error: error.message }

    // Enrich with turma/disciplina info
    const tdpIds = [...new Set((data ?? []).map((d: Record<string, unknown>) => d.turma_disciplina_id as string))]
    const periodoIds = [...new Set((data ?? []).map((d: Record<string, unknown>) => d.periodo_id as string))]

    const [tdpRes, perRes] = await Promise.all([
      supabase.from('turma_disciplina_professor').select('id, turma_id, disciplina_id').in('id', tdpIds),
      supabase.from('periodos_letivos').select('id, nome').in('id', periodoIds),
    ])

    const turmaIds = [...new Set((tdpRes.data ?? []).map((t: Record<string, unknown>) => t.turma_id as string))]
    const discIds = [...new Set((tdpRes.data ?? []).map((t: Record<string, unknown>) => t.disciplina_id as string))]

    const [turmasRes, discRes] = await Promise.all([
      supabase.from('turmas').select('id, codigo, serie').in('id', turmaIds),
      supabase.from('disciplinas').select('id, nome').in('id', discIds),
    ])

    const turmaMap = new Map((turmasRes.data ?? []).map((t: Record<string, unknown>) => [t.id, t]))
    const discMap = new Map((discRes.data ?? []).map((d: Record<string, unknown>) => [d.id, d]))
    const perMap = new Map((perRes.data ?? []).map((p: Record<string, unknown>) => [p.id, p]))
    const tdpMap = new Map((tdpRes.data ?? []).map((t: Record<string, unknown>) => [t.id, t]))

    const enriched = (data ?? []).map((d: Record<string, unknown>) => {
      const tdp = tdpMap.get(d.turma_disciplina_id as string) as Record<string, unknown> | undefined
      const turma = tdp ? (turmaMap.get(tdp.turma_id as string) as Record<string, unknown> | undefined) : undefined
      const disc = tdp ? (discMap.get(tdp.disciplina_id as string) as Record<string, unknown> | undefined) : undefined
      const per = perMap.get(d.periodo_id as string) as Record<string, unknown> | undefined
      return {
        ...d,
        turma_codigo: (turma?.codigo as string) ?? '',
        turma_serie: (turma?.serie as string) ?? '',
        disciplina_nome: (disc?.nome as string) ?? '',
        periodo_nome: (per?.nome as string) ?? '',
        turma_id: (tdp?.turma_id as string) ?? '',
      }
    })

    return { data: enriched, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar diários' }
  }
}

export async function gerarDiario(turmaDisciplinaId: string, periodoId: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }
    const { data: func } = await supabase.from('funcionarios').select('id').eq('usuario_id', user.id).single()
    if (!func) return { data: null, error: 'Funcionário não encontrado' }

    // Gather all data for the diary
    const [aulasRes, notasRes, freqRes, planejamentoRes] = await Promise.all([
      supabase.from('registro_aulas').select('*').eq('turma_disciplina_id', turmaDisciplinaId).order('data_aula'),
      supabase.from('notas').select('*').eq('turma_disciplina_id', turmaDisciplinaId),
      supabase.from('frequencias').select('*').eq('turma_disciplina_id', turmaDisciplinaId),
      supabase.from('planejamento_aulas').select('*').eq('turma_disciplina_id', turmaDisciplinaId).eq('periodo_id', periodoId),
    ])

    const conteudo = {
      aulas: aulasRes.data ?? [],
      notas: notasRes.data ?? [],
      frequencias: freqRes.data ?? [],
      planejamentos: planejamentoRes.data ?? [],
      gerado_em: new Date().toISOString(),
    }

    const { error } = await supabase.from('diarios_classe').upsert({
      turma_disciplina_id: turmaDisciplinaId,
      periodo_id: periodoId,
      gerado_por: func.id,
      conteudo_json: conteudo as unknown as Record<string, unknown>,
    }, { onConflict: 'turma_disciplina_id, periodo_id' })

    if (error) return { data: null, error: error.message }
    revalidatePath('/professor/diarios')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao gerar diário' }
  }
}
