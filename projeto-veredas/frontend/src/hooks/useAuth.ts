'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Perfil } from '@/types/school'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  perfil: Perfil | null
  escolaId: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

const PERFIL_REDIRECTS: Record<Perfil, string> = {
  admin: '/app/admin',
  coordenador: '/app/coordenador',
  secretaria: '/app/secretaria',
  professor: '/app/professor',
  responsavel: '/app/responsavel/dashboard',
}

export function useAuth() {
  const router = useRouter()
  const supabase = createClient()
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    perfil: null,
    escolaId: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      updateState(session)
      setState((prev) => ({ ...prev, isLoading: false }))
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateState(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  function updateState(session: Session | null) {
    if (session?.user) {
      const meta = session.user.app_metadata
      setState({
        user: session.user,
        session,
        perfil: (meta.perfil as Perfil) ?? null,
        escolaId: (meta.escola_id as string) ?? null,
        isLoading: false,
        isAuthenticated: true,
      })
    } else {
      setState({
        user: null,
        session: null,
        perfil: null,
        escolaId: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const meta = data.user?.app_metadata
    const perfil = meta?.perfil as Perfil | undefined

    if (perfil && PERFIL_REDIRECTS[perfil]) {
      router.push(PERFIL_REDIRECTS[perfil])
    } else {
      router.push('/app/admin')
    }

    return data
  }, [supabase, router])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/app/login')
  }, [supabase, router])

  const getDashboardUrl = useCallback((perfil?: Perfil | null) => {
    if (!perfil) return '/app/login'
    return PERFIL_REDIRECTS[perfil]
  }, [])

  return {
    ...state,
    signIn,
    signOut,
    getDashboardUrl,
  }
}
