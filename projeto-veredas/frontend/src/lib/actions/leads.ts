'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from './types'

export async function salvarLead(formData: FormData): Promise<ActionResult<null>> {
  const nome = formData.get('nome') as string
  const escola = formData.get('escola') as string
  const telefone = formData.get('telefone') as string
  const email = formData.get('email') as string

  if (!nome || !escola || !telefone || !email) {
    return { data: null, error: 'Preencha todos os campos.' }
  }

  if (!email.includes('@')) {
    return { data: null, error: 'E-mail inválido.' }
  }

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('leads').insert({ nome, escola, telefone, email } as any)
    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao enviar solicitação.' }
  }
}
