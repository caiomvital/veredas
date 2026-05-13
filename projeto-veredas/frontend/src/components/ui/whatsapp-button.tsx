'use client'

import { MessageCircle } from 'lucide-react'

interface WhatsAppButtonProps {
  /** Telefone em qualquer formato (com máscara, parênteses, traços). Será limpo automaticamente. */
  telefone: string
  /** Mensagem opcional para prefixar */
  mensagem?: string
  /** 'icon' = botão redondo pequeno, 'button' = botão verde completo, 'link' = link texto */
  variant?: 'icon' | 'button' | 'link'
}

function limparTelefone(tel: string): string {
  // Remove tudo que não é dígito, depois remove prefixo 55 se veio com ele
  const digits = tel.replace(/\D/g, '')
  // Se já tem código do país, usa como está; senão, assume 55 (Brasil)
  if (digits.length >= 12 && digits.startsWith('55')) return digits
  if (digits.length >= 10) return `55${digits}`
  return digits // fallback, provavelmente incompleto
}

export function WhatsAppButton({ telefone, mensagem, variant = 'icon' }: WhatsAppButtonProps) {
  const numero = limparTelefone(telefone)
  if (!numero || numero.length < 12) return null

  const params = new URLSearchParams()
  if (mensagem) params.set('text', mensagem)
  const href = `https://wa.me/${numero}${params.toString() ? '?' + params.toString() : ''}`

  if (variant === 'link') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-green-600 hover:text-green-700 font-medium whitespace-nowrap"
      >
        WhatsApp
      </a>
    )
  }

  if (variant === 'button') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors whitespace-nowrap"
      >
        <MessageCircle size={14} />
        WhatsApp
      </a>
    )
  }

  // variant === 'icon'
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
      title="Enviar WhatsApp"
    >
      <MessageCircle size={14} />
    </a>
  )
}
