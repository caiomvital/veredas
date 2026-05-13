'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  const start = total === 0 ? 0 : page * pageSize + 1
  const end = Math.min((page + 1) * pageSize, total)

  function getPages(): (number | 'ellipsis')[] {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i)
      return pages
    }
    pages.push(0)
    if (page > 2) pages.push('ellipsis')
    for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) {
      if (i > 0 && i < totalPages - 1) pages.push(i)
    }
    if (page < totalPages - 3) pages.push('ellipsis')
    pages.push(totalPages - 1)
    return pages
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <span className="text-sm text-gray-500">
        Exibindo {start}–{end} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-sm text-gray-600 hover:bg-surface-muted disabled:opacity-30"
        >
          <ChevronLeft size={14} /> Anterior
        </button>
        {getPages().map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-1 text-sm text-gray-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium',
                p === page
                  ? 'bg-[var(--color-primary-600)] text-white'
                  : 'text-gray-600 hover:bg-surface-muted'
              )}
            >
              {p + 1}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-sm text-gray-600 hover:bg-surface-muted disabled:opacity-30"
        >
          Próximo <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// Hook for client-side pagination
export function usePagination<T>(data: T[], pageSize = 20) {
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const [page, setPage] = useState(0)
  const safePage = Math.min(page, totalPages - 1)
  const paginatedData = data.slice(safePage * pageSize, (safePage + 1) * pageSize)

  return {
    page: safePage,
    setPage,
    totalPages,
    total: data.length,
    pageSize,
    data: paginatedData,
    PaginationComponent: () => (
      <Pagination
        page={safePage}
        totalPages={totalPages}
        total={data.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    ),
  }
}
