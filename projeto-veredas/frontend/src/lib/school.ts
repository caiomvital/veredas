import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { SchoolConfig } from '@/types/school'

const configCache = new Map<string, { data: SchoolConfig; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function mapRowToConfig(row: Record<string, unknown>): SchoolConfig {
  const iv = row.identidade_visual as Record<string, string>
  const ca = row.config_academica as Record<string, unknown>
  const cf = row.config_frequencia as Record<string, unknown>
  const ma = row.modulos_ativos as Record<string, boolean>

  return {
    id: row.id as string,
    slug: row.slug as string,
    nome: row.nome as string,
    cnpj: row.cnpj as string | null,
    endereco: row.endereco as SchoolConfig['endereco'],
    contato: row.contato as SchoolConfig['contato'],
    identidade_visual: {
      cor_primaria: iv?.cor_primaria ?? '#003366',
      cor_secundaria: iv?.cor_secundaria ?? '#FF6B35',
      cor_fundo: iv?.cor_fundo ?? '#FFFFFF',
      cor_texto: iv?.cor_texto ?? '#1F2937',
      logo_url: iv?.logo_url ?? '',
      icone_url: iv?.icone_url ?? '',
    },
    config_academica: {
      regime: (ca?.regime as SchoolConfig['config_academica']['regime']) ?? 'bimestral',
      media_aprovacao: (ca?.media_aprovacao as number) ?? 6,
      qtd_avaliacoes_por_periodo: (ca?.qtd_avaliacoes_por_periodo as number) ?? 4,
    },
    config_frequencia: {
      minimo_aprovacao: (cf?.minimo_aprovacao as number) ?? 75,
    },
    modulos_ativos: {
      financeiro: ma?.financeiro ?? false,
      comunicados: ma?.comunicados ?? false,
      calendario: ma?.calendario ?? false,
      portal_responsavel: ma?.portal_responsavel ?? false,
    },
    textos: row.textos as SchoolConfig['textos'] ?? {},
    diretor_nome: (row.diretor_nome as string) ?? null,
    diretor_cargo: (row.diretor_cargo as string) ?? null,
    ano_letivo_atual: (row.ano_letivo_atual as number) ?? null,
    niveis_ensino: (row.niveis_ensino as string[]) ?? [],
  }
}

export async function getSchoolConfig(slug?: string): Promise<SchoolConfig> {
  const schoolSlug = slug ?? process.env.NEXT_PUBLIC_SCHOOL_ID ?? 'escola-teste'

  const cached = configCache.get(schoolSlug)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('escolas')
    .select('*')
    .eq('slug', schoolSlug)
    .eq('ativo', true)
    .single()

  if (error || !data) {
    throw new Error(`Escola não encontrada: ${schoolSlug}`)
  }

  const config = mapRowToConfig(data as unknown as Record<string, unknown>)
  configCache.set(schoolSlug, { data: config, timestamp: Date.now() })

  return config
}

export function invalidateSchoolCache(slug?: string) {
  const key = slug ?? process.env.NEXT_PUBLIC_SCHOOL_ID ?? 'escola-teste'
  configCache.delete(key)
}
