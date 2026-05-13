'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Users, BookOpen, GraduationCap, DollarSign, FileText, Bell, Cake } from 'lucide-react'
import Link from 'next/link'
import { getDashboardCounts } from '@/lib/actions/dashboard'
import { getAniversariantesHoje } from '@/lib/actions/aniversariantes'

interface CardData {
  label: string
  href: string
  icon: React.ElementType
  color: string
  countKey: keyof CountData
}

interface CountData {
  alunos: number
  turmas: number
  funcionarios: number
  matriculas: number
  comunicadosNaoLidos: number
}

const CARDS: CardData[] = [
  { label: 'Alunos', href: '/admin/alunos', icon: Users, countKey: 'alunos', color: 'bg-blue-500' },
  { label: 'Turmas', href: '/admin/turmas', icon: BookOpen, countKey: 'turmas', color: 'bg-green-500' },
  { label: 'Funcionários', href: '/admin/funcionarios', icon: GraduationCap, countKey: 'funcionarios', color: 'bg-purple-500' },
  { label: 'Matrículas', href: '/secretaria/matriculas', icon: FileText, countKey: 'matriculas', color: 'bg-red-500' },
  { label: 'Financeiro', href: '/admin/financeiro', icon: DollarSign, countKey: 'matriculas', color: 'bg-yellow-500' },
  { label: 'Comunicados', href: '/comunicados', icon: Bell, countKey: 'comunicadosNaoLidos', color: 'bg-indigo-500' },
]

export default function AdminDashboard() {
  const [counts, setCounts] = useState<CountData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [aniversariantesHoje, setAniversariantesHoje] = useState(0)

  useEffect(() => {
    getDashboardCounts().then((res) => {
      if (res.data) setCounts(res.data)
      setIsLoading(false)
    })
    getAniversariantesHoje().then((res) => {
      if (res.data) setAniversariantesHoje(res.data.total)
    })
  }, [])

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-[var(--color-primary-800)]">Dashboard Administrativo</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((item) => {
          const Icon = item.icon
          const value = counts ? counts[item.countKey] : null
          return (
            <Link key={item.href} href={item.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${item.color}`}>
                    <Icon className="text-white" size={24} />
                  </div>
                  <div>
                    {isLoading ? (
                      <>
                        <div className="mb-1 h-7 w-12 animate-pulse rounded bg-stone-200" />
                        <div className="h-4 w-20 animate-pulse rounded bg-stone-100" />
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-[var(--color-primary-800)]">
                          {value !== null ? value : '—'}
                        </p>
                        <p className="text-sm text-gray-500">{item.label}</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Aniversariantes de hoje */}
      {aniversariantesHoje > 0 && (
        <Link href="/admin/aniversariantes">
          <Card className="mt-6 border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100">
                <Cake size={24} className="text-pink-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-pink-800">
                  {aniversariantesHoje} aniversariante{aniversariantesHoje > 1 ? 's' : ''} hoje!
                </p>
                <p className="text-sm text-pink-600">Clique para ver quem está fazendo aniversário</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  )
}
