'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Users, ClipboardList, DollarSign, AlertTriangle, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { getSecretariaDashboard } from '@/lib/actions/dashboard'
import type { SecretariaData } from '@/lib/actions/dashboard'

export default function SecretariaDashboard() {
  const [data, setData] = useState<SecretariaData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getSecretariaDashboard().then((res) => {
      if (res.data) setData(res.data)
      setIsLoading(false)
    })
  }, [])

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-zab-verde">Dashboard da Secretaria</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Carda
          label="Total de Alunos"
          value={data?.totalAlunos}
          icon={<Users size={22} />}
          href="/admin/alunos"
          cor="bg-blue-500"
          isLoading={isLoading}
        />
        <Carda
          label="Matrículas Ativas"
          value={data?.matriculasAtivas}
          icon={<ClipboardList size={22} />}
          href="/secretaria/matriculas"
          cor="bg-green-500"
          isLoading={isLoading}
        />
        <Carda
          label="Mensalidades Vencidas"
          value={data?.mensalidadesVencidas}
          icon={<AlertTriangle size={22} />}
          href="/admin/financeiro"
          cor="bg-red-500"
          isLoading={isLoading}
        />
        <Carda
          label="Vencendo em 3 Dias"
          value={data?.mensalidadesVencendo3d}
          icon={<DollarSign size={22} />}
          href="/admin/financeiro"
          cor="bg-amber-500"
          isLoading={isLoading}
        />
        <Carda
          label="Avisos WhatsApp"
          value={data?.avisosPendentes}
          icon={<MessageCircle size={22} />}
          href="/secretaria/avisos-whatsapp"
          cor="bg-emerald-500"
          isLoading={isLoading}
        />
      </div>

      {/* Acesso rápido */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-zab-texto-claro uppercase tracking-wider">Ações Rápidas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {acoes.map((a) => (
            <Link key={a.href} href={a.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.cor} text-white`}>
                    {a.icon}
                  </div>
                  <span className="text-sm font-medium text-zab-texto">{a.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

const acoes = [
  { label: 'Nova Matrícula', href: '/secretaria/matriculas/nova', icon: <ClipboardList size={18} />, cor: 'bg-blue-500' },
  { label: 'Declarações', href: '/secretaria/declaracoes', icon: <Users size={18} />, cor: 'bg-green-500' },
  { label: 'Histórico Escolar', href: '/secretaria/historico', icon: <Users size={18} />, cor: 'bg-purple-500' },
  { label: 'Transferência', href: '/secretaria/transferencia', icon: <Users size={18} />, cor: 'bg-orange-500' },
  { label: 'Avisos WhatsApp', href: '/secretaria/avisos-whatsapp', icon: <MessageCircle size={18} />, cor: 'bg-emerald-500' },
]

function Carda({ label, value, icon, href, cor, isLoading }: {
  label: string; value?: number; icon: React.ReactNode; href: string; cor: string; isLoading: boolean
}) {
  return (
    <Link href={href}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-5">
          <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${cor} text-white`}>
            {icon}
          </div>
          <div>
            {isLoading ? (
              <>
                <div className="mb-1 h-6 w-10 animate-pulse rounded bg-stone-200" />
                <div className="h-3 w-28 animate-pulse rounded bg-stone-100" />
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-zab-texto-escuro">{value ?? '—'}</p>
                <p className="text-xs text-zab-texto-claro">{label}</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
