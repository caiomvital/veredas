'use client'

import { useState } from 'react'
import { salvarLead } from '@/lib/actions/leads'

export function FormDemo() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const result = await salvarLead(formData)

    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h3 className="text-lg font-bold mb-1" style={{ color: '#1a2e4a' }}>
          Solicitação enviada!
        </h3>
        <p className="text-sm" style={{ color: '#6b7280' }}>
          Entraremos em contato em breve para apresentar o Projeto Veredas.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="nome" className="block text-sm font-medium mb-1" style={{ color: '#1a2e4a' }}>
          Nome completo
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20"
          placeholder="Seu nome"
        />
      </div>
      <div>
        <label htmlFor="escola" className="block text-sm font-medium mb-1" style={{ color: '#1a2e4a' }}>
          Escola
        </label>
        <input
          id="escola"
          name="escola"
          type="text"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20"
          placeholder="Nome da escola"
        />
      </div>
      <div>
        <label htmlFor="telefone" className="block text-sm font-medium mb-1" style={{ color: '#1a2e4a' }}>
          Telefone
        </label>
        <input
          id="telefone"
          name="telefone"
          type="tel"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20"
          placeholder="(81) 99999-9999"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: '#1a2e4a' }}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20"
          placeholder="seu@email.com"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
        style={{ backgroundColor: '#2d6a4f' }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#245a43' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d6a4f' }}
      >
        {loading ? 'Enviando...' : 'Solicitar demonstração'}
      </button>
    </form>
  )
}
