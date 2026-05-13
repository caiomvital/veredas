'use client'

import { useState } from 'react'
import Link from 'next/link'

interface NavLink {
  label: string
  href: string
}

export function MobileMenu({ links }: { links: NavLink[] }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-zab-texto" aria-label="Menu">
        {menuOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        )}
      </button>

      {menuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-1">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-zab-texto hover:text-zab-verde hover:bg-zab-verde-claro rounded-md transition-colors">
              {l.label}
            </a>
          ))}
          <Link href="/app/login" onClick={() => setMenuOpen(false)}
            className="block mt-3 text-center rounded-lg border-2 border-zab-dourado px-4 py-2 text-sm font-semibold text-zab-dourado hover:bg-zab-dourado hover:text-white transition-all duration-200">
            Acessar o Sistema
          </Link>
        </div>
      )}
    </>
  )
}
