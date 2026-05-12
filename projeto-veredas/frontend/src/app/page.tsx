import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MobileMenu } from '@/components/landing/MobileMenu'
import { schoolConfig as fallbackConfig } from '@/lib/schoolConfig'
import type { Escola } from '@/types/school'

async function getEscolaData(): Promise<Record<string, unknown>> {
  const cookieStore = await cookies()
  const slug = cookieStore.get('escola_slug')?.value

  const escolaSlug = slug ?? process.env.NEXT_PUBLIC_SCHOOL_ID ?? 'escola-teste'

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('escolas')
      .select('*')
      .eq('slug', escolaSlug)
      .eq('ativo', true)
      .single()

    if (!error && data) {
      const row = data as unknown as Record<string, unknown>
      return row
    }
  } catch {
    // fallback to static config
  }

  // fallback: mapear schoolConfig para formato similar ao banco
  return {}
}

const links = [
  { label: 'Início', href: '#' },
  { label: 'Sobre', href: '#sobre' },
  { label: 'Diferenciais', href: '#diferenciais' },
  { label: 'Níveis', href: '#niveis' },
  { label: 'Contato', href: '#contato' },
]

function getNested(obj: Record<string, unknown> | null, path: string): unknown {
  if (!obj || Object.keys(obj).length === 0) return undefined
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj)
}

// ── SVG Icons (inline) ──

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

function CompassIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
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

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2a19.79 19.79 0 0 1-8.63-3.07a19.5 19.5 0 0 1-6-6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72a12.84 12.84 0 0 0 .7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45a12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
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

// ── Seções ──

function Header({ data }: { data: Record<string, unknown> }) {
  const nome = (data?.nome as string) ?? fallbackConfig.nome
  const nomeCurto = (data?.slug as string)?.slice(0, 3).toUpperCase() ?? 'ZAB'
  const iv = data?.identidade_visual as Record<string, string> | undefined

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="#" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zab-verde text-white text-sm font-bold tracking-wider group-hover:bg-zab-verde-hover transition-colors">
            {nomeCurto}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-zab-verde leading-tight">{nomeCurto}</p>
            <p className="text-[10px] text-zab-texto-claro leading-tight">{nome}</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a key={l.href} href={l.href}
              className="px-3 py-2 text-sm font-medium text-zab-texto hover:text-zab-verde transition-colors rounded-md hover:bg-zab-verde-claro">
              {l.label}
            </a>
          ))}
          <Link href="/login"
            className="ml-4 inline-flex h-9 items-center rounded-lg border-2 border-zab-dourado px-4 text-sm font-semibold text-zab-dourado hover:bg-zab-dourado hover:text-white transition-all duration-200">
            Acessar o Sistema
          </Link>
        </nav>

        <MobileMenu links={links} />
      </div>
    </header>
  )
}

function Hero({ data }: { data: Record<string, unknown> }) {
  const textos = data?.textos as Record<string, unknown> | undefined
  const slogan = (textos?.slogan as string) ?? fallbackConfig.textos.slogan
  const anos = (data?.ano_letivo_atual as number) ?? 30

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-zab-verde via-zab-verde-hover to-zab-verde-escuro">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-zab-dourado/10 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-white/[0.03] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8 py-24 md:py-32">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-zab-verde-claro mb-6 border border-white/10">
            <span className="h-2 w-2 rounded-full bg-zab-dourado" />
            Mais de {anos} anos de história
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight text-white mb-6">
            Educação que{' '}
            <span className="text-zab-amber">transforma</span>
            ,<br />
            acolhimento que{' '}
            <span className="text-zab-amber">desenvolve</span>
          </h1>

          <p className="text-lg md:text-xl text-zab-verde-claro-2 max-w-2xl mb-10 leading-relaxed">
            {slogan}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#sobre"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-zab-dourado px-8 text-base font-bold text-white hover:bg-zab-dourado-hover transition-all duration-200 shadow-lg shadow-zab-dourado/25">
              Conheça nossa proposta
            </a>
            <a href="#contato"
              className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-white/30 px-8 text-base font-semibold text-white hover:bg-white/10 transition-all duration-200">
              Fale conosco
            </a>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl">
          {[
            { num: `${anos}+`, label: 'Anos de experiência' },
            { num: '600+', label: 'Alunos atendidos' },
            { num: '40+', label: 'Educadores' },
            { num: '100%', label: 'Acolhimento' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-zab-amber">{s.num}</p>
              <p className="text-xs md:text-sm text-zab-verde-claro-3 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Sobre({ data }: { data: Record<string, unknown> }) {
  const textos = data?.textos as Record<string, unknown> | undefined
  const sobre = (textos?.sobre as string) ?? fallbackConfig.textos.sobre
  const missao = (textos?.missao as string) ?? fallbackConfig.textos.missao
  const valores = (textos?.valores as Array<{ titulo: string; descricao: string }>) ?? fallbackConfig.textos.valores

  return (
    <section id="sobre" className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="relative order-2 md:order-1">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-zab-verde-claro to-zab-dourado-claro aspect-[4/3]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-7xl">🌱</span>
                  <p className="mt-4 text-lg font-semibold text-zab-verde">Cultivando futuros</p>
                </div>
              </div>
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="h-2 w-2 rounded-full bg-zab-verde/20" />
                <span className="h-2 w-2 rounded-full bg-zab-dourado/20" />
                <span className="h-2 w-2 rounded-full bg-zab-verde/20" />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-4 border border-stone-100 hidden md:block">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🧑‍🏫</span>
                <div>
                  <p className="text-sm font-bold text-zab-verde">Equipe Multidisciplinar</p>
                  <p className="text-xs text-zab-texto-claro">Pedagogas, Psicólogas e Professoras</p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <span className="inline-flex items-center rounded-full bg-zab-verde-claro px-3 py-1 text-xs font-semibold text-zab-verde tracking-wider uppercase mb-4">
              Quem Somos
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-zab-verde leading-tight mb-6">
              Uma história construída com{' '}
              <span className="text-zab-dourado">dedicação</span>
            </h2>
            <div className="space-y-4 text-zab-texto leading-relaxed">
              <p>{sobre}</p>
              <p>{missao}</p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {valores.map((v: { titulo: string; descricao: string }) => (
                <div key={v.titulo} className="rounded-xl bg-zab-creme border border-stone-200 p-4">
                  <p className="font-bold text-zab-verde text-sm">{v.titulo}</p>
                  <p className="text-xs text-zab-texto-claro mt-1 leading-relaxed">{v.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Diferenciais() {
  const items = [
    { icone: <HeartIcon />, titulo: 'Acolhimento Integral', desc: 'Acompanhamos cada aluno de forma individual, respeitando seu ritmo e necessidades.' },
    { icone: <StarIcon />, titulo: 'Excelência Pedagógica', desc: 'Corpo docente qualificado e em constante formação, com metodologias ativas e atualizadas.' },
    { icone: <UsersIcon />, titulo: 'Família + Escola', desc: 'Parceria permanente com as famílias através de canais abertos de comunicação e participação.' },
    { icone: <LightbulbIcon />, titulo: 'Inovação e Tradição', desc: 'Equilibramos tecnologia educacional com valores humanos fundamentais para o desenvolvimento.' },
    { icone: <CompassIcon />, titulo: 'Formação Integral', desc: 'Educação cognitiva, socioemocional e ética caminhando juntas em cada etapa.' },
    { icone: <StarIcon />, titulo: 'Infraestrutura Acolhedora', desc: 'Ambientes planejados para estimular o aprendizado, a criatividade e o bem-estar.' },
  ]

  return (
    <section id="diferenciais" className="py-20 md:py-28 bg-zab-creme">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-flex items-center rounded-full bg-zab-dourado-claro px-3 py-1 text-xs font-semibold text-zab-dourado tracking-wider uppercase mb-4">
            Nossos Diferenciais
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-zab-verde leading-tight">
            Por que escolher o{' '}
            <span className="text-zab-dourado">Grupo ZAB</span>?
          </h2>
          <p className="mt-4 text-zab-texto-claro max-w-2xl mx-auto text-lg">
            Mais do que uma escola, uma comunidade de aprendizado e crescimento.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {items.map((item) => (
            <div key={item.titulo}
              className="group rounded-2xl bg-white border border-stone-200 p-6 hover:shadow-lg hover:border-zab-dourado/30 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-zab-verde-claro flex items-center justify-center text-zab-verde group-hover:bg-zab-verde group-hover:text-white transition-all duration-300 mb-4">
                {item.icone}
              </div>
              <h3 className="text-lg font-bold text-zab-verde mb-2">{item.titulo}</h3>
              <p className="text-sm text-zab-texto-claro leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Niveis({ data }: { data: Record<string, unknown> }) {
  const textos = data?.textos as Record<string, unknown> | undefined
  const niveis = (textos?.niveis as Array<{ nome: string; idade: string; icone: string; descricao: string; destaques: string[] }>) ?? fallbackConfig.textos.niveis

  return (
    <section id="niveis" className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-flex items-center rounded-full bg-zab-verde-claro px-3 py-1 text-xs font-semibold text-zab-verde tracking-wider uppercase mb-4">
            Níveis de Ensino
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-zab-verde leading-tight">
            Etapas da{' '}
            <span className="text-zab-dourado">formação</span>
          </h2>
          <p className="mt-4 text-zab-texto-claro max-w-2xl mx-auto text-lg">
            Da Educação Infantil ao Fundamental, cada fase com o cuidado que seu filho merece.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {niveis.map((nivel) => (
            <div key={nivel.nome}
              className="group rounded-2xl border border-stone-200 bg-white overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-zab-verde to-zab-verde-hover p-6 text-center">
                <span className="text-5xl block mb-3">{nivel.icone}</span>
                <h3 className="text-lg font-bold text-white">{nivel.nome}</h3>
                <p className="text-sm text-zab-verde-claro-3 mt-1">{nivel.idade}</p>
              </div>
              <div className="p-6">
                <p className="text-sm text-zab-texto leading-relaxed mb-5">{nivel.descricao}</p>
                <ul className="space-y-2">
                  {nivel.destaques.map((d) => (
                    <li key={d} className="flex items-center gap-2 text-sm text-zab-texto-claro">
                      <span className="h-1.5 w-1.5 rounded-full bg-zab-dourado flex-shrink-0" />
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

function Contato({ data }: { data: Record<string, unknown> }) {
  const endereco = data?.endereco as Record<string, string> | undefined ?? fallbackConfig.endereco
  const contato = data?.contato as Record<string, unknown> | undefined ?? fallbackConfig.contato
  const telefone = contato?.telefone as string ?? fallbackConfig.contato.telefone
  const email = contato?.email as string ?? fallbackConfig.contato.email

  return (
    <section id="contato" className="py-20 md:py-28 bg-gradient-to-br from-zab-verde to-zab-footer">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zab-amber tracking-wider uppercase mb-4 backdrop-blur-sm border border-white/10">
            Contato
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Vem fazer parte do{' '}
            <span className="text-zab-amber">Grupo ZAB</span>
          </h2>
          <p className="mt-4 text-zab-verde-claro-3 max-w-xl mx-auto text-lg">
            Estamos prontos para receber sua visita e apresentar nossa proposta pedagógica.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 text-center hover:bg-white/10 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-zab-dourado/20 flex items-center justify-center mx-auto mb-4 text-zab-amber">
              <MapPinIcon />
            </div>
            <h3 className="font-bold text-white mb-2">Endereço</h3>
            <p className="text-sm text-zab-verde-claro-3 leading-relaxed">
              {endereco.rua}, {endereco.numero}<br />
              {endereco.bairro} — {endereco.cidade}/{endereco.uf}
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 text-center hover:bg-white/10 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-zab-dourado/20 flex items-center justify-center mx-auto mb-4 text-zab-amber">
              <PhoneIcon />
            </div>
            <h3 className="font-bold text-white mb-2">Telefone</h3>
            <p className="text-sm text-zab-verde-claro-3 leading-relaxed">{telefone}</p>
          </div>

          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 text-center hover:bg-white/10 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-zab-dourado/20 flex items-center justify-center mx-auto mb-4 text-zab-amber">
              <MailIcon />
            </div>
            <h3 className="font-bold text-white mb-2">E-mail</h3>
            <p className="text-sm text-zab-verde-claro-3 leading-relaxed">{email}</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-zab-verde-claro-2 text-sm mb-6">Agende uma visita e conheça nossa estrutura</p>
          <a href={`mailto:${email}`}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-zab-dourado px-8 text-base font-bold text-white hover:bg-zab-dourado-hover transition-all duration-200 shadow-lg shadow-zab-dourado/25">
            Entrar em contato
          </a>
        </div>
      </div>
    </section>
  )
}

function Footer({ data }: { data: Record<string, unknown> }) {
  const textos = data?.textos as Record<string, unknown> | undefined
  const nome = (data?.nome as string) ?? fallbackConfig.nome
  const nomeCurto = (data?.slug as string)?.slice(0, 3).toUpperCase() ?? 'ZAB'
  const rodape = (textos?.rodape as string) ?? fallbackConfig.textos.rodape

  const redesSociais: Array<{ tipo: string; url: string }> =
    ((data?.contato as Record<string, unknown>)?.redes_sociais as Array<{ tipo: string; url: string }>) ??
    fallbackConfig.redesSociais

  return (
    <footer className="bg-zab-verde-footer text-zab-verde-claro-3">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zab-verde text-white text-sm font-bold tracking-wider">
                {nomeCurto}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{nomeCurto}</p>
                <p className="text-[10px] text-zab-texto-claro">{nome}</p>
              </div>
            </div>
            <p className="text-sm text-zab-texto-claro leading-relaxed max-w-xs">
              Educação Infantil e Ensino Fundamental em Olinda — PE. Mais de 30 anos formando cidadãos.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">Navegação</h4>
            <ul className="space-y-2 text-sm">
              {['Sobre', 'Diferenciais', 'Níveis de Ensino', 'Contato'].map((l) => (
                <li key={l}>
                  <a href={`#${l.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '')}`}
                    className="text-zab-texto-claro hover:text-zab-amber transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">Redes Sociais</h4>
            <div className="space-y-2 text-sm">
              {redesSociais.map((r) => (
                <a key={r.tipo} href={r.url} target="_blank" rel="noopener noreferrer"
                  className="block text-zab-texto-claro hover:text-zab-amber transition-colors capitalize">
                  {r.tipo}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/5 text-center text-xs text-zab-texto-claro">
          <p>{rodape}</p>
        </div>
      </div>
    </footer>
  )
}

// ── Page ──

export default async function LandingPage() {
  const data = await getEscolaData()

  return (
    <>
      <Header data={data} />
      <main>
        <Hero data={data} />
        <Sobre data={data} />
        <Diferenciais />
        <Niveis data={data} />
        <Contato data={data} />
      </main>
      <Footer data={data} />
    </>
  )
}
