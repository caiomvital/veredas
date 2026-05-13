'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './types'

const SERIES_PADRAO: Record<string, { nome: string; ordem: number }[]> = {
  infantil: [
    { nome: 'Maternal I', ordem: 1 },
    { nome: 'Maternal II', ordem: 2 },
    { nome: 'Jardim I', ordem: 3 },
    { nome: 'Jardim II', ordem: 4 },
    { nome: 'Pré I', ordem: 5 },
    { nome: 'Pré II', ordem: 6 },
  ],
  fund1: [
    { nome: '1º Ano', ordem: 7 },
    { nome: '2º Ano', ordem: 8 },
    { nome: '3º Ano', ordem: 9 },
    { nome: '4º Ano', ordem: 10 },
    { nome: '5º Ano', ordem: 11 },
  ],
  fund2: [
    { nome: '6º Ano', ordem: 12 },
    { nome: '7º Ano', ordem: 13 },
    { nome: '8º Ano', ordem: 14 },
    { nome: '9º Ano', ordem: 15 },
  ],
  medio: [
    { nome: '1ª Série', ordem: 16 },
    { nome: '2ª Série', ordem: 17 },
    { nome: '3ª Série', ordem: 18 },
  ],
}

export async function salvarOnboarding(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const dados: Record<string, unknown> = {}

    // ─── Identidade ───
    const nome = formData.get('nome') as string
    const slogan = formData.get('slogan') as string
    const cnpj = formData.get('cnpj') as string
    const logoUrl = formData.get('logo_url') as string
    const corPrimaria = formData.get('cor_primaria') as string
    const corSecundaria = formData.get('cor_secundaria') as string

    if (nome) dados.nome = nome
    if (cnpj) dados.cnpj = cnpj

    // Identidade visual (JSONB)
    const iv: Record<string, string> = {}
    if (logoUrl) iv.logo_url = logoUrl
    if (corPrimaria) iv.cor_primaria = corPrimaria
    if (corSecundaria) iv.cor_secundaria = corSecundaria
    if (Object.keys(iv).length > 0) dados.identidade_visual = iv

    // Textos (slogan)
    if (slogan) {
      dados.textos = { slogan }
    }

    // ─── Dados institucionais ───
    const diretorNome = formData.get('diretor_nome') as string
    const diretorCargo = formData.get('diretor_cargo') as string
    const telefone = formData.get('telefone') as string
    const email = formData.get('email_contato') as string

    if (diretorNome) dados.diretor_nome = diretorNome
    if (diretorCargo) dados.diretor_cargo = diretorCargo

    const endereco: Record<string, string> = {}
    for (const campo of ['cep', 'rua', 'numero', 'bairro', 'cidade', 'uf']) {
      const val = formData.get(`endereco_${campo}`) as string
      if (val) endereco[campo] = val
    }
    if (Object.keys(endereco).length > 0) dados.endereco = endereco

    const contato: Record<string, string> = {}
    if (telefone) contato.telefone = telefone
    if (email) contato.email = email
    if (Object.keys(contato).length > 0) dados.contato = contato

    // ─── Estrutura escolar ───
    const anoLetivo = parseInt(formData.get('ano_letivo_atual') as string)
    if (!isNaN(anoLetivo)) dados.ano_letivo_atual = anoLetivo

    const niveisSelecionados = formData.getAll('niveis_ensino') as string[]
    dados.niveis_ensino = niveisSelecionados

    // Criar séries padrão para os níveis selecionados
    for (const nivel of niveisSelecionados) {
      const series = SERIES_PADRAO[nivel]
      if (series) {
        for (const serie of series) {
          await supabase.from('series_escolares').insert({
            escola_id: escolaId,
            nivel,
            nome: serie.nome,
            ordem: serie.ordem,
          }).maybeSingle()
        }
      }
    }

    // ─── Pedagógico ───
    const configAcademica: Record<string, unknown> = {}
    const sistemaAvaliacao = formData.get('sistema_avaliacao') as string
    const mediaMinima = formData.get('media_minima') as string
    const numPeriodos = formData.get('num_periodos') as string
    const temRecuperacao = formData.get('tem_recuperacao') as string

    if (sistemaAvaliacao) configAcademica.sistema_avaliacao = sistemaAvaliacao
    if (mediaMinima) configAcademica.media_minima = parseFloat(mediaMinima)
    if (numPeriodos) configAcademica.num_periodos = parseInt(numPeriodos)
    if (temRecuperacao) configAcademica.tem_recuperacao = temRecuperacao === 'sim'

    if (Object.keys(configAcademica).length > 0) dados.config_academica = configAcademica

    // ─── Financeiro ───
    const configFinanceira: Record<string, unknown> = {}
    const diaVenc = formData.get('dia_vencimento') as string
    const percMulta = formData.get('percentual_multa') as string

    if (diaVenc) configFinanceira.dia_vencimento = parseInt(diaVenc)
    if (percMulta) configFinanceira.percentual_multa = parseFloat(percMulta)

    if (Object.keys(configFinanceira).length > 0) dados.config_financeira = configFinanceira

    // ─── Finalizar ───
    dados.configuracao_concluida = true

    const { error } = await supabase.from('escolas').update(dados).eq('id', escolaId)
    if (error) return { data: null, error: error.message }

    // Atualizar app_metadata do admin para evitar query extra no middleware
    if (user) {
      await admin.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...user.app_metadata,
          configuracao_concluida: true,
        },
      })
    }

    revalidatePath('/app/admin')
    revalidatePath('/app/admin/onboarding')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao salvar configurações' }
  }
}
