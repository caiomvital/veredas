import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { SetAllCookies } from '@supabase/ssr'

type Perfil = 'admin' | 'coordenador' | 'secretaria' | 'professor' | 'responsavel'

const ROTA_POR_PERFIL: Record<Perfil, string> = {
  admin: '/app/admin',
  coordenador: '/app/coordenador',
  secretaria: '/app/secretaria',
  professor: '/app/professor',
  responsavel: '/app/responsavel/dashboard',
}

const PERMISSOES_ROTA: Record<string, Perfil[]> = {
  '/app/admin': ['admin'],
  '/app/coordenador': ['coordenador'],
  '/app/secretaria': ['secretaria'],
  '/app/professor': ['professor'],
  '/app/responsavel': ['responsavel'],
  '/app/comunicados': ['admin', 'coordenador', 'secretaria', 'professor', 'responsavel'],
  '/app/calendario': ['admin', 'coordenador', 'secretaria', 'professor', 'responsavel'],
}

const PERMISSOES_ROTA_ESPECIFICAS: Record<string, Perfil[]> = {
  '/app/admin/financeiro': ['admin', 'secretaria'],
  '/app/admin/funcionarios': ['admin', 'secretaria'],
  '/app/secretaria/avisos-whatsapp': ['admin', 'secretaria'],
  '/app/secretaria/ficha-aluno': ['admin', 'secretaria'],
}

const ESCOLA_SLUG_COOKIE = 'escola_slug'

/**
 * Extrai o subdomínio do host.
 * zab.projetoveredas.com.br → "zab"
 * projetoveredas.com.br → null (domínio raiz)
 * localhost → "__localhost__"
 */
function extractSubdomain(host: string): string | null {
  if (!host) return null
  host = host.split(':')[0]
  if (host === 'localhost' || host === '127.0.0.1') return '__localhost__'

  const parts = host.split('.').filter(Boolean)
  let idx = 0
  if (parts[0] === 'www') idx = 1

  const isKnownApex = host.endsWith('projetoveredas.com.br')

  if (isKnownApex && parts.length - idx > 3) return parts[idx]
  if (!isKnownApex && parts.length - idx > 2) return parts[idx]

  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') ?? ''

  // ─── Detecção de subdomínio ───
  const subdomain = extractSubdomain(host)

  // Se for subdomínio de escola (não localhost), setar cookie e continuar
  let response = NextResponse.next()
  if (subdomain && subdomain !== '__localhost__') {
    response.cookies.set(ESCOLA_SLUG_COOKIE, subdomain, {
      maxAge: 60 * 60 * 24,
      path: '/',
    })
  }

  // ─── Domínio raiz: serve landing do Projeto Veredas ───
  const hostWithoutPort = host.split(':')[0]
  const isVeredasDomain =
    hostWithoutPort === 'projetoveredas.com.br' || hostWithoutPort === 'www.projetoveredas.com.br'

  if (isVeredasDomain && pathname === '/') {
    return NextResponse.rewrite(new URL('/veredas', request.url))
  }

  // ─── Landing pages públicas ───
  if (
    pathname === '/' ||
    pathname === '/app/login' ||
    pathname === '/veredas' ||
    pathname.startsWith('/veredas/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return response
  }

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

  if (!session) {
    const loginUrl = new URL('/app/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const perfil = session.user.app_metadata.perfil as Perfil | undefined
  const escolaId = session.user.app_metadata.escola_id as string | undefined

  // ─── Onboarding: admin com config pendente ───
  if (
    perfil === 'admin' &&
    escolaId &&
    !pathname.startsWith('/app/admin/onboarding') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next')
  ) {
    const { data: escola } = await supabase
      .from('escolas')
      .select('configuracao_concluida')
      .eq('id', escolaId)
      .single()

    if (escola && !escola.configuracao_concluida) {
      const onboardingUrl = new URL('/app/admin/onboarding', request.url)
      return NextResponse.redirect(onboardingUrl)
    }
  }

  // Check specific routes first (exact match or prefix match)
  const rotaEspecifica = Object.entries(PERMISSOES_ROTA_ESPECIFICAS)
    .find(([rota]) => pathname === rota || pathname.startsWith(rota + '/'))

  if (rotaEspecifica) {
    const [, perfisPermitidos] = rotaEspecifica
    if (perfil && !perfisPermitidos.includes(perfil)) {
      const destino = ROTA_POR_PERFIL[perfil] ?? '/app/admin'
      return NextResponse.redirect(new URL(destino, request.url))
    }
  } else {
    // Match against known base routes (now prefixed with /app/)
    const rotaBase = Object.keys(PERMISSOES_ROTA)
      .find((rota) => pathname === rota || pathname.startsWith(rota + '/'))
    const perfisPermitidos = rotaBase ? PERMISSOES_ROTA[rotaBase] : undefined

    if (perfisPermitidos && perfil) {
      if (!perfisPermitidos.includes(perfil)) {
        const destino = ROTA_POR_PERFIL[perfil] ?? '/app/admin'
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
