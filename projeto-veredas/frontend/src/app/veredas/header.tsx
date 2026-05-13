'use client'

import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Plataforma', href: '#plataforma' },
  { label: 'Escolas', href: '#escolas' },
  { label: 'Segurança', href: '#seguranca' },
  { label: 'Contato', href: '#contato' },
]

export function VeredasHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [accessOpen, setAccessOpen] = useState(false)
  const [slug, setSlug] = useState('')

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault()
    if (slug.trim()) {
      window.location.href = `https://${slug.trim()}.projetoveredas.com.br`
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="flex-shrink-0">
            <path d="M4 28L16 4L28 28" stroke="#1a2e4a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 20L16 10L22 20" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="16" cy="4" r="2" fill="#2d6a4f" />
          </svg>
          <span className="text-lg font-bold tracking-tight" style={{ color: '#1a2e4a' }}>
            Projeto Veredas
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm font-medium rounded-md transition-colors"
              style={{ color: '#4b5563' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#1a2e4a' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#4b5563' }}
            >
              {l.label}
            </a>
          ))}

          {/* Acessar minha escola */}
          <div className="relative ml-4">
            <button
              onClick={() => setAccessOpen(!accessOpen)}
              className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-semibold text-white transition-all duration-200"
              style={{ backgroundColor: '#2d6a4f' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#245a43' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d6a4f' }}
            >
              Acessar minha escola
            </button>

            {accessOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setAccessOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-20 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                  <p className="text-sm font-semibold mb-1" style={{ color: '#1a2e4a' }}>
                    Acessar portal da escola
                  </p>
                  <p className="text-xs mb-3" style={{ color: '#6b7280' }}>
                    Digite o slug da sua escola
                  </p>
                  <form onSubmit={handleAccess} className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="ex: zab"
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none transition-colors focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors"
                      style={{ backgroundColor: '#2d6a4f' }}
                    >
                      Ir
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Menu"
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a2e4a" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a2e4a" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-50"
              style={{ color: '#4b5563' }}
            >
              {l.label}
            </a>
          ))}
          <hr className="my-2 border-gray-100" />
          <form onSubmit={(e) => { e.preventDefault(); handleAccess(e) }} className="px-3 py-2">
            <p className="text-xs font-semibold mb-1" style={{ color: '#1a2e4a' }}>
              Acessar minha escola
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="slug da escola"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none"
              />
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
                style={{ backgroundColor: '#2d6a4f' }}
              >
                Ir
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  )
}
