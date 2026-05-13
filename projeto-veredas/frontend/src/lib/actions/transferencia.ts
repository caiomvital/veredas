'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'
import type { Aluno, Matricula, Turma } from '@/types/entities'

export async function realizarTransferencia(alunoId: string): Promise<ActionResult<{
  isFirstTransfer: boolean
  aluno: Aluno
  matricula: Matricula | null
  turma: Turma | null
}>> {
  try {
    const supabase = await createClient()

    // 1. Get aluno
    const { data: aluno, error: errAluno } = await supabase
      .from('alunos').select('*').eq('id', alunoId).single()
    if (errAluno || !aluno) return { data: null, error: 'Aluno não encontrado' }

    const alunoData = aluno as unknown as Aluno
    const isFirstTransfer = alunoData.status !== 'transferido'

    if (isFirstTransfer) {
      // 2. Update aluno status
      const { error: errUpdAluno } = await supabase
        .from('alunos').update({ status: 'transferido' }).eq('id', alunoId)
      if (errUpdAluno) return { data: null, error: errUpdAluno.message }

      // 3. Find and cancel active matricula
      const { data: matriculas, error: errMat } = await supabase
        .from('matriculas').select('*')
        .eq('aluno_id', alunoId).eq('status', 'ativa').limit(1)
      if (errMat) return { data: null, error: errMat.message }

      if (matriculas && matriculas.length > 0) {
        const { error: errUpdMat } = await supabase
          .from('matriculas')
          .update({ status: 'cancelada', data_cancelamento: new Date().toISOString().split('T')[0] })
          .eq('id', matriculas[0].id)
        if (errUpdMat) return { data: null, error: errUpdMat.message }
      }
    }

    // 4. Refetch aluno
    const { data: alunoAtualizado } = await supabase
      .from('alunos').select('*').eq('id', alunoId).single()
    const alunoFinal = (alunoAtualizado ?? aluno) as unknown as Aluno

    // 5. Get last matricula for turma info
    const { data: lastMat } = await supabase
      .from('matriculas').select('*')
      .eq('aluno_id', alunoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let matriculaFinal: Matricula | null = null
    let turmaFinal: Turma | null = null

    if (lastMat) {
      matriculaFinal = lastMat as unknown as Matricula
      const { data: turma } = await supabase
        .from('turmas').select('*').eq('id', matriculaFinal.turma_id).single()
      if (turma) turmaFinal = turma as unknown as Turma
    }

    // 6. Revalidate paths
    revalidatePath('/app/admin/alunos')
    revalidatePath('/app/secretaria/matriculas')
    revalidatePath('/app/secretaria/transferencia')

    return {
      data: {
        isFirstTransfer,
        aluno: alunoFinal,
        matricula: matriculaFinal,
        turma: turmaFinal,
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'Erro ao realizar transferência' }
  }
}
