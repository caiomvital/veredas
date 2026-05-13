'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'

export interface MeusDadosData {
  id: string
  nome_completo: string
  email: string
  telefone: string | null
  profissao: string | null
  alunos: { id: string; nome_completo: string; endereco: Record<string, unknown> }[]
}

export async function getMeusDados(): Promise<ActionResult<MeusDadosData>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const { data: resp } = await supabase
      .from('responsaveis')
      .select('id, nome_completo, email, telefone, profissao')
      .eq('usuario_id', user.id)
      .single()

    if (!resp) return { data: null, error: 'Responsável não encontrado' }

    const { data: vinculos } = await supabase
      .from('aluno_responsavel')
      .select('aluno_id, alunos!inner(id, nome_completo, endereco)')
      .eq('responsavel_id', resp.id)

    const alunos = (vinculos ?? []).map((v) => {
      const a = v.alunos as unknown as { id: string; nome_completo: string; endereco: Record<string, unknown> }
      return { id: a.id, nome_completo: a.nome_completo, endereco: a.endereco ?? {} }
    })

    return {
      data: {
        id: resp.id,
        nome_completo: resp.nome_completo,
        email: resp.email,
        telefone: resp.telefone,
        profissao: resp.profissao,
        alunos,
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'Erro ao carregar dados' }
  }
}

export async function salvarMeusDados(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Não autenticado' }

    const telefone = formData.get('telefone') as string
    const profissao = formData.get('profissao') as string

    const { error } = await supabase
      .from('responsaveis')
      .update({ telefone: telefone || null, profissao: profissao || null })
      .eq('usuario_id', user.id)

    if (error) return { data: null, error: error.message }

    // Atualizar endereços dos alunos
    const alunoIds = (formData.getAll('aluno_id') as string[]).filter(Boolean)
    for (const alunoId of alunoIds) {
      const alunoEndereco: Record<string, string> = {}
      for (const campo of ['rua', 'numero', 'bairro', 'cidade', 'uf', 'cep']) {
        const val = formData.get(`endereco_${alunoId}_${campo}`) as string
        if (val) alunoEndereco[campo] = val
      }
      if (Object.keys(alunoEndereco).length > 0) {
        // Merge com endereço existente
        const { data: current } = await supabase.from('alunos').select('endereco').eq('id', alunoId).single()
        const merged = { ...(current?.endereco as Record<string, unknown> ?? {}), ...alunoEndereco }
        await supabase.from('alunos').update({ endereco: merged }).eq('id', alunoId)
      }
    }

    revalidatePath('/app/responsavel/meus-dados')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao salvar dados' }
  }
}
