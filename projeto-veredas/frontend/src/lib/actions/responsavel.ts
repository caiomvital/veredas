'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'
import type { Aluno, Frequencia, Nota, Comunicado, EventoCalendario } from '@/types/entities'

export interface AlunoResponsavelView {
  id: string
  matricula: string
  nome_completo: string
  data_nascimento: string
  turma_codigo: string
  turma_serie: string
  turma_turno: string
}

export async function getAlunosDoResponsavel(): Promise<ActionResult<AlunoResponsavelView[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    // Buscar responsavel pelo usuario_id
    const { data: resp } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    if (!resp) return { data: null, error: 'Responsável não encontrado' }

    // Buscar alunos vinculados com turma atual
    const { data: vinculos } = await supabase
      .from('aluno_responsavel')
      .select(`
        aluno_id,
        alunos!inner(id, matricula, nome_completo, data_nascimento)
      `)
      .eq('responsavel_id', resp.id)

    if (!vinculos || vinculos.length === 0) return { data: [], error: null }

    const alunoIds = vinculos.map((v) => v.aluno_id)

    // Buscar matrícula ativa de cada aluno
    const { data: matriculas } = await supabase
      .from('matriculas')
      .select(`
        aluno_id,
        turmas!inner(codigo, serie, turno)
      `)
      .in('aluno_id', alunoIds)
      .eq('status', 'ativa')

    const turmaMap = new Map((matriculas ?? []).map((m) => [m.aluno_id, m.turmas as unknown as { codigo: string; serie: string; turno: string }]))

    const alunos: AlunoResponsavelView[] = vinculos.map((v) => {
      const aluno = v.alunos as unknown as { id: string; matricula: string; nome_completo: string; data_nascimento: string }
      const turma = turmaMap.get(aluno.id)
      return {
        id: aluno.id,
        matricula: aluno.matricula,
        nome_completo: aluno.nome_completo,
        data_nascimento: aluno.data_nascimento,
        turma_codigo: turma?.codigo ?? '—',
        turma_serie: turma?.serie ?? '—',
        turma_turno: turma?.turno ?? '—',
      }
    })

    return { data: alunos, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar alunos' }
  }
}

export async function getFrequenciasAluno(alunoId: string): Promise<ActionResult<(Frequencia & { disciplina_nome: string })[]>> {
  try {
    const supabase = await createClient()
    const { data: mat } = await supabase
      .from('matriculas').select('id').eq('aluno_id', alunoId).eq('status', 'ativa').single()
    if (!mat) return { data: [], error: null }

    const { data: frequencias } = await supabase
      .from('frequencias')
      .select('*, turma_disciplina_professor!inner(disciplina_id, disciplinas!inner(nome))')
      .eq('matricula_id', mat.id)

    if (!frequencias) return { data: [], error: null }

    const result = frequencias.map((f) => {
      const tdp = f.turma_disciplina_professor as unknown as { disciplina_id: string; disciplinas: { nome: string } }
      return { ...f, disciplina_nome: tdp?.disciplinas?.nome ?? '—' } as Frequencia & { disciplina_nome: string }
    })

    return { data: result, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar frequências' }
  }
}

export async function getNotasAluno(alunoId: string): Promise<ActionResult<(Nota & { disciplina_nome?: string })[]>> {
  try {
    const supabase = await createClient()
    const { data: mat } = await supabase
      .from('matriculas').select('id').eq('aluno_id', alunoId).eq('status', 'ativa').single()
    if (!mat) return { data: [], error: null }

    const { data: notasData } = await supabase
      .from('notas')
      .select('*, turma_disciplina_professor!inner(disciplina_id, disciplinas!inner(nome))')
      .eq('matricula_id', mat.id)

    if (!notasData) return { data: [], error: null }
    return {
      data: notasData.map((n) => {
        const tdp = n.turma_disciplina_professor as unknown as { disciplina_id: string; disciplinas: { nome: string } }
        return { ...n, disciplina_nome: tdp?.disciplinas?.nome ?? '—' } as Nota & { disciplina_nome?: string }
      }),
      error: null,
    }
  } catch {
    return { data: null, error: 'Erro ao carregar notas' }
  }
}

export async function getComunicadosResponsavel(): Promise<ActionResult<Comunicado[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const { data: comunicados, error } = await supabase
      .from('comunicados')
      .select('*, destinatarios:comunicado_destinatarios(*)')
      .order('data_publicacao', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) return { data: null, error: error.message }

    const { data: leituras } = await supabase
      .from('comunicado_leitura')
      .select('comunicado_id, lida_em')
      .eq('usuario_id', user.id)

    const leituraMap = new Map((leituras ?? []).map((l) => [l.comunicado_id, l.lida_em]))

    // Filtra: toda_escola ou sem destinatários (visível a todos)
    const relevantes = (comunicados ?? []).filter((c) => {
      const dests = (c.destinatarios ?? []) as { tipo: string }[]
      if (dests.length === 0) return true
      return dests.some((d) => d.tipo === 'toda_escola')
    })

    const result: Comunicado[] = relevantes.map((c) => ({
      id: c.id,
      escola_id: c.escola_id,
      titulo: c.titulo,
      corpo: c.corpo,
      data_publicacao: c.data_publicacao,
      criado_por: c.criado_por,
      created_at: c.created_at,
      updated_at: c.updated_at ?? c.created_at,
      destinatarios: c.destinatarios ?? [],
      lida: leituraMap.has(c.id),
      lida_em: leituraMap.get(c.id) ?? null,
      requer_confirmacao: (c as any).requer_confirmacao ?? false,
    }))

    return { data: result, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar comunicados' }
  }
}

export async function marcarComunicadoLidoResponsavel(comunicadoId: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const { error } = await supabase.from('comunicado_leitura').upsert(
      { comunicado_id: comunicadoId, usuario_id: user.id, lida_em: new Date().toISOString() },
      { onConflict: 'comunicado_id, usuario_id' }
    )

    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao marcar como lido' }
  }
}

export async function getEventosCalendario(params?: {
  mes?: number
  ano?: number
}): Promise<ActionResult<EventoCalendario[]>> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('eventos_calendario')
      .select('*')
      .order('data_inicio', { ascending: true })

    if (params?.mes && params?.ano) {
      const start = `${params.ano}-${String(params.mes).padStart(2, '0')}-01`
      const date = new Date(params.ano, params.mes, 0)
      const end = `${params.ano}-${String(params.mes).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      query = query.gte('data_inicio', start).lte('data_inicio', end)
    }

    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data: data as EventoCalendario[], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar eventos' }
  }
}

export async function getBoletimAluno(alunoId: string): Promise<ActionResult<{
  disciplinas: { nome: string; notas: Nota[]; media: number }[]
  totalFaltas: number
  totalAulas: number
}>> {
  try {
    const supabase = await createClient()
    const { data: mat } = await supabase
      .from('matriculas').select('id').eq('aluno_id', alunoId).eq('status', 'ativa').single()
    if (!mat) return { data: null, error: 'Aluno sem matrícula ativa' }

    // Buscar notas com disciplina
    const { data: notasData } = await supabase
      .from('notas')
      .select('*, turma_disciplina_professor!inner(disciplina_id, disciplinas!inner(nome))')
      .eq('matricula_id', mat.id)

    // Buscar frequências
    const { data: frequencias } = await supabase
      .from('frequencias')
      .select('presenca')
      .eq('matricula_id', mat.id)

    // Agrupar notas por disciplina
    const disciplinaMap = new Map<string, { nome: string; notas: Nota[] }>()
    for (const n of (notasData ?? [])) {
      const tdp = n.turma_disciplina_professor as unknown as { disciplina_id: string; disciplinas: { nome: string } }
      const discId = tdp?.disciplina_id ?? 'unknown'
      const discNome = tdp?.disciplinas?.nome ?? '—'
      if (!disciplinaMap.has(discId)) {
        disciplinaMap.set(discId, { nome: discNome, notas: [] })
      }
      disciplinaMap.get(discId)!.notas.push(n as Nota)
    }

    const disciplinas = Array.from(disciplinaMap.values()).map((d) => {
      const valores = d.notas.filter((n) => n.tipo !== 'media_final').map((n) => n.valor)
      const media = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0
      return { ...d, media: Math.round(media * 10) / 10 }
    })

    const totalAulas = frequencias?.length ?? 0
    const totalFaltas = frequencias?.filter((f) => !f.presenca).length ?? 0

    return { data: { disciplinas, totalFaltas, totalAulas }, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar boletim' }
  }
}
