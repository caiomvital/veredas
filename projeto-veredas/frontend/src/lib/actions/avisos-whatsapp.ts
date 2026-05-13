'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'
import type { AvisoWhatsApp } from '@/types/entities'

function formatTelefone(telefone: string | null): string {
  if (!telefone) return ''
  return telefone.replace(/\D/g, '')
}

const ESCOLA_NOME = 'Grupo ZAB de Educação'

// ───── Gerar avisos de falta ─────

export async function gerarAvisosFaltas(): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    // Calcular semana atual (segunda a sexta)
    const hoje = new Date()
    const diaSem = hoje.getDay()
    const diffSeg = diaSem === 0 ? -6 : 1 - diaSem
    const segunda = new Date(hoje)
    segunda.setDate(hoje.getDate() + diffSeg)
    const sexta = new Date(segunda)
    sexta.setDate(segunda.getDate() + 4)

    const segStr = segunda.toISOString().split('T')[0]
    const sexStr = sexta.toISOString().split('T')[0]

    // Buscar alunos com faltas na semana, agrupados por matricula
    const { data: frequencias } = await supabase
      .from('frequencias')
      .select('matricula_id, presenca, matriculas!inner(aluno_id, alunos!inner(nome_completo, id))')
      .gte('data_aula', segStr)
      .lte('data_aula', sexStr)
      .eq('presenca', false)

    if (!frequencias || frequencias.length === 0) return { data: 0, error: null }

    // Agrupar faltas por matricula
    const faltaCount = new Map<string, { count: number; aluno_id: string; aluno_nome: string }>()
    for (const f of frequencias) {
      const matId = f.matricula_id as string
      const mat = f.matriculas as unknown as { aluno_id: string; alunos: { nome_completo: string; id: string } }
      if (!faltaCount.has(matId)) {
        faltaCount.set(matId, { count: 0, aluno_id: mat.aluno_id, aluno_nome: mat.alunos.nome_completo })
      }
      faltaCount.get(matId)!.count++
    }

    // Filtrar quem tem 3+ faltas
    const alertas = Array.from(faltaCount.entries()).filter(([, v]) => v.count >= 3)

    if (alertas.length === 0) return { data: 0, error: null }

    // Buscar responsáveis de cada aluno
    let criados = 0
    for (const [, info] of alertas) {
      const { data: vinculos } = await supabase
        .from('aluno_responsavel')
        .select('responsavel_id, responsaveis!inner(nome_completo, telefone, id)')
        .eq('aluno_id', info.aluno_id)

      if (!vinculos) continue

      for (const v of vinculos) {
        const resp = v.responsaveis as unknown as { nome_completo: string; telefone: string | null; id: string }
        const tel = formatTelefone(resp.telefone)
        if (!tel) continue

        // Verificar se já existe aviso pendente para esta falta
        const { data: existing } = await supabase
          .from('avisos_whatsapp')
          .select('id')
          .eq('tipo', 'falta')
          .eq('aluno_id', info.aluno_id)
          .eq('responsavel_id', resp.id)
          .eq('status', 'pendente')
          .gte('created_at', segStr)
          .maybeSingle()

        if (existing) continue

        const mensagem =
          `Olá, ${resp.nome_completo}! Informamos que ${info.aluno_nome} registrou ${info.count} falta(s) nesta semana no ${ESCOLA_NOME}. Em caso de dúvidas, entre em contato conosco. 😊`

        await supabase.from('avisos_whatsapp').insert({
          escola_id: escolaId,
          tipo: 'falta',
          aluno_id: info.aluno_id,
          responsavel_id: resp.id,
          responsavel_nome: resp.nome_completo,
          responsavel_telefone: tel,
          aluno_nome: info.aluno_nome,
          mensagem,
          metadata: { qtd_faltas: info.count, semana_inicio: segStr },
        })

        criados++
      }
    }

    revalidatePath('/app/secretaria/avisos-whatsapp')
    return { data: criados, error: null }
  } catch {
    return { data: null, error: 'Erro ao gerar avisos de falta' }
  }
}

// ───── Gerar avisos financeiros ─────

export async function gerarAvisosFinanceiro(): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const daqui3dias = new Date(hoje)
    daqui3dias.setDate(hoje.getDate() + 3)

    const hojeStr = hoje.toISOString().split('T')[0]
    const daqui3Str = daqui3dias.toISOString().split('T')[0]

    const { data: lancamentos } = await supabase
      .from('lancamentos_financeiros')
      .select('*, alunos!inner(id, nome_completo)')
      .eq('status', 'pendente')
      .lte('data_vencimento', daqui3Str)

    if (!lancamentos || lancamentos.length === 0) return { data: 0, error: null }

    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

    let criados = 0
    for (const lanc of lancamentos) {
      const aluno = lanc.alunos as unknown as { id: string; nome_completo: string }
      const mesNum = new Date(lanc.data_vencimento + 'T00:00:00').getMonth()
      const mesNome = meses[mesNum]
      const diaVenc = new Date(lanc.data_vencimento + 'T00:00:00').getDate()

      const { data: vinculos } = await supabase
        .from('aluno_responsavel')
        .select('responsavel_id, responsaveis!inner(nome_completo, telefone, id)')
        .eq('aluno_id', aluno.id)

      if (!vinculos) continue

      for (const v of vinculos) {
        const resp = v.responsaveis as unknown as { nome_completo: string; telefone: string | null; id: string }
        const tel = formatTelefone(resp.telefone)
        if (!tel) continue

        const { data: existing } = await supabase
          .from('avisos_whatsapp')
          .select('id')
          .eq('tipo', 'financeiro')
          .eq('aluno_id', aluno.id)
          .eq('responsavel_id', resp.id)
          .eq('status', 'pendente')
          .maybeSingle()

        if (existing) continue

        const mensagem =
          `Olá, ${resp.nome_completo}! Passando para lembrar que a mensalidade de ${mesNome} do(a) ${aluno.nome_completo} vence em ${diaVenc}. Qualquer dúvida, estamos à disposição. 💚`

        await supabase.from('avisos_whatsapp').insert({
          escola_id: escolaId,
          tipo: 'financeiro',
          aluno_id: aluno.id,
          responsavel_id: resp.id,
          responsavel_nome: resp.nome_completo,
          responsavel_telefone: tel,
          aluno_nome: aluno.nome_completo,
          mensagem,
          metadata: { data_vencimento: lanc.data_vencimento, mes: mesNome, valor: lanc.valor },
        })

        criados++
      }
    }

    revalidatePath('/app/secretaria/avisos-whatsapp')
    return { data: criados, error: null }
  } catch {
    return { data: null, error: 'Erro ao gerar avisos financeiros' }
  }
}

// ───── Gerar avisos de comunicado ─────

export async function gerarAvisosComunicado(
  comunicadoId: string,
  tituloComunicado: string,
  turmaIds?: string[]
): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    // Buscar todos os alunos com matrícula ativa
    let query = supabase
      .from('matriculas')
      .select('aluno_id, turma_id, alunos!inner(nome_completo, id)')
      .eq('status', 'ativa')

    let { data: matriculas } = await query
    if (!matriculas || matriculas.length === 0) return { data: 0, error: null }

    // Filtrar por turmas se especificado
    if (turmaIds && turmaIds.length > 0) {
      matriculas = matriculas.filter((m) => turmaIds.includes(m.turma_id))
      if (matriculas.length === 0) return { data: 0, error: null }
    }

    // Buscar responsáveis de cada aluno
    const alunoIds = [...new Set(matriculas.map((m) => m.aluno_id))]

    let criados = 0
    for (const alunoId of alunoIds) {
      const aluno = matriculas.find((m) => m.aluno_id === alunoId)?.alunos as unknown as { nome_completo: string; id: string }

      const { data: vinculos } = await supabase
        .from('aluno_responsavel')
        .select('responsavel_id, responsaveis!inner(nome_completo, telefone, id)')
        .eq('aluno_id', alunoId)

      if (!vinculos) continue

      for (const v of vinculos) {
        const resp = v.responsaveis as unknown as { nome_completo: string; telefone: string | null; id: string }
        const tel = formatTelefone(resp.telefone)
        if (!tel) continue

        const mensagem =
          `Olá, ${resp.nome_completo}! O ${ESCOLA_NOME} publicou um novo comunicado: '${tituloComunicado}'. Acesse o portal para ler na íntegra.`

        await supabase.from('avisos_whatsapp').insert({
          escola_id: escolaId,
          tipo: 'comunicado',
          aluno_id: alunoId,
          responsavel_id: resp.id,
          responsavel_nome: resp.nome_completo,
          responsavel_telefone: tel,
          aluno_nome: aluno?.nome_completo ?? '',
          mensagem,
          metadata: { comunicado_id: comunicadoId, titulo: tituloComunicado },
        })

        criados++
      }
    }

    revalidatePath('/app/secretaria/avisos-whatsapp')
    return { data: criados, error: null }
  } catch {
    return { data: null, error: 'Erro ao gerar avisos de comunicado' }
  }
}

// ───── Listar avisos pendentes ─────

export async function listarAvisosPendentes(): Promise<ActionResult<AvisoWhatsApp[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('avisos_whatsapp')
      .select('*')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })

    if (error) return { data: null, error: error.message }
    return { data: data as AvisoWhatsApp[], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar avisos' }
  }
}

// ───── Contagem de pendentes ─────

export async function getContagemPendentes(): Promise<ActionResult<{
  total: number
  faltas: number
  financeiro: number
  comunicado: number
}>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('avisos_whatsapp')
      .select('tipo')
      .eq('status', 'pendente')

    if (error) return { data: null, error: error.message }

    const faltas = (data ?? []).filter((a) => a.tipo === 'falta').length
    const financeiro = (data ?? []).filter((a) => a.tipo === 'financeiro').length
    const comunicado = (data ?? []).filter((a) => a.tipo === 'comunicado').length

    return {
      data: { total: faltas + financeiro + comunicado, faltas, financeiro, comunicado },
      error: null,
    }
  } catch {
    return { data: null, error: 'Erro ao contar avisos' }
  }
}

// ───── Marcar aviso como enviado ─────

export async function marcarAvisoEnviado(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const { data: func } = await supabase
      .from('funcionarios')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    const { error } = await supabase
      .from('avisos_whatsapp')
      .update({
        status: 'enviado',
        enviado_em: new Date().toISOString(),
        enviado_por: func?.id ?? null,
      })
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    revalidatePath('/app/secretaria/avisos-whatsapp')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao marcar aviso' }
  }
}

// ───── Marcar múltiplos avisos como enviado ─────

export async function marcarAvisosEnviados(ids: string[]): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const { data: func } = await supabase
      .from('funcionarios')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    const { error } = await supabase
      .from('avisos_whatsapp')
      .update({
        status: 'enviado',
        enviado_em: new Date().toISOString(),
        enviado_por: func?.id ?? null,
      })
      .in('id', ids)

    if (error) return { data: null, error: error.message }
    revalidatePath('/app/secretaria/avisos-whatsapp')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao marcar avisos' }
  }
}
