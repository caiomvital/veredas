import { cn } from '@/lib/utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const variants = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

export function statusBadge(status: string): { label: string; variant: BadgeProps['variant'] } {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    ativo: { label: 'Ativo', variant: 'success' },
    inativo: { label: 'Inativo', variant: 'danger' },
    ativa: { label: 'Ativa', variant: 'success' },
    cancelada: { label: 'Cancelada', variant: 'danger' },
    concluida: { label: 'Concluída', variant: 'info' },
    concluido: { label: 'Concluído', variant: 'info' },
    transferido: { label: 'Transferido', variant: 'warning' },
    pendente: { label: 'Pendente', variant: 'warning' },
    pago: { label: 'Pago', variant: 'success' },
  }
  return map[status] ?? { label: status, variant: 'default' }
}
