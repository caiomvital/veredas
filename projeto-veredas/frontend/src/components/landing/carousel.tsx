'use client'

import { useState, useEffect, useCallback } from 'react'

interface CarouselSlide {
  url: string
  legenda: string
}

interface CarouselProps {
  fotos: CarouselSlide[]
  nome: string
  nomeCurto: string
  slogan: string
  corPrimaria: string
  corSecundaria: string
  anosHistoria: number
}

export function HeroCarousel({
  fotos,
  nome,
  nomeCurto,
  slogan,
  corPrimaria,
  corSecundaria,
  anosHistoria,
}: CarouselProps) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const hasFotos = fotos.length > 0
  const totalSlides = hasFotos ? fotos.length : 1

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % totalSlides)
  }, [totalSlides])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  useEffect(() => {
    if (isPaused || !hasFotos) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [isPaused, hasFotos, next])

  const stats = [
    { num: `${anosHistoria}+`, label: 'Anos de experiência' },
    { num: '600+', label: 'Alunos atendidos' },
    { num: '40+', label: 'Educadores' },
    { num: '100%', label: 'Acolhimento' },
  ]

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {hasFotos ? (
        fotos.map((foto, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: index === current ? 1 : 0 }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${foto.url})` }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)`,
              }}
            />
          </div>
        ))
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${corPrimaria} 0%, ${corPrimaria}dd 50%, ${corPrimaria}88 100%)`,
          }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full" style={{ backgroundColor: `${corSecundaria}22`, filter: 'blur(80px)' }} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8 py-24 md:py-32 w-full">
        <div className="max-w-3xl">
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm font-medium mb-6 border border-white/10"
            style={{ color: '#e8f5e9' }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: corSecundaria }}
            />
            Mais de {anosHistoria} anos de história
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight text-white mb-4">
            {nomeCurto}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-10 leading-relaxed">
            {slogan}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#sobre"
              className="inline-flex h-12 items-center justify-center rounded-xl px-8 text-base font-bold text-white hover:opacity-90 transition-all duration-200 shadow-lg"
              style={{ backgroundColor: corSecundaria }}
            >
              Conheça nossa proposta
            </a>
            <a
              href="#contato"
              className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-white/30 px-8 text-base font-semibold text-white hover:bg-white/10 transition-all duration-200"
            >
              Fale conosco
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-white">{s.num}</p>
              <p className="text-xs md:text-sm text-white/60 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      {hasFotos && fotos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {fotos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className="transition-all rounded-full"
              style={{
                width: index === current ? 24 : 8,
                height: 8,
                backgroundColor: index === current ? corSecundaria : 'rgba(255,255,255,0.5)',
              }}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Arrows */}
      {hasFotos && fotos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/30 p-2 text-white hover:bg-black/50 transition-all backdrop-blur-sm"
            aria-label="Anterior"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/30 p-2 text-white hover:bg-black/50 transition-all backdrop-blur-sm"
            aria-label="Próximo"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}
    </section>
  )
}
