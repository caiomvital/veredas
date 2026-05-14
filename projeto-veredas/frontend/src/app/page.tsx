import { cookies } from 'next/headers'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { schoolConfig as fallbackConfig } from '@/lib/schoolConfig'
import { MobileMenu } from '@/components/landing/MobileMenu'
import { HeroCarousel } from '@/components/landing/carousel'
import { Galeria } from '@/components/landing/lightbox'

// ── Types ──

interface FotoRecord {
  url: string
  legenda: string
}

interface SerieRecord {
  id: string
  nivel: string
  nome: string
  ordem: number
}

interface ComunicadoRecord {
  id: string
  titulo: string
  corpo: string
  data_publicacao: string
}

interface EventoRecord {
  id: string
  nome: string
  descricao: string | null
  data_inicio: string
  data_fim: string | null
  tipo: string
}

interface LandingData {
  nome: string
  slug: string
  corPrimaria: string
  corSecundaria: string
  slogan: string
  sobre: string
  missao: string
  valores: { titulo: string; descricao: string }[]
  rodape: string
  telefone: string
  email: string
  endereco: { rua?: string; numero?: string; bairro?: string; cidade?: string; uf?: string }
  redesSociais: { tipo: string; url: string }[]
  anosHistoria: number
}

// ── Navigation links ──

const NAV_LINKS = [
  { label: 'Início', href: '#' },
  { label: 'Sobre', href: '#sobre' },
  { label: 'Níveis', href: '#niveis' },
  { label: 'Galeria', href: '#galeria' },
  { label: 'Contato', href: '#contato' },
]

// ── SVG Icons ──

function HeartIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.5-1.5 2.5-3.5 2.5-5.5A5.5 5.5 0 0 0 7.5 7.5A5.5 5.5 0 0 0 2.5 8.5C2.5 10.5 3.5 12.5 5 14l7 7l7-7z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function LightbulbIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8a6 6 0 0 0-12 0c0 1.09.61 2.09 1.5 3.5c.76.76 1.23 1.52 1.41 2.5" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2a19.79 19.79 0 0 1-8.63-3.07a19.5 19.5 0 0 1-6-6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72a12.84 12.84 0 0 0 .7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45a12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

// ── Helpers ──

const NIVEIS_LABELS: Record<string, string> = {
  infantil: 'Educação Infantil',
  fund1: 'Ensino Fundamental — Anos Iniciais',
  fund2: 'Ensino Fundamental — Anos Finais',
  medio: 'Ensino Médio',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

// ── Safe query helper ──

async function safeQuery<T>(
  fn: () => PromiseLike<{ data: T | null; error: unknown }>,
  fallback: T,
  label: string
): Promise<T> {
  try {
    const { data, error } = await fn()
    if (error) {
      console.error(`[landing] ${label}:`, error)
      return fallback
    }
    return data ?? fallback
  } catch (e) {
    console.error(`[landing] ${label}:`, e)
    return fallback
  }
}

// ── Data fetching ──

async function fetchLandingData(): Promise<{
  data: LandingData | null
  fotos: FotoRecord[]
  series: SerieRecord[]
  comunicados: ComunicadoRecord[]
  eventos: EventoRecord[]
}> {
  const cookieStore = await cookies()
  const slug = cookieStore.get('escola_slug')?.value
  const escolaSlug = slug ?? process.env.NEXT_PUBLIC_SCHOOL_ID ?? 'zab'

  const admin = createAdminClient()

  const escola = await safeQuery(
    () => admin.from('escolas').select('*').eq('slug', escolaSlug).single(),
    null,
    'escolas'
  )

  if (!escola) {
    const cfg = fallbackConfig
    return {
      data: {
        nome: cfg.nome, slug: cfg.slug,
        corPrimaria: cfg.identidadeVisual.cor_primaria,
        corSecundaria: cfg.identidadeVisual.cor_secundaria,
        slogan: cfg.textos.slogan, sobre: cfg.textos.sobre,
        missao: cfg.textos.missao, valores: cfg.textos.valores,
        rodape: cfg.textos.rodape, telefone: cfg.contato.telefone,
        email: cfg.contato.email, endereco: cfg.endereco,
        redesSociais: cfg.redesSociais, anosHistoria: 30,
      },
      fotos: [], series: [], comunicados: [], eventos: [],
    }
  }

  const row = escola as unknown as Record<string, unknown>
  const escolaId = row.id as string
  const textos = (row.textos as Record<string, unknown>) ?? {}
  const iv = (row.identidade_visual as Record<string, string>) ?? {}
  const contato = (row.contato as Record<string, unknown>) ?? {}
  const end = (row.endereco as Record<string, string>) ?? {}
  const configAcademica = (row.config_academica as Record<string, unknown>) ?? {}

  const fotos = await safeQuery(
    () => admin.from('fotos_escola').select('url, legenda').eq('escola_id', escolaId).eq('ativo', true).order('ordem'),
    [],
    'fotos_escola'
  )

  const series = await safeQuery(
    () => admin.from('series_escolares').select('*').eq('escola_id', escolaId).eq('ativo', true).order('ordem'),
    [],
    'series_escolares'
  )

  const today = new Date().toISOString().split('T')[0]
  const comunicados = await safeQuery(
    () => admin.from('comunicados').select('id, titulo, corpo, data_publicacao').eq('escola_id', escolaId).eq('publico', true).order('data_publicacao', { ascending: false }).limit(6),
    [],
    'comunicados'
  )

  const eventos = await safeQuery(
    () => admin.from('eventos_calendario').select('*').eq('escola_id', escolaId).eq('publico', true).gte('data_inicio', today).order('data_inicio', { ascending: true }).limit(10),
    [],
    'eventos_calendario'
  )

  const data: LandingData = {
    nome: (row.nome as string) ?? fallbackConfig.nome,
    slug: (row.slug as string) ?? fallbackConfig.slug,
    corPrimaria: iv.cor_primaria ?? fallbackConfig.identidadeVisual.cor_primaria,
    corSecundaria: iv.cor_secundaria ?? fallbackConfig.identidadeVisual.cor_secundaria,
    slogan: (textos.slogan as string) ?? fallbackConfig.textos.slogan,
    sobre: (textos.sobre as string) ?? fallbackConfig.textos.sobre,
    missao: (textos.missao as string) ?? fallbackConfig.textos.missao,
    valores: (textos.valores as { titulo: string; descricao: string }[]) ?? fallbackConfig.textos.valores,
    rodape: (textos.rodape as string) ?? fallbackConfig.textos.rodape,
    telefone: (contato.telefone as string) ?? fallbackConfig.contato.telefone,
    email: (contato.email as string) ?? fallbackConfig.contato.email,
    endereco: {
      rua: end.rua ?? fallbackConfig.endereco.rua,
      numero: end.numero ?? fallbackConfig.endereco.numero,
      bairro: end.bairro ?? fallbackConfig.endereco.bairro,
      cidade: end.cidade ?? fallbackConfig.endereco.cidade,
      uf: end.uf ?? fallbackConfig.endereco.uf,
    },
    redesSociais: (contato.redes_sociais as { tipo: string; url: string }[]) ?? fallbackConfig.redesSociais,
    anosHistoria: (configAcademica.anos_experiencia as number) ?? 30,
  }

  return { data, fotos, series, comunicados, eventos }
}

// ── Section: Header ──

function Header({ data }: { data: LandingData }) {
  const nomeCurto = data.slug.slice(0, 3).toUpperCase()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="#" className="flex items-center gap-3 group">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold tracking-wider transition-colors"
            style={{ backgroundColor: data.corPrimaria }}
          >
            {nomeCurto}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight" style={{ color: data.corPrimaria }}>
              {nomeCurto}
            </p>
            <p className="text-[10px] text-gray-500 leading-tight">{data.nome}</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-100"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/app/login"
            className="ml-4 inline-flex h-9 items-center rounded-lg px-4 text-sm font-semibold text-white hover:opacity-90 transition-all duration-200"
            style={{ backgroundColor: data.corPrimaria }}
          >
            Acessar o Sistema
          </Link>
        </nav>

        <MobileMenu links={NAV_LINKS} />
      </div>
    </header>
  )
}

// ── Section: Sobre ──

function SectionSobre({ data }: { data: LandingData }) {
  return (
    <section id="sobre" className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="relative order-2 md:order-1">
            <div
              className="relative rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${data.corPrimaria}22, ${data.corSecundaria}22)`,
              }}
            >
              <div className="text-center">
                <div
                  className="mx-auto h-20 w-20 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${data.corPrimaria}15` }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={data.corPrimaria} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
                  </svg>
                </div>
                <p className="text-lg font-semibold" style={{ color: data.corPrimaria }}>
                  Cultivando futuros
                </p>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase mb-4 border"
              style={{
                color: data.corPrimaria,
                backgroundColor: `${data.corPrimaria}15`,
                borderColor: `${data.corPrimaria}30`,
              }}
            >
              Quem Somos
            </span>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-6 text-gray-900">
              Uma história construída com{' '}
              <span style={{ color: data.corSecundaria }}>dedicação</span>
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>{data.sobre}</p>
              <p>{data.missao}</p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {data.valores.map((v) => (
                <div
                  key={v.titulo}
                  className="rounded-xl p-4 border"
                  style={{
                    backgroundColor: `${data.corPrimaria}08`,
                    borderColor: `${data.corPrimaria}15`,
                  }}
                >
                  <p className="font-bold text-sm" style={{ color: data.corPrimaria }}>
                    {v.titulo}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{v.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Section: Níveis ──

function SectionNiveis({ series }: { series: SerieRecord[] }) {
  const grouped: Record<string, SerieRecord[]> = {}
  for (const s of series) {
    if (!grouped[s.nivel]) grouped[s.nivel] = []
    grouped[s.nivel].push(s)
  }

  // Se não há séries no banco, tentar fallback dos níveis do schoolConfig
  const hasSeries = Object.keys(grouped).length > 0

  if (!hasSeries) {
    // Renderizar fallback usando schoolConfig.textos.niveis
    return (
      <section id="niveis" className="py-20 md:py-28 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800 tracking-wider uppercase mb-4 border border-green-200">
              Níveis de Ensino
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              Etapas da <span className="text-green-800">formação</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {fallbackConfig.textos.niveis.map((nivel) => (
              <div
                key={nivel.nome}
                className="group rounded-2xl border border-stone-200 bg-white overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div
                  className="p-6 text-center"
                  style={{
                    background: `linear-gradient(135deg, ${fallbackConfig.identidadeVisual.cor_primaria}, ${fallbackConfig.identidadeVisual.cor_primaria}dd)`,
                  }}
                >
                  <span className="text-5xl block mb-3">{nivel.icone}</span>
                  <h3 className="text-lg font-bold text-white">{nivel.nome}</h3>
                  <p className="text-sm text-white/70 mt-1">{nivel.idade}</p>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 leading-relaxed mb-5">{nivel.descricao}</p>
                  <ul className="space-y-2">
                    {nivel.destaques.map((d) => (
                      <li key={d} className="flex items-center gap-2 text-sm text-gray-500">
                        <span
                          className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: fallbackConfig.identidadeVisual.cor_secundaria }}
                        />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="niveis" className="py-20 md:py-28 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800 tracking-wider uppercase mb-4 border border-green-200">
            Níveis de Ensino
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            Etapas da <span className="text-green-800">formação</span>
          </h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">
            Da Educação Infantil ao Ensino Médio, cada fase com o cuidado que seu filho merece.
          </p>
        </div>

        <div className="space-y-10">
          {Object.entries(grouped).map(([nivel, seriesList]) => (
            <div key={nivel}>
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: fallbackConfig.identidadeVisual.cor_secundaria }}
                />
                {NIVEIS_LABELS[nivel] ?? nivel}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {seriesList.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-stone-200 bg-white p-5 hover:shadow-md transition-all"
                  >
                    <p className="font-semibold text-gray-900">{s.nome}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section: Comunicados ──

function SectionComunicados({ comunicados }: { comunicados: ComunicadoRecord[] }) {
  if (comunicados.length === 0) return null

  return (
    <section id="comunicados" className="py-20 md:py-28 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800 tracking-wider uppercase mb-4 border border-green-200">
            Comunicados
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            Fique por dentro
          </h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">
            Acompanhe as novidades e comunicados importantes da escola.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comunicados.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-stone-200 bg-white p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <BellIcon />
                <span>{formatDate(c.data_publicacao)}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{c.titulo}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{truncate(c.corpo, 150)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section: Calendário ──

function SectionCalendario({ eventos }: { eventos: EventoRecord[] }) {
  if (eventos.length === 0) return null

  const TIPO_LABELS: Record<string, string> = {
    feriado: 'Feriado',
    prova: 'Prova',
    reuniao: 'Reunião',
    evento: 'Evento',
    recesso: 'Recesso',
  }

  return (
    <section id="calendario" className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800 tracking-wider uppercase mb-4 border border-green-200">
            Calendário
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            Próximos eventos
          </h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">
            Datas importantes para não perder.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-3">
          {eventos.map((e) => (
            <div
              key={e.id}
              className="flex items-start gap-4 rounded-xl border border-stone-200 bg-white p-4 hover:shadow-md transition-all"
            >
              <div
                className="flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: fallbackConfig.identidadeVisual.cor_primaria }}
              >
                <span>{new Date(e.data_inicio + 'T12:00:00').getDate()}</span>
                <span className="text-[9px] opacity-80">
                  {new Date(e.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 text-sm">{e.nome}</h3>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${fallbackConfig.identidadeVisual.cor_primaria}15`,
                      color: fallbackConfig.identidadeVisual.cor_primaria,
                    }}
                  >
                    {TIPO_LABELS[e.tipo] ?? e.tipo}
                  </span>
                </div>
                {e.descricao && (
                  <p className="text-xs text-gray-500 mt-1">{e.descricao}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section: Contato ──

function SectionContato({ data }: { data: LandingData }) {
  return (
    <section id="contato" className="py-20 md:py-28 relative overflow-hidden" style={{ backgroundColor: data.corPrimaria }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-3xl" style={{ backgroundColor: `${data.corSecundaria}22` }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 text-xs font-semibold tracking-wider uppercase mb-4 border border-white/10"
            style={{ color: data.corSecundaria }}>
            Contato
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Vem fazer parte da{' '}
            <span style={{ color: data.corSecundaria }}>{data.slug.slice(0, 3).toUpperCase()}</span>
          </h2>
          <p className="mt-4 text-white/60 max-w-xl mx-auto text-lg">
            Estamos prontos para receber sua visita e apresentar nossa proposta pedagógica.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 text-center hover:bg-white/10 transition-colors">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${data.corSecundaria}33`, color: data.corSecundaria }}>
              <MapPinIcon />
            </div>
            <h3 className="font-bold text-white mb-2">Endereço</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              {data.endereco.rua}, {data.endereco.numero}<br />
              {data.endereco.bairro} — {data.endereco.cidade}/{data.endereco.uf}
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 text-center hover:bg-white/10 transition-colors">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${data.corSecundaria}33`, color: data.corSecundaria }}>
              <PhoneIcon />
            </div>
            <h3 className="font-bold text-white mb-2">Telefone</h3>
            <p className="text-sm text-white/60 leading-relaxed">{data.telefone}</p>
          </div>

          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 text-center hover:bg-white/10 transition-colors">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${data.corSecundaria}33`, color: data.corSecundaria }}>
              <MailIcon />
            </div>
            <h3 className="font-bold text-white mb-2">E-mail</h3>
            <p className="text-sm text-white/60 leading-relaxed">{data.email}</p>
          </div>
        </div>

        {/* WhatsApp CTA */}
        {data.telefone && (
          <div className="mt-12 text-center">
            <p className="text-white/60 text-sm mb-6">
              Fale conosco pelo WhatsApp
            </p>
            <a
              href={`https://wa.me/55${data.telefone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-xl px-8 text-base font-bold text-white hover:opacity-90 transition-all duration-200 shadow-lg"
              style={{ backgroundColor: '#25D366' }}
            >
              <svg className="mr-2" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Fale conosco pelo WhatsApp
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Section: Footer ──

function SectionFooter({ data }: { data: LandingData }) {
  const nomeCurto = data.slug.slice(0, 3).toUpperCase()

  return (
    <footer style={{ backgroundColor: '#0D1F0E' }} className="text-gray-400">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold tracking-wider"
                style={{ backgroundColor: data.corPrimaria }}
              >
                {nomeCurto}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{nomeCurto}</p>
                <p className="text-[10px] text-gray-500">{data.nome}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{data.sobre}</p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">Navegação</h4>
            <ul className="space-y-2 text-sm">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">Redes Sociais</h4>
            <div className="space-y-2 text-sm">
              {data.redesSociais.map((r) => (
                <a
                  key={r.tipo}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-gray-500 hover:text-white transition-colors capitalize"
                >
                  {r.tipo}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/5 text-center text-xs text-gray-500">
          <p>{data.rodape}</p>
          <p className="mt-3">
            <a href="https://projetoveredas.com.br" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-400 transition-colors">
              Tecnologia por Projeto Veredas
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

// ── Page ──

export default async function LandingPage() {
  const { data, fotos, series, comunicados, eventos } = await fetchLandingData()

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Escola não encontrada</h1>
          <p className="text-gray-500">Verifique o endereço e tente novamente.</p>
        </div>
      </div>
    )
  }

  const nomeCurto = data.slug.slice(0, 3).toUpperCase()

  return (
    <>
      <Header data={data} />
      <main>
        <HeroCarousel
          fotos={fotos}
          nome={data.nome}
          nomeCurto={nomeCurto}
          slogan={data.slogan}
          corPrimaria={data.corPrimaria}
          corSecundaria={data.corSecundaria}
          anosHistoria={data.anosHistoria}
        />
        <SectionSobre data={data} />
        <SectionNiveis series={series} />
        <Galeria fotos={fotos} />
        <SectionComunicados comunicados={comunicados} />
        <SectionCalendario eventos={eventos} />
        <SectionContato data={data} />
      </main>
      <SectionFooter data={data} />
    </>
  )
}
