'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, BarChart3, ClipboardList, Calendar, Users, Notebook } from 'lucide-react'
import Link from 'next/link'
import { getProfessorDashboard } from '@/lib/actions/dashboard'
import type { ProfessorData } from '@/lib/actions/dashboard'

export default function ProfessorDashboard() {
  const [data, setData] = useState<ProfessorData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getProfessorDashboard().then((res) => {
      if (res.data) setData(res.data)
      setIsLoading(false)
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
      <h1 className="mb-8 text-2xl font-bold text-zab-verde">Dashboard do Professor</h1>

      {/* Cards de resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <CardLink
          label="Aulas este Mês"
          value={data?.aulasRegistradasMes}
          icon={<Notebook size={22} />}
          href="/professor/registro-aulas"
          cor="bg-blue-500"
          isLoading={isLoading}
        />
        <CardLink
          label="Atividades p/ Corrigir"
          value={data?.atividadesPendentesCorrecao}
          icon={<ClipboardList size={22} />}
          href="/professor/atividades"
          cor="bg-orange-500"
          isLoading={isLoading}
        />
        <CardLink
          label="Lançar Notas"
          value={undefined}
          icon={<BarChart3 size={22} />}
          href="/professor/notas"
          cor="bg-green-500"
          isLoading={isLoading}
          hideValue
        />
      </div>

      {/* Minhas Turmas */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-zab-verde" />
            <h2 className="text-base font-semibold text-zab-verde">Minhas Turmas</h2>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded bg-stone-100" />)}
            </div>
          ) : data?.minhasTurmas && data.minhasTurmas.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {data.minhasTurmas.map((t) => (
                <Link key={t.id} href={`/professor/minhas-turmas`} className="flex items-center justify-between py-3 hover:bg-stone-50 -mx-5 px-5 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-zab-texto-escuro">
                      {t.turma_codigo} — {t.turma_serie}
                    </p>
                    <p className="text-xs text-zab-texto-claro">
                      {t.turma_turno} · {t.disciplina_nome}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-zab-texto-claro">
                    <Users size={14} />
                    <span>{t.qtdAlunos}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zab-texto-claro">Nenhuma turma vinculada.</p>
          )}
        </CardContent>
      </Card>

      {/* Próximos Eventos + Ações Rápidas */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-zab-verde" />
              <h2 className="text-base font-semibold text-zab-verde">Próximos Eventos</h2>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-stone-100" />)}
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
              <p className="text-sm text-zab-texto-claro">Nenhum evento nos próximos dias.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-base font-semibold text-zab-verde mb-4">Acesso Rápido</h2>
            <div className="grid grid-cols-2 gap-2">
              {acoes.map((a) => (
                <Link key={a.href} href={a.href}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-stone-200 p-3 text-center hover:bg-stone-50 transition-colors">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.cor} text-white`}>
                    {a.icon}
                  </div>
                  <span className="text-[11px] font-medium text-zab-texto leading-tight">{a.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const acoes = [
  { label: 'Chamada', href: '/professor/chamada', icon: <ClipboardList size={16} />, cor: 'bg-orange-500' },
  { label: 'Lançar Notas', href: '/professor/notas', icon: <BarChart3 size={16} />, cor: 'bg-green-500' },
  { label: 'Boletins', href: '/professor/boletins', icon: <BarChart3 size={16} />, cor: 'bg-purple-500' },
  { label: 'Reg. Aulas', href: '/professor/registro-aulas', icon: <Notebook size={16} />, cor: 'bg-blue-500' },
  { label: 'Planejamento', href: '/professor/planejamento', icon: <BookOpen size={16} />, cor: 'bg-indigo-500' },
  { label: 'Atividades', href: '/professor/atividades', icon: <ClipboardList size={16} />, cor: 'bg-amber-500' },
]

function CardLink({ label, value, icon, href, cor, isLoading, hideValue }: {
  label: string; value?: number; icon: React.ReactNode; href: string; cor: string; isLoading: boolean; hideValue?: boolean
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
                {!hideValue && <p className="text-xl font-bold text-zab-texto-escuro">{value ?? '—'}</p>}
                <p className="text-xs text-zab-texto-claro">{label}</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
