'use client'

import { VeredasHeader } from './header'
import { FormDemo } from './form-demo'

// ── SVG Icons ──

function IconSchool() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.1 2 2 6 2s6-.9 6-2v-5" />
    </svg>
  )
}

function IconDollar() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function IconFile() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function IconClipboard() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  )
}

function IconPen() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function IconFamily() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    </svg>
  )
}

function IconServer() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  )
}

function IconArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ── Hero ──

function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full opacity-[0.03]" style={{ backgroundColor: '#2d6a4f' }} />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full opacity-[0.02]" style={{ backgroundColor: '#1a2e4a' }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8 py-24 md:py-32 w-full">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight mb-6" style={{ color: '#1a2e4a' }}>
            Gestão escolar{' '}
            <span style={{ color: '#2d6a4f' }}>conectada</span>,<br />
            simples e acessível.
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mb-10 leading-relaxed" style={{ color: '#6b7280' }}>
            Um hub completo para escolas, professores, responsáveis e famílias. Matrículas, notas, comunicação e finanças em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#plataforma"
              className="inline-flex h-12 items-center justify-center rounded-xl px-8 text-base font-semibold text-white transition-all duration-200 shadow-lg hover:saturate-[1.3]"
              style={{ backgroundColor: '#2d6a4f' }}
            >
              Conhecer a plataforma
            </a>
            <a
              href="#demonstracao"
              className="inline-flex h-12 items-center justify-center rounded-xl border-2 px-8 text-base font-semibold transition-all duration-200 hover:bg-[#1a2e4a] hover:text-white"
              style={{ borderColor: '#1a2e4a', color: '#1a2e4a' }}
            >
              Solicitar demonstração
            </a>
          </div>

          {/* School search */}
          <div className="mt-12 max-w-lg">
            <p className="text-sm font-medium mb-3" style={{ color: '#4b5563' }}>
              Já é cliente? Acesse o portal da sua escola
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Digite o slug da sua escola (ex: zab)"
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20"
                id="hero-slug-input"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('hero-slug-input') as HTMLInputElement
                  if (input?.value.trim()) {
                    window.location.href = `https://${input.value.trim()}.projetoveredas.com.br`
                  }
                }}
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-white transition-all hover:saturate-[1.3]"
                style={{ backgroundColor: '#2d6a4f' }}
              >
                <IconArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── O que é (por perfil) ──

const GESTAO_ITEMS = [
  { icon: <IconClipboard />, title: 'Matrículas', desc: 'Matrículas e rematrículas digitalizadas, lista de espera e histórico completo.' },
  { icon: <IconDollar />, title: 'Financeiro', desc: 'Controle de mensalidades, boletos, inadimplência e relatórios financeiros.' },
  { icon: <IconChart />, title: 'Relatórios', desc: 'Relatórios gerenciais, desempenho escolar, frequência e exportação de dados.' },
  { icon: <IconFile />, title: 'Documentos', desc: 'Declarações, contratos, histórico escolar e transferência com templates personalizáveis.' },
]

const PROFESSOR_ITEMS = [
  { icon: <IconClipboard />, title: 'Chamada', desc: 'Registro de frequência online por turma e disciplina.' },
  { icon: <IconPen />, title: 'Notas', desc: 'Lançamento de notas, médias e recuperação paralela/final.' },
  { icon: <IconCalendar />, title: 'Atividades', desc: 'Planejamento de aulas, atividades e registro de conteúdo.' },
  { icon: <IconChat />, title: 'Agenda', desc: 'Comunicação direta com famílias por agenda do aluno.' },
]

const FAMILIA_ITEMS = [
  { icon: <IconFile />, title: 'Boletim', desc: 'Consultar boletins e histórico escolar dos filhos online.' },
  { icon: <IconChart />, title: 'Frequência', desc: 'Acompanhamento de presença e justificativas de falta.' },
  { icon: <IconBell />, title: 'Comunicados', desc: 'Receber e confirmar comunicados da escola em tempo real.' },
  { icon: <IconDollar />, title: 'Financeiro', desc: 'Visualizar boletos, extrato e situação financeira.' },
]

function SecaoPlataforma() {
  return (
    <section id="plataforma" className="py-20 md:py-28" style={{ backgroundColor: '#f8fafc' }}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ color: '#1a2e4a' }}>
            O que é o Projeto Veredas
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#6b7280' }}>
            Uma plataforma completa que conecta toda a comunidade escolar em um só ambiente.
          </p>
        </div>

        <div className="mb-16">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: '#1a2e4a' }}>
            <IconSchool /> Para gestão
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {GESTAO_ITEMS.map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
                <div className="mb-4">{item.icon}</div>
                <h4 className="font-semibold mb-1.5 text-sm" style={{ color: '#1a2e4a' }}>{item.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: '#1a2e4a' }}>
            <IconFamily /> Para professores
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROFESSOR_ITEMS.map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
                <div className="mb-4">{item.icon}</div>
                <h4 className="font-semibold mb-1.5 text-sm" style={{ color: '#1a2e4a' }}>{item.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: '#1a2e4a' }}>
            <IconUsers /> Para famílias
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FAMILIA_ITEMS.map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
                <div className="mb-4">{item.icon}</div>
                <h4 className="font-semibold mb-1.5 text-sm" style={{ color: '#1a2e4a' }}>{item.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Como funciona ──

const STEPS = [
  { num: '01', title: 'Escola entra', desc: 'Cadastro rápido e onboarding personalizado com nossa equipe.' },
  { num: '02', title: 'Ambiente próprio', desc: 'Cada escola recebe um subdomínio exclusivo e ambiente isolado.' },
  { num: '03', title: 'Personaliza a identidade', desc: 'Logo, cores, textos e templates com a cara da sua escola.' },
  { num: '04', title: 'Usa na web ou celular', desc: 'Plataforma responsiva, acessível de qualquer dispositivo.' },
]

function SecaoComoFunciona() {
  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ color: '#1a2e4a' }}>
            Como funciona
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#6b7280' }}>
            Em poucos passos sua escola está no ar.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {STEPS.map((step, i) => (
            <div key={step.num} className="relative text-center">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[40%] h-0.5 border-t-2 border-dashed opacity-30" style={{ borderColor: '#2d6a4f' }} />
              )}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-lg font-bold text-white"
                style={{ backgroundColor: '#2d6a4f' }}
              >
                {step.num}
              </div>
              <h3 className="font-bold mb-2" style={{ color: '#1a2e4a' }}>{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Escolas parceiras ──

function SecaoEscolas() {
  return (
    <section id="escolas" className="py-20 md:py-28" style={{ backgroundColor: '#f8fafc' }}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ color: '#1a2e4a' }}>
            Escolas parceiras
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#6b7280' }}>
            Instituições que confiam no Projeto Veredas para sua gestão escolar.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl text-white font-bold text-lg"
                style={{ backgroundColor: '#1a2e4a' }}
              >
                ZAB
              </div>
              <div>
                <h3 className="font-bold" style={{ color: '#1a2e4a' }}>Grupo ZAB de Educação</h3>
                <p className="text-sm" style={{ color: '#6b7280' }}>Olinda, PE</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#6b7280' }}>
              Educação Infantil e Ensino Fundamental com mais de 30 anos de história em Olinda.
            </p>
            <a
              href="https://zab.projetoveredas.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-70"
              style={{ color: '#2d6a4f' }}
            >
              Acessar portal <IconArrowRight />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Segurança e LGPD ──

const SECURITY_ITEMS = [
  { icon: <IconServer />, title: 'Backup automático', desc: 'Dados replicados e backup diário garantindo a integridade das informações.' },
  { icon: <IconLock />, title: 'Criptografia', desc: 'Tráfego HTTPS e dados criptografados em repouso e em trânsito.' },
  { icon: <IconShield />, title: 'LGPD', desc: 'Conformidade com a Lei Geral de Proteção de Dados e políticas de privacidade.' },
  { icon: <IconUsers />, title: 'Permissões por perfil', desc: 'Acesso granular: cada usuário vê apenas o que precisa ver.' },
]

function SecaoSeguranca() {
  return (
    <section id="seguranca" className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase mb-4 text-white" style={{ backgroundColor: '#2d6a4f' }}>
              Segurança
            </span>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ color: '#1a2e4a' }}>
              Dados protegidos,{' '}
              <span style={{ color: '#2d6a4f' }}>tranquilidade garantida</span>
            </h2>
            <p className="text-lg leading-relaxed mb-8" style={{ color: '#6b7280' }}>
              O Projeto Veredas foi construído com segurança desde a base. Seguimos as melhores práticas de proteção de dados e conformidade com a LGPD.
            </p>

            <div className="space-y-5">
              {SECURITY_ITEMS.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                  <div>
                    <h4 className="font-semibold text-sm" style={{ color: '#1a2e4a' }}>{item.title}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:block">
            <div className="rounded-2xl border border-gray-200 p-8" style={{ backgroundColor: '#f8fafc' }}>
              <IconShield />
              <h3 className="text-lg font-bold mt-4 mb-2" style={{ color: '#1a2e4a' }}>
                Certificações e conformidade
              </h3>
              <ul className="space-y-3">
                {[
                  'HTTPS e criptografia SSL/TLS',
                  'Backup diário automático',
                  'Conformidade com a LGPD',
                  'Acesso restrito por perfil de usuário',
                  'Ambiente isolado por escola (multi-tenant)',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm" style={{ color: '#4b5563' }}>
                    <IconCheck />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Solicitar demonstração ──

function SecaoDemonstracao() {
  return (
    <section id="demonstracao" className="py-20 md:py-28" style={{ backgroundColor: '#f8fafc' }}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 max-w-4xl mx-auto">
          <div>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase mb-4 text-white" style={{ backgroundColor: '#1a2e4a' }}>
              Contato
            </span>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ color: '#1a2e4a' }}>
              Solicitar{' '}
              <span style={{ color: '#2d6a4f' }}>demonstração</span>
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: '#6b7280' }}>
              Preencha o formulário e nossa equipe entrará em contato para apresentar o Projeto Veredas para sua escola.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-sm" style={{ color: '#4b5563' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
                contato@projetoveredas.com.br
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <FormDemo />
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ──

function Footer() {
  return (
    <footer style={{ backgroundColor: '#1a2e4a' }}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path d="M4 28L16 4L28 28" stroke="#2d6a4f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 20L16 10L22 20" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="16" cy="4" r="2" fill="#2d6a4f" />
              </svg>
              <span className="text-lg font-bold text-white">Projeto Veredas</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#9ca3af' }}>
              Plataforma de gestão escolar que conecta escolas, professores e famílias.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">Navegação</h4>
            <ul className="space-y-2 text-sm">
              {['Plataforma', 'Escolas', 'Segurança', 'Contato'].map((l) => (
                <li key={l}>
                  <a href={`#${l.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()}`} className="transition-colors hover:text-white" style={{ color: '#9ca3af' }}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">Contato</h4>
            <ul className="space-y-2 text-sm" style={{ color: '#9ca3af' }}>
              <li>contato@projetoveredas.com.br</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t text-center text-xs" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#6b7280' }}>
          <p>© 2026 Projeto Veredas. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

// ── Page ──

export default function VeredasLandingPage() {
  return (
    <>
      <VeredasHeader />
      <main>
        <Hero />
        <SecaoPlataforma />
        <SecaoComoFunciona />
        <SecaoEscolas />
        <SecaoSeguranca />
        <SecaoDemonstracao />
      </main>
      <Footer />
    </>
  )
}
