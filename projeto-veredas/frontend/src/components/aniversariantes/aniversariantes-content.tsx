'use client'

import { useEffect, useState, useCallback } from 'react'
import { getAniversariantesMes } from '@/lib/actions/aniversariantes'
import type { AniversariantesMes } from '@/lib/actions/aniversariantes'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Cake, CalendarDays } from 'lucide-react'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function formatarData(data: string): string {
  const d = new Date(data + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date()
  const nasc = new Date(dataNascimento + 'T12:00:00')
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const mesAtual = hoje.getMonth() + 1
  const diaAtual = hoje.getDate()
  const mesNasc = nasc.getMonth() + 1
  const diaNasc = nasc.getDate()
  if (mesAtual < mesNasc || (mesAtual === mesNasc && diaAtual < diaNasc)) {
    idade--
  }
  return idade
}

function ehHoje(dataNascimento: string): boolean {
  const hoje = new Date()
  const mesHoje = String(hoje.getMonth() + 1).padStart(2, '0')
  const diaHoje = String(hoje.getDate()).padStart(2, '0')
  return dataNascimento?.endsWith(`-${mesHoje}-${diaHoje}`) ?? false
}

export default function AniversariantesContent() {
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())
  const [data, setData] = useState<AniversariantesMes | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    const result = await getAniversariantesMes(mes, ano)
    if (result.data) setData(result.data)
    setIsLoading(false)
  }, [mes, ano])

  useEffect(() => { load() }, [load])

  function mesAnterior() {
    if (mes === 1) { setMes(12); setAno(ano - 1) }
    else { setMes(mes - 1) }
  }

  function proximoMes() {
    if (mes === 12) { setMes(1); setAno(ano + 1) }
    else { setMes(mes + 1) }
  }

  function voltarMesAtual() {
    setMes(hoje.getMonth() + 1)
    setAno(hoje.getFullYear())
  }

  const alunosDoDia = data?.alunos.filter((a) => ehHoje(a.data_nascimento)) ?? []
  const alunosOutros = data?.alunos.filter((a) => !ehHoje(a.data_nascimento)) ?? []
  const funcsDoDia = data?.funcionarios.filter((f) => ehHoje(f.data_nascimento)) ?? []
  const funcsOutros = data?.funcionarios.filter((f) => !ehHoje(f.data_nascimento)) ?? []
  const temHoje = alunosDoDia.length + funcsDoDia.length > 0
  const ehMesAtual = mes === hoje.getMonth() + 1 && ano === hoje.getFullYear()

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header com navegação de mês */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-primary-800)]">Aniversariantes do Mês</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={mesAnterior}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2 min-w-[200px] justify-center">
            <button
              onClick={voltarMesAtual}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <CalendarDays size={16} />
              <span>{MESES[mes - 1]} {ano}</span>
            </button>
          </div>

          <button
            onClick={proximoMes}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-stone-100" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && data && data.alunos.length === 0 && data.funcionarios.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Cake size={48} className="text-stone-300" />
            <p className="text-lg font-medium text-stone-500">Nenhum aniversariante este mês</p>
            <p className="text-sm text-stone-400">
              {ehMesAtual
                ? 'Não há alunos ou funcionários fazendo aniversário neste mês.'
                : `Não há aniversariantes em ${MESES[mes - 1].toLowerCase()} de ${ano}.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Hoje */}
      {!isLoading && temHoje && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
              <Cake size={16} className="text-amber-600" />
            </span>
            <h2 className="text-base font-semibold text-amber-700">
              Aniversariantes de Hoje
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {alunosDoDia.map((a) => (
              <Card key={a.id} className="border-amber-300 bg-amber-50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-700">
                    <Cake size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-amber-900 truncate">{a.nome_completo}</p>
                    <p className="text-xs text-amber-700">
                      {a.turma_codigo ? `${a.turma_serie} - ${a.turma_codigo}` : 'Aluno(a)'}
                      {' · '}Faz {calcularIdade(a.data_nascimento) + 1} anos
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {funcsDoDia.map((f) => (
              <Card key={f.id} className="border-amber-300 bg-amber-50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-700">
                    <Cake size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-amber-900 truncate">{f.nome_completo}</p>
                    <p className="text-xs text-amber-700">
                      {f.cargo}
                      {' · '}Faz {calcularIdade(f.data_nascimento) + 1} anos
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Alunos do mês (exceto os de hoje) */}
      {!isLoading && alunosOutros.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-semibold text-[var(--color-primary-800)]">
              Alunos ({data?.alunos.length})
            </h2>
          </div>
          <div className="space-y-2">
            {alunosOutros.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Cake size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{a.nome_completo}</p>
                    <p className="text-xs text-stone-500">
                      {a.turma_codigo ? `${a.turma_serie} - ${a.turma_codigo}` : 'Sem turma'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[var(--color-primary-700)]">
                      {formatarData(a.data_nascimento)}
                    </p>
                    <p className="text-xs text-stone-400">
                      {calcularIdade(a.data_nascimento) + 1} anos
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Funcionários do mês (exceto os de hoje) */}
      {!isLoading && funcsOutros.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-semibold text-[var(--color-primary-800)]">
              Funcionários ({data?.funcionarios.length})
            </h2>
          </div>
          <div className="space-y-2">
            {funcsOutros.map((f) => (
              <Card key={f.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <Cake size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{f.nome_completo}</p>
                    <p className="text-xs text-stone-500">{f.cargo}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[var(--color-primary-700)]">
                      {formatarData(f.data_nascimento)}
                    </p>
                    <p className="text-xs text-stone-400">
                      {calcularIdade(f.data_nascimento) + 1} anos
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
