import { cn } from '@/lib/utils/cn'

interface AvatarProps {
  className?: string
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ className, src, name, size = 'md' }: AvatarProps) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' }
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (src) {
    return <img src={src} alt={name} className={cn('rounded-full object-cover', sizes[size], className)} />
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground',
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  )
}
