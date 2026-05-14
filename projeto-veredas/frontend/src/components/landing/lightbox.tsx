'use client'

import { useState, useEffect, useCallback } from 'react'

interface Photo {
  url: string
  legenda: string
}

interface GaleriaProps {
  fotos: Photo[]
}

export function Galeria({ fotos }: GaleriaProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const open = (i: number) => {
    setIndex(i)
    setIsOpen(true)
  }

  const close = useCallback(() => setIsOpen(false), [])

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % fotos.length)
  }, [fotos.length])

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + fotos.length) % fotos.length)
  }, [fotos.length])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [isOpen, prev, next, close])

  if (fotos.length === 0) return null

  return (
    <section id="galeria" className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800 tracking-wider uppercase mb-4 border border-green-200">
            Galeria
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            Momentos da nossa{' '}
            <span className="text-green-800">escola</span>
          </h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">
            Registros do nosso dia a dia, eventos e atividades especiais.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {fotos.map((foto, i) => (
            <button
              key={i}
              onClick={() => open(i)}
              className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.url}
                alt={foto.legenda || `Foto ${i + 1}`}
                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {foto.legenda || 'Ver foto'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          <div
            className="relative flex flex-col items-center max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={close}
              className="absolute -top-12 right-0 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-all"
              aria-label="Fechar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Image */}
            <div className="relative w-full flex items-center justify-center">
              {/* Prev */}
              {fotos.length > 1 && (
                <button
                  onClick={prev}
                  className="absolute left-0 md:-left-12 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-all"
                  aria-label="Anterior"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fotos[index].url}
                alt={fotos[index].legenda || `Foto ${index + 1}`}
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
              />

              {/* Next */}
              {fotos.length > 1 && (
                <button
                  onClick={next}
                  className="absolute right-0 md:-right-12 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-all"
                  aria-label="Próximo"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
            </div>

            {/* Legend + Counter */}
            <div className="mt-4 text-center">
              {fotos[index].legenda && (
                <p className="text-white/80 text-sm">{fotos[index].legenda}</p>
              )}
              {fotos.length > 1 && (
                <p className="text-white/50 text-xs mt-1">
                  {index + 1} / {fotos.length}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
