'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'pwa-install-dismissed'

export function InstallBanner() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) {
      const data = JSON.parse(dismissed)
      if (Date.now() - data < 7 * 24 * 60 * 60 * 1000) return
      localStorage.removeItem(STORAGE_KEY)
    }

    // Chrome Android: beforeinstallprompt
    const handlePrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handlePrompt)

    // iOS / standalone: detect if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

    // Show banner after 30s if not installed
    const timer = setTimeout(() => {
      if (!isStandalone && (deferredPrompt || (isIOS && isSafari))) {
        setShow(true)
      }
    }, 30000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt)
      clearTimeout(timer)
    }
  }, [deferredPrompt])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === 'accepted') {
        setShow(false)
      }
      setDeferredPrompt(null)
    } else {
      // iOS: show instructions
      alert('Para instalar, toque no botão Compartilhar e depois em "Adicionar à Tela de Início".')
      dismiss()
    }
  }

  const dismiss = () => {
    setShow(false)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Date.now()))
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg md:bottom-4 md:left-auto md:right-4 md:w-80 md:rounded-xl md:border md:shadow-xl">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Instale o Veredas</p>
          <p className="text-xs text-gray-500 mt-0.5">Acesso rápido no seu celular</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={dismiss} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors">
            Agora não
          </button>
          <button onClick={handleInstall}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
            style={{ backgroundColor: '#2d6a4f' }}>
            Instalar
          </button>
        </div>
      </div>
    </div>
  )
}
