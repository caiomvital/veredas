import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const ESCOLA_SLUG_COOKIE = 'escola_slug'

/**
 * Extrai o subdomínio do host da requisição.
 *
 * @returns slug do subdomínio, null se for domínio raiz, ou '__localhost__' se for localhost
 */
export function extractSubdomain(host: string): string | null {
  if (!host) return null
  host = host.split(':')[0] // remove port
  if (host === 'localhost' || host === '127.0.0.1') return '__localhost__'

  const parts = host.split('.').filter(Boolean)
  let idx = 0
  if (parts[0] === 'www') idx = 1

  // Domínio conhecido: projetoveredas.com.br → 3 partes sem subdomínio
  const isKnownApex = host.endsWith('projetoveredas.com.br')

  if (isKnownApex && parts.length - idx > 3) {
    return parts[idx]
  }

  // Para domínios genéricos (.com, .org, etc), apex = 2 partes
  if (!isKnownApex && parts.length - idx > 2) {
    return parts[idx]
  }

  return null // domínio raiz, sem subdomínio
}

/**
 * Retorna o slug da escola baseado no subdomínio ou cookie.
 * Usado em server components para definir qual escola carregar.
 */
export async function getEscolaSlugFromRequest(): Promise<string> {
  const cookieStore = await cookies()
  const cookieSlug = cookieStore.get(ESCOLA_SLUG_COOKIE)?.value

  if (cookieSlug) return cookieSlug

  // fallback para variável de ambiente
  return process.env.NEXT_PUBLIC_SCHOOL_ID ?? 'escola-teste'
}

/**
 * Busca configurações completas da escola a partir de um slug.
 */
export async function getEscolaBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('escolas')
    .select('*')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (error || !data) return null
  return data as unknown as Record<string, unknown>
}
