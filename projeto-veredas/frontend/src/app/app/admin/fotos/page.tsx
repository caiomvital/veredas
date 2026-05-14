'use client'

import { useEffect, useState, useRef } from 'react'
import { Image, Upload, Trash2, ChevronUp, ChevronDown, X, AlertCircle, Loader2 } from 'lucide-react'
import { listarFotos, uploadFoto, excluirFoto, reordenarFotos } from '@/lib/actions/fotos'
import type { FotoEscola } from '@/lib/actions/fotos'
import { BackButton } from '@/components/ui/back-button'

const MAX_FOTOS = 20

export default function AdminFotosPage() {
  const [fotos, setFotos] = useState<FotoEscola[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const legendaRef = useRef<HTMLInputElement>(null)

  const carregar = async () => {
    setLoading(true)
    setError(null)
    const res = await listarFotos()
    if (res.error) {
      setError(res.error)
    } else {
      setFotos(res.data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('legenda', legendaRef.current?.value ?? '')

    const res = await uploadFoto(formData)
    if (res.error) {
      setUploadError(res.error)
      setUploading(false)
      return
    }

    setShowUpload(false)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    if (legendaRef.current) legendaRef.current.value = ''
    await carregar()
  }

  const handleExcluir = async (id: string) => {
    setSaving(id)
    await excluirFoto(id)
    setDeleteConfirm(null)
    setSaving(null)
    await carregar()
  }

  const handleReordenar = async (index: number, direcao: 'cima' | 'baixo') => {
    const ids = fotos.map((f) => f.id)
    const targetIndex = direcao === 'cima' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= ids.length) return

    ;[ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]]
    setSaving('reorder')
    await reordenarFotos(ids)
    setSaving(null)
    await carregar()
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar fotos</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button onClick={carregar} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 transition-colors">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const restantes = MAX_FOTOS - fotos.length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back button */}
      <div className="mb-4">
        <BackButton href="/app/admin" />
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Galeria de Fotos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {fotos.length}/{MAX_FOTOS} fotos {restantes > 0 ? `— ${restantes} disponíveis` : '(limite atingido)'}
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          disabled={fotos.length >= MAX_FOTOS}
          className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Upload size={18} />
          Adicionar Fotos
        </button>
      </div>

      {/* Empty state */}
      {fotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Image className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Nenhuma foto cadastrada</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            Adicione fotos para aparecerem no carrossel do topo e na galeria da página inicial da escola.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
          >
            <Upload size={18} />
            Adicionar primeira foto
          </button>
        </div>
      ) : (
        /* Photo grid */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {fotos.map((foto, index) => (
            <div
              key={foto.id}
              className="group relative rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all"
            >
              <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.url}
                  alt={foto.legenda || 'Foto da escola'}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Legend overlay */}
              {foto.legenda && (
                <div className="px-3 py-2">
                  <p className="text-xs text-gray-600 truncate">{foto.legenda}</p>
                </div>
              )}

              {/* Order badge */}
              <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                #{foto.ordem}
              </div>

              {/* Actions overlay */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {index > 0 && (
                  <button
                    onClick={() => handleReordenar(index, 'cima')}
                    disabled={saving === 'reorder'}
                    className="rounded-lg bg-white/90 p-1.5 text-gray-700 hover:bg-white hover:text-gray-900 shadow-sm transition-all"
                    title="Mover para cima"
                  >
                    <ChevronUp size={14} />
                  </button>
                )}
                {index < fotos.length - 1 && (
                  <button
                    onClick={() => handleReordenar(index, 'baixo')}
                    disabled={saving === 'reorder'}
                    className="rounded-lg bg-white/90 p-1.5 text-gray-700 hover:bg-white hover:text-gray-900 shadow-sm transition-all"
                    title="Mover para baixo"
                  >
                    <ChevronDown size={14} />
                  </button>
                )}
                <button
                  onClick={() => setDeleteConfirm(foto.id)}
                  className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100 shadow-sm transition-all"
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Saving overlay */}
              {saving === foto.id && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-green-700" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !uploading && setShowUpload(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Adicionar Foto</h2>
              <button onClick={() => setShowUpload(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Legenda (opcional)</label>
                <input
                  ref={legendaRef}
                  type="text"
                  maxLength={100}
                  placeholder="Ex: Festa de encerramento 2026"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {uploadError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {uploadError}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !saving && setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Excluir foto?</h2>
            <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita. A foto será removida da galeria e do carrossel da página inicial.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={!!saving}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleExcluir(deleteConfirm)}
                disabled={!!saving}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {saving === deleteConfirm ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
