'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'

export interface FotoEscola {
  id: string
  escola_id: string
  url: string
  legenda: string
  ordem: number
  ativo: boolean
  created_at: string
  updated_at: string
}

async function ensureBucket() {
  try {
    const admin = createAdminClient()
    const { data: buckets } = await admin.storage.listBuckets()
    if (!buckets?.find((b) => b.name === 'fotos')) {
      await admin.storage.createBucket('fotos', { public: true })
    }
  } catch {
    // Bucket já existe ou não foi possível criar — continua
  }
}

export async function listarFotos(): Promise<ActionResult<FotoEscola[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const { data, error } = await supabase
      .from('fotos_escola')
      .select('*')
      .eq('escola_id', escolaId)
      .eq('ativo', true)
      .order('ordem')

    if (error) return { data: null, error: error.message }
    return { data: data as unknown as FotoEscola[], error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar fotos' }
  }
}

export async function uploadFoto(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    // Verificar limite de 20 fotos
    const { count } = await supabase
      .from('fotos_escola')
      .select('*', { count: 'exact', head: true })
      .eq('escola_id', escolaId)
      .eq('ativo', true)

    if (count && count >= 20) {
      return { data: null, error: 'Limite máximo de 20 fotos atingido. Remova algumas antes de adicionar novas.' }
    }

    const file = formData.get('file') as File
    const legenda = (formData.get('legenda') as string) || ''

    if (!file || file.size === 0) return { data: null, error: 'Arquivo não enviado' }

    // Garantir bucket existe
    await ensureBucket()

    // Upload para Storage
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `escola_${escolaId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('fotos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) return { data: null, error: `Erro no upload: ${uploadError.message}` }

    // URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('fotos')
      .getPublicUrl(fileName)

    // Próxima ordem
    const { data: last } = await supabase
      .from('fotos_escola')
      .select('ordem')
      .eq('escola_id', escolaId)
      .order('ordem', { ascending: false })
      .limit(1)

    const nextOrdem = (last && last.length > 0 ? (last[0] as { ordem: number }).ordem : 0) + 1

    const { error: insertError } = await supabase.from('fotos_escola').insert({
      escola_id: escolaId,
      url: publicUrl,
      legenda,
      ordem: nextOrdem,
    })

    if (insertError) return { data: null, error: insertError.message }

    revalidatePath('/app/admin/fotos')
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: 'Erro ao fazer upload' }
  }
}

export async function excluirFoto(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('fotos_escola').update({ ativo: false }).eq('id', id)
    if (error) return { data: null, error: error.message }

    revalidatePath('/app/admin/fotos')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao excluir foto' }
  }
}

export async function reordenarFotos(ids: string[]): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const updates = ids.map((id, index) =>
      supabase.from('fotos_escola').update({ ordem: index + 1 }).eq('id', id)
    )
    await Promise.all(updates)

    revalidatePath('/app/admin/fotos')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao reordenar fotos' }
  }
}
