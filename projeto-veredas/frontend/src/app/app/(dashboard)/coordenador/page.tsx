'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Users, BookOpen, GraduationCap, Bell, Calendar, FileText, Cake } from 'lucide-react'
import Link from 'next/link'
import { getCoordenadorDashboard } from '@/lib/actions/dashboard'
import { getAniversariantesHoje } from '@/lib/actions/aniversariantes'
import type { CoordenadorData } from '@/lib/actions/dashboard'

export default function CoordenadorDashboard() {
  const [data, setData] = useState<CoordenadorData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [aniversariantesHoje, setAniversariantesHoje] = useState(0)

  useEffect(() => {
    getCoordenadorDashboard().then((res) => {
      if (res.data) setData(res.data)
      setIsLoading(false)
    })
    getAniversariantesHoje().then((res) => {
      if (res.data) setAniversariantesHoje(res.data.total)
    })
  }, [])

  const TIPO_EVENTO_COR: Record<string, string> = {
    feriado: 'bg-purple-100 text-purple-700',
    prova: 'bg-red-100 text-red-700',
    reuniao: 'bg-blue-100 text-blue-700',
    evento: 'bg-green-100 text-green-700',
    recesso: 'bg-amber-100 text-amber-700',
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-zab-verde">Dashboard do Coordenador</h1>

      {/* Cards de contagem */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Carda
          label="Alunos Matriculados"
          value={data?.totalAlunos}
          icon={<Users size={22} />}
          href="/app/admin/alunos"
          cor="bg-blue-500"
          isLoading={isLoading}
        />
        <Carda
          label="Turmas Ativas"
          value={data?.totalTurmas}
          icon={<BookOpen size={22} />}
          href="/app/admin/turmas"
          cor="bg-green-500"
          isLoading={isLoading}
        />
        <Carda
          label="Professores"
          value={data?.totalProfessores}
          icon={<GraduationCap size={22} />}
          href="/app/coordenador/professores"
          cor="bg-purple-500"
          isLoading={isLoading}
        />
        <Carda
          label="Comunicados este Mês"
          value={data?.comunicadosMes}
          icon={<Bell size={22} />}
          href="/app/comunicados"
          cor="bg-indigo-500"
          isLoading={isLoading}
        />
        <Carda
          label="Diários Pendentes"
          value={data?.diariosPendentes}
          icon={<FileText size={22} />}
          href="/app/coordenador/diarios"
          cor="bg-orange-500"
          isLoading={isLoading}
        />
      </div>

      {/* Eventos próximos */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-zab-verde" />
            <h2 className="text-base font-semibold text-zab-verde">Eventos Próximos (7 dias)</h2>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-stone-100" />)}
            </div>
          ) : data?.eventosProximos && data.eventosProximos.length > 0 ? (
            <div className="space-y-2">
              {data.eventosProximos.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 text-sm">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${TIPO_EVENTO_COR[e.tipo] ?? 'bg-stone-100 text-stone-600'}`}>
                    {e.tipo}
                  </span>
                  <span className="flex-1 text-zab-texto">{e.nome}</span>
                  <span className="text-xs text-zab-texto-claro">
                    {new Date(e.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zab-texto-claro">Nenhum evento previsto para os próximos dias.</p>
          )}
        </CardContent>
      </Card>

      {/* Aniversariantes de hoje */}
      {aniversariantesHoje > 0 && (
        <Link href="/app/coordenador/aniversariantes">
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
