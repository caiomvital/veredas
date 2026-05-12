'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        className: 'text-sm',
      }}
    />
  )
}
