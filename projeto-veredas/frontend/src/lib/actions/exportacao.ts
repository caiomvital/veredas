'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './types'

export async function exportarAlunosCSV(): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()
    const { data: alunos } = await supabase.from('alunos').select('*').order('nome_completo')
    if (!alunos) return { data: '', error: null }

    const { data: vinculos } = await supabase
      .from('responsavel_aluno')
      .select('aluno_id, grau_parentesco, responsaveis!inner(nome_completo, telefone)')

    const responsavelMap = new Map<string, { nome: string; telefone: string | null }>()
    for (const v of vinculos ?? []) {
      const r = v.responsaveis as unknown as { nome_completo: string; telefone: string | null }
      if (!responsavelMap.has(v.aluno_id)) {
        responsavelMap.set(v.aluno_id, { nome: r.nome_completo, telefone: r.telefone })
      }
    }

    const { data: matriculas } = await supabase
      .from('matriculas')
      .select('aluno_id, turmas!inner(codigo)')
      .eq('status', 'ativa')

    const turmaMap = new Map<string, string>()
    for (const m of matriculas ?? []) {
      turmaMap.set(m.aluno_id, (m.turmas as unknown as { codigo: string }).codigo)
    }

    const header = 'Nome;CPF;Nascimento;Turma;Responsável;Telefone Responsável;Status'
    const rows = alunos.map((a) => {
      const r = responsavelMap.get(a.id)
      return [
        a.nome_completo,
        a.cpf ?? '',
        a.data_nascimento ?? '',
        turmaMap.get(a.id) ?? '',
        r?.nome ?? '',
        r?.telefone ?? '',
        a.status,
      ].join(';')
    })

    return { data: [header, ...rows].join('\n'), error: null }
  } catch {
    return { data: null, error: 'Erro ao exportar alunos' }
  }
}

export async function exportarFinanceiroCSV(): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()
    const { data: lancamentos } = await supabase
      .from('lancamentos_financeiros')
      .select('*, alunos!left(nome_completo)')
      .order('data_vencimento', { ascending: false })
    if (!lancamentos) return { data: '', error: null }

    const header = 'Aluno;Mês;Ano;Valor;Status;Data Pagamento;Descrição'

    function formatDate(d: string | null) {
      if (!d) return ''
      try { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') } catch { return d }
    }

    const rows = lancamentos.map((l) => {
      const alunoNome = l.alunos ? (l.alunos as unknown as { nome_completo: string }).nome_completo : ''
      return [
        alunoNome,
        l.mes_referencia ?? '',
        l.ano_referencia ?? '',
        (l.valor ?? 0).toFixed(2),
        l.status === 'pago' ? 'Pago' : 'Pendente',
        formatDate(l.data_pagamento),
        l.descricao,
      ].join(';')
    })

    return { data: [header, ...rows].join('\n'), error: null }
  } catch {
    return { data: null, error: 'Erro ao exportar financeiro' }
  }
}

export async function exportarNotasCSV(): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()
    const { data: notas } = await supabase
      .from('notas')
      .select('valor, tipo, periodo_id, turma_disciplina_id, matricula_id, matriculas!inner(aluno_id, alunos!inner(nome_completo), turmas!inner(codigo, serie)), turma_disciplina_professor!inner(disciplina_id, disciplinas!inner(nome))')
      .order('created_at', { ascending: false })
      .limit(5000)

    if (!notas) return { data: '', error: null }

    const { data: periodos } = await supabase.from('periodos_letivos').select('id, nome').order('ordem')
    const periodoMap = new Map(periodos?.map((p) => [p.id, p.nome]) ?? [])

    const header = 'Aluno;Turma;Disciplina;Período;Tipo;Valor'
    const rows = notas.map((n) => {
      const m = n.matriculas as unknown as { alunos: { nome_completo: string }; turmas: { codigo: string; serie: string } }
      const tdp = n.turma_disciplina_professor as unknown as { disciplinas: { nome: string } }
      return [
        m.alunos.nome_completo,
        `${m.turmas.codigo} — ${m.turmas.serie}`,
        tdp.disciplinas.nome,
        periodoMap.get(n.periodo_id) ?? n.periodo_id ?? '',
        n.tipo,
        n.valor.toFixed(2),
      ].join(';')
    })

    return { data: [header, ...rows].join('\n'), error: null }
  } catch {
    return { data: null, error: 'Erro ao exportar notas' }
  }
}

export async function exportarFrequenciaCSV(): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()
    const { data: frequencias } = await supabase
      .from('frequencias')
      .select('presenca, matricula_id, turma_disciplina_id, turma_disciplina_professor!inner(disciplina_id, disciplinas!inner(nome)), matriculas!inner(aluno_id, alunos!inner(nome_completo), turmas!inner(codigo, serie))')
      .limit(5000)

    if (!frequencias) return { data: '', error: null }

    // Aggregate by aluno+disciplina
    const agg = new Map<string, { nome: string; turma: string; disciplina: string; total: number; presencas: number }>()
    for (const f of frequencias) {
      const m = f.matriculas as unknown as { alunos: { nome_completo: string }; turmas: { codigo: string; serie: string } }
      const tdp = f.turma_disciplina_professor as unknown as { disciplina_id: string; disciplinas: { nome: string } }
      const key = `${f.matricula_id}_${tdp.disciplina_id}`
      if (!agg.has(key)) {
        agg.set(key, {
          nome: m.alunos.nome_completo,
          turma: `${m.turmas.codigo} — ${m.turmas.serie}`,
          disciplina: tdp.disciplinas.nome,
          total: 0,
          presencas: 0,
        })
      }
      const e = agg.get(key)!
      e.total++
      if (f.presenca) e.presencas++
    }

    const header = 'Aluno;Turma;Disciplina;Total Aulas;Presenças;Faltas;%'
    const rows = [...agg.values()].map((e) => {
      const pct = e.total > 0 ? Math.round((e.presencas / e.total) * 100) : 100
      return [e.nome, e.turma, e.disciplina, e.total, e.presencas, e.total - e.presencas, `${pct}%`].join(';')
    })

    return { data: [header, ...rows].join('\n'), error: null }
  } catch {
    return { data: null, error: 'Erro ao exportar frequência' }
  }
}

export async function exportarFuncionariosCSV(): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()
    const { data: funcionarios } = await supabase.from('funcionarios').select('*').order('nome_completo')
    if (!funcionarios) return { data: '', error: null }

    const header = 'Nome;CPF;Cargo;E-mail;Telefone;Formação;Data Admissão;Status'
    const rows = funcionarios.map((f) =>
      [f.nome_completo, f.cpf ?? '', f.cargo, f.email, f.telefone ?? '', f.formacao ?? '', f.data_admissao ?? '', f.ativo ? 'Ativo' : 'Inativo'].join(';')
    )

    return { data: [header, ...rows].join('\n'), error: null }
  } catch {
    return { data: null, error: 'Erro ao exportar funcionários' }
  }
}

export async function exportarBackupJSON(): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const tables = ['alunos', 'funcionarios', 'responsaveis', 'responsavel_aluno', 'turmas', 'matriculas',
      'disciplinas', 'turma_disciplina_professor', 'notas', 'frequencias', 'lancamentos_financeiros',
      'config_mensalidades', 'historico_escolar', 'periodos_letivos', 'series_escolares',
      'comunicados', 'eventos_calendario', 'agenda_registros', 'avisos_whatsapp']

    const backup: Record<string, unknown[]> = {}

    for (const table of tables) {
      try {
        const { data } = await supabase.from(table).select('*')
        backup[table] = data ?? []
      } catch {
        backup[table] = []
      }
    }

    return { data: JSON.stringify(backup, null, 2), error: null }
  } catch {
    return { data: null, error: 'Erro ao exportar backup' }
  }
}
