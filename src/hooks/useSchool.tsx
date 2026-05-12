'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SchoolConfig } from '@/types/school'

interface SchoolContextValue {
  config: SchoolConfig | null
  isLoading: boolean
  error: string | null
  applyTheme: (config: SchoolConfig) => void
  refresh: () => Promise<void>
}

const SchoolContext = createContext<SchoolContextValue>({
  config: null,
  isLoading: true,
  error: null,
  applyTheme: () => {},
  refresh: async () => {},
})

export function useSchool() {
  return useContext(SchoolContext)
}

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SchoolConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const applyTheme = useCallback((cfg: SchoolConfig) => {
    const iv = cfg.identidade_visual
    const root = document.documentElement

    root.style.setProperty('--color-primary', iv.cor_primaria)
    root.style.setProperty('--color-primary-foreground', '#FFFFFF')

    // Generate shades
    const hex = iv.cor_primaria.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    const shade = (factor: number) => {
      const nr = Math.min(255, Math.round(r + (255 - r) * factor))
      const ng = Math.min(255, Math.round(g + (255 - g) * factor))
      const nb = Math.min(255, Math.round(b + (255 - b) * factor))
      return `rgb(${nr}, ${ng}, ${nb})`
    }

    root.style.setProperty('--color-primary-50', shade(0.9))
    root.style.setProperty('--color-primary-100', shade(0.8))
    root.style.setProperty('--color-primary-200', shade(0.6))
    root.style.setProperty('--color-primary-300', shade(0.4))
    root.style.setProperty('--color-primary-400', shade(0.2))
    root.style.setProperty('--color-primary-500', iv.cor_primaria)
    root.style.setProperty('--color-primary-600', `rgb(${Math.round(r * 0.8)}, ${Math.round(g * 0.8)}, ${Math.round(b * 0.8)})`)
    root.style.setProperty('--color-primary-700', `rgb(${Math.round(r * 0.6)}, ${Math.round(g * 0.6)}, ${Math.round(b * 0.6)})`)
    root.style.setProperty('--color-primary-800', `rgb(${Math.round(r * 0.4)}, ${Math.round(g * 0.4)}, ${Math.round(b * 0.4)})`)
    root.style.setProperty('--color-primary-900', `rgb(${Math.round(r * 0.2)}, ${Math.round(g * 0.2)}, ${Math.round(b * 0.2)})`)

    root.style.setProperty('--color-secondary', iv.cor_secundaria)
    root.style.setProperty('--color-secondary-foreground', '#FFFFFF')
    root.style.setProperty('--color-surface', iv.cor_fundo ?? '#F9FAFB')
    root.style.setProperty('--color-surface-muted', '#F3F4F6')
    root.style.setProperty('--color-surface-alt', '#E5E7EB')
    root.style.setProperty('--color-border', '#D1D5DB')
    root.style.setProperty('--color-sidebar-bg', iv.cor_primaria)
    root.style.setProperty('--color-sidebar-text', '#FFFFFF')
    root.style.setProperty('--color-sidebar-hover', `rgba(255, 255, 255, 0.1)`)
    root.style.setProperty('--color-sidebar-active', `rgba(255, 255, 255, 0.2)`)
  }, [])

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const supabase = createClient()
      const slug = process.env.NEXT_PUBLIC_SCHOOL_ID ?? 'escola-teste'

      const { data: raw, error: err } = await supabase
        .from('escolas')
        .select('*')
        .eq('slug', slug)
        .eq('ativo', true)
        .single()

      if (err || !raw) {
        throw new Error(`Escola não encontrada: ${slug}`)
      }

      const data = raw as Record<string, unknown>
      const iv = (data.identidade_visual ?? {}) as Record<string, string>
      const ca = (data.config_academica ?? {}) as Record<string, unknown>
      const cf = (data.config_frequencia ?? {}) as Record<string, unknown>
      const ma = (data.modulos_ativos ?? {}) as Record<string, boolean>

      const cfg: SchoolConfig = {
        id: data.id as string,
        slug: data.slug as string,
        nome: data.nome as string,
        cnpj: data.cnpj as string | null,
        endereco: data.endereco as SchoolConfig['endereco'],
        contato: data.contato as SchoolConfig['contato'],
        identidade_visual: {
          cor_primaria: iv.cor_primaria ?? '#003366',
          cor_secundaria: iv.cor_secundaria ?? '#FF6B35',
          cor_fundo: iv.cor_fundo ?? '#FFFFFF',
          cor_texto: iv.cor_texto ?? '#1F2937',
          logo_url: iv.logo_url ?? '',
          icone_url: iv.icone_url ?? '',
        },
        config_academica: {
          regime: (ca.regime as SchoolConfig['config_academica']['regime']) ?? 'bimestral',
          media_aprovacao: (ca.media_aprovacao as number) ?? 6,
          qtd_avaliacoes_por_periodo: (ca.qtd_avaliacoes_por_periodo as number) ?? 4,
        },
        config_frequencia: {
          minimo_aprovacao: (cf.minimo_aprovacao as number) ?? 75,
        },
        modulos_ativos: {
          financeiro: ma.financeiro ?? false,
          comunicados: ma.comunicados ?? false,
          calendario: ma.calendario ?? false,
          portal_responsavel: ma.portal_responsavel ?? false,
        },
        textos: data.textos as SchoolConfig['textos'] ?? {},
      }

      setConfig(cfg)
      applyTheme(cfg)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar configuração da escola')
    } finally {
      setIsLoading(false)
    }
  }, [applyTheme])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return (
    <SchoolContext.Provider value={{ config, isLoading, error, applyTheme, refresh: fetchConfig }}>
      {children}
    </SchoolContext.Provider>
  )
}
