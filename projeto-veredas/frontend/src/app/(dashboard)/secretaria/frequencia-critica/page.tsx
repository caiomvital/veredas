'use client'

import { useEffect, useState, useMemo } from 'react'
import { listarFrequenciaCritica, type AlunoFrequenciaCritica } from '@/lib/actions/frequencia-critica'
import { Card, CardContent } from '@/components/ui/card'

export default function FrequenciaCriticaPage() {
  const [alunos, setAlunos] = useState<AlunoFrequenciaCritica[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'atencao' | 'critico'>('todos')

  useEffect(() => {
    listarFrequenciaCritica().then((res) => {
      if (res.error) setError(res.error)
      else setAlunos(res.data ?? [])
      setIsLoading(false)
    })
  }, [])

  const filtrados = useMemo(() => {
    if (filtro === 'todos') return alunos
    return alunos.filter((a) => a.nivel === filtro)
  }, [alunos, filtro])

  const criticos = alunos.filter((a) => a.nivel === 'critico').length
  const atencao = alunos.filter((a) => a.nivel === 'atencao').length

  function gerarMensagemWhatsApp(a: AlunoFrequenciaCritica): string {
    const msg = `Olá! O aluno ${a.alunoNome} da turma ${a.turmaCodigo} está com ${a.frequenciaPct}% de frequência na disciplina ${a.disciplinaNome}. Por favor, regularize a situação.`
    return encodeURIComponent(msg)
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-primary-800)]">Frequência Crítica</h1>
      <p className="text-sm text-gray-500 mb-6">Alunos com frequência abaixo de 80% — atenção ou risco de reprovação por falta.</p>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{atencao}</p>
            <p className="text-xs text-yellow-600">Atenção (80% &gt; freq ≥ 75%)</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{criticos}</p>
            <p className="text-xs text-red-600">Crítico (freq &lt; 75%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {(['todos', 'atencao', 'critico'] as const).map((f) => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filtro === f ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {f === 'todos' ? 'Todos' : f === 'atencao' ? 'Atenção' : 'Crítico'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-gray-100" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-400">
            {alunos.length === 0 ? 'Nenhum aluno com frequência crítica.' : 'Nenhum resultado para o filtro selecionado.'}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Aluno</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Turma</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Disciplina</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Frequência</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Faltas</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Pode Faltar</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Nível</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtrados.map((a, i) => (
                <tr key={`${a.alunoId}_${a.disciplinaId}_${i}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{a.alunoNome}</td>
                  <td className="px-4 py-3 text-gray-600">{a.turmaCodigo} — {a.turmaSerie}</td>
                  <td className="px-4 py-3 text-gray-600">{a.disciplinaNome}</td>
                  <td className="px-4 py-3 text-center font-medium">{a.frequenciaPct}%</td>
                  <td className="px-4 py-3 text-center text-red-600">{a.faltas}</td>
                  <td className="px-4 py-3 text-center">{a.aulasPodeFaltar}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      a.nivel === 'critico'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    }`}>
                      {a.nivel === 'critico' ? 'Crítico' : 'Atenção'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <a
                      href={`https://wa.me/?text=${gerarMensagemWhatsApp(a)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      Avisar
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {alunos.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Legenda</h3>
            <div className="space-y-1 text-xs text-gray-500">
              <p><span className="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-1" /> <strong>Atenção</strong>: Frequência entre 75% e 80% — pode recuperar</p>
              <p><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1" /> <strong>Crítico</strong>: Frequência abaixo de 75% — risco de reprovação por falta</p>
              <p><span className="font-medium">Pode Faltar</span>: Quantas aulas ainda pode faltar sem atingir 75%</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
