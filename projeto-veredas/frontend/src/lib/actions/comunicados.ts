'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'
import type { Comunicado } from '@/types/entities'

export async function criarComunicado(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const { data: func } = await supabase
      .from('funcionarios').select('id').eq('usuario_id', user?.id).single()

    const titulo = formData.get('titulo') as string
    const corpo = formData.get('corpo') as string
    const dataPublicacao = (formData.get('data_publicacao') as string) || new Date().toISOString().split('T')[0]
    const destinatariosRaw = formData.get('destinatarios') as string // JSON array
    const requerConfirmacao = formData.get('requer_confirmacao') === 'true'

    if (!titulo || !corpo) return { data: null, error: 'Título e corpo são obrigatórios.' }

    // Inserir comunicado
    const { data: comunicado, error: err } = await supabase
      .from('comunicados')
      .insert({
        escola_id: escolaId,
        titulo,
        corpo,
        data_publicacao: dataPublicacao,
        criado_por: func?.id ?? null,
        requer_confirmacao: requerConfirmacao,
      })
      .select('id')
      .single()

    if (err) return { data: null, error: err.message }
    if (!comunicado) return { data: null, error: 'Erro ao criar comunicado' }

    // Inserir destinatários
    if (destinatariosRaw) {
      const destinatarios = JSON.parse(destinatariosRaw) as { tipo: string; turma_id?: string; perfil?: string }[]
      const rows = destinatarios.map((d) => ({
        comunicado_id: comunicado.id,
        tipo: d.tipo,
        turma_id: d.turma_id ?? null,
        perfil: d.perfil ?? null,
      }))
      const { error: err2 } = await supabase.from('comunicado_destinatarios').insert(rows)
      if (err2) return { data: null, error: err2.message }
    }

    revalidatePath('/comunicados')
    return { data: { id: comunicado.id }, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao criar comunicado' }
  }
}

export async function listarComunicados(): Promise<ActionResult<Comunicado[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const perfil = user.app_metadata.perfil as string | undefined

    // Buscar todos os comunicados da escola
    const { data: comunicados, error } = await supabase
      .from('comunicados')
      .select('*, destinatarios:comunicado_destinatarios(*)')
      .order('data_publicacao', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) return { data: null, error: error.message }

    // Buscar leituras do usuário
    const { data: leituras } = await supabase
      .from('comunicado_leitura')
      .select('comunicado_id, lida_em')
      .eq('usuario_id', user.id)

    const leituraMap = new Map((leituras ?? []).map((l) => [l.comunicado_id, l.lida_em]))

    // Filtrar comunicados relevantes para o perfil
    const relevantes = (comunicados ?? []).filter((c) => {
      const dests = (c.destinatarios ?? []) as { tipo: string; perfil?: string }[]
      if (dests.length === 0) return true // sem destinatários = visível a todos
      return dests.some((d) => {
        if (d.tipo === 'toda_escola') return true
        if (d.tipo === 'perfil') return d.perfil === perfil
        return false
      })
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

export async function marcarComunicadoLido(comunicadoId: string): Promise<ActionResult<null>> {
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

// ---- Confirmação de Presença ----

export async function confirmarPresenca(comunicadoId: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const { data: resp } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    if (!resp) return { data: null, error: 'Responsável não encontrado' }

    const { error } = await supabase
      .from('confirmacoes_presenca')
      .upsert(
        { comunicado_id: comunicadoId, responsavel_id: resp.id, confirmado: true },
        { onConflict: 'comunicado_id, responsavel_id' }
      )

    if (error) return { data: null, error: error.message }
    revalidatePath('/responsavel/comunicados')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao confirmar presença' }
  }
}

export async function verificarConfirmacao(comunicadoId: string): Promise<ActionResult<{ confirmado: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const { data: resp } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    if (!resp) return { data: { confirmado: false }, error: null }

    const { data } = await supabase
      .from('confirmacoes_presenca')
      .select('confirmado')
      .eq('comunicado_id', comunicadoId)
      .eq('responsavel_id', resp.id)
      .maybeSingle()

    return { data: { confirmado: data?.confirmado ?? false }, error: null }
  } catch {
    return { data: null, error: 'Erro ao verificar confirmação' }
  }
}

export async function getConfirmadosComunicado(comunicadoId: string): Promise<ActionResult<{
  confirmados: number
  total: number
  lista: { responsavel_nome: string; confirmado: boolean }[]
}>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    // Buscar todas as confirmações
    const { data: confirmacoes } = await supabase
      .from('confirmacoes_presenca')
      .select('confirmado, responsavel_id, responsaveis!inner(nome_completo)')
      .eq('comunicado_id', comunicadoId)

    const lista = (confirmacoes ?? []).map((c) => ({
      responsavel_nome: (c.responsaveis as unknown as { nome_completo: string }).nome_completo,
      confirmado: c.confirmado,
    }))

    return {
      data: {
        confirmados: lista.filter((l) => l.confirmado).length,
        total: lista.length,
        lista,
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'Erro ao carregar confirmações' }
  }
}
