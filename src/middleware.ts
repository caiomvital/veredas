import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { SetAllCookies } from '@supabase/ssr'

type Perfil = 'admin' | 'coordenador' | 'secretaria' | 'professor' | 'responsavel'

const ROTA_POR_PERFIL: Record<Perfil, string> = {
  admin: '/admin',
  coordenador: '/coordenador',
  secretaria: '/secretaria',
  professor: '/professor',
  responsavel: '/responsavel/dashboard',
}

const PERMISSOES_ROTA: Record<string, Perfil[]> = {
  '/admin': ['admin'],
  '/coordenador': ['coordenador'],
  '/secretaria': ['secretaria'],
  '/professor': ['professor'],
  '/responsavel': ['responsavel'],
}

const PERMISSOES_ROTA_ESPECIFICAS: Record<string, Perfil[]> = {
  '/admin/financeiro': ['admin', 'secretaria'],
  '/secretaria/avisos-whatsapp': ['admin', 'secretaria'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Landing pages são públicas
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll: ((cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        }) satisfies SetAllCookies,
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Rotas protegidas sem sessão → redirect para login
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verificar permissão de perfil para a rota
  const perfil = session.user.app_metadata.perfil as Perfil | undefined

  // Verificar primeiro se há permissão específica para a rota exata
  const perfisPermitidosEspecificos = PERMISSOES_ROTA_ESPECIFICAS[pathname]

  if (perfisPermitidosEspecificos) {
    if (perfil && !perfisPermitidosEspecificos.includes(perfil)) {
      const destino = ROTA_POR_PERFIL[perfil] ?? '/admin'
      return NextResponse.redirect(new URL(destino, request.url))
    }
  } else {
    // Fallback: verificar permissão pela rota base
    const rotaBase = '/' + pathname.split('/')[1]
    const perfisPermitidos = PERMISSOES_ROTA[rotaBase]

    if (perfisPermitidos && perfil) {
      if (!perfisPermitidos.includes(perfil)) {
        const destino = ROTA_POR_PERFIL[perfil] ?? '/admin'
        return NextResponse.redirect(new URL(destino, request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
