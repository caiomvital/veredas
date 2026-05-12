'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { invalidateSchoolCache } from '@/lib/school'
import type { ActionResult } from './types'

export async function getEscolaConfig(): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const { data, error } = await supabase.from('escolas').select('*').eq('id', escolaId).single()
    if (error) return { data: null, error: error.message }

    return { data: data as unknown as Record<string, unknown>, error: null }
  } catch {
    return { data: null, error: 'Erro ao carregar configurações da escola' }
  }
}

export async function salvarEscolaConfig(formData: FormData): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const escolaId = user?.app_metadata?.escola_id as string | undefined
    if (!escolaId) return { data: null, error: 'Escola não identificada' }

    const dados: Record<string, unknown> = {}

    // Campos simples
    const nome = formData.get('nome') as string
    const cnpj = formData.get('cnpj') as string
    const diretorNome = formData.get('diretor_nome') as string
    const diretorCargo = formData.get('diretor_cargo') as string
    const anoLetivo = parseInt(formData.get('ano_letivo_atual') as string)
    if (!isNaN(anoLetivo)) dados.ano_letivo_atual = anoLetivo

    if (nome) dados.nome = nome
    if (cnpj) dados.cnpj = cnpj
    if (diretorNome) dados.diretor_nome = diretorNome
    if (diretorCargo) dados.diretor_cargo = diretorCargo

    // Níveis de ensino (checkbox array)
    const niveisParam = formData.getAll('niveis_ensino') as string[]
    if (niveisParam.length > 0) dados.niveis_ensino = niveisParam

    // Endereço (JSONB)
    const endereco: Record<string, string> = {}
    for (const campo of ['cep', 'rua', 'numero', 'bairro', 'cidade', 'uf']) {
      const val = formData.get(`endereco_${campo}`) as string
      if (val) endereco[campo] = val
    }
    if (Object.keys(endereco).length > 0) dados.endereco = endereco

    // Contato (JSONB)
    const contato: Record<string, string> = {}
    const telefone = formData.get('telefone') as string
    const email = formData.get('email_contato') as string
    if (telefone) contato.telefone = telefone
    if (email) contato.email = email
    if (Object.keys(contato).length > 0) dados.contato = contato

    // Redes sociais (JSONB dentro de contato)
    const redesSociais: { tipo: string; url: string }[] = []
    const instagram = formData.get('instagram_url') as string
    const facebook = formData.get('facebook_url') as string
    const whatsapp = formData.get('whatsapp_numero') as string
    if (instagram) redesSociais.push({ tipo: 'instagram', url: instagram })
    if (facebook) redesSociais.push({ tipo: 'facebook', url: facebook })
    if (whatsapp) redesSociais.push({ tipo: 'whatsapp', url: whatsapp })

    // Buscar contato atual para preservar outros campos
    const { data: current } = await supabase.from('escolas').select('contato').eq('id', escolaId).single()
    const currentContato = (current?.contato as Record<string, unknown>) ?? {}
    if (redesSociais.length > 0) {
      dados.contato = { ...(currentContato as Record<string, unknown>), ...contato, redes_sociais: redesSociais }
    }

    // Identidade visual (JSONB)
    const iv: Record<string, string> = {}
    const logoUrl = formData.get('logo_url') as string
    const corPrimaria = formData.get('cor_primaria') as string
    const corSecundaria = formData.get('cor_secundaria') as string
    if (logoUrl) iv.logo_url = logoUrl
    if (corPrimaria) iv.cor_primaria = corPrimaria
    if (corSecundaria) iv.cor_secundaria = corSecundaria
    if (Object.keys(iv).length > 0) {
      const { data: currentIv } = await supabase.from('escolas').select('identidade_visual').eq('id', escolaId).single()
      const currentIvData = (currentIv?.identidade_visual as Record<string, unknown>) ?? {}
      dados.identidade_visual = { ...currentIvData, ...iv }
    }

    // Textos (JSONB)
    const textos: Record<string, unknown> = {}
    const mensagem = formData.get('mensagem_boasvindas') as string
    const rodape = formData.get('rodape') as string
    if (mensagem) textos.mensagem_boasvindas = mensagem
    if (rodape) textos.rodape = rodape
    if (Object.keys(textos).length > 0) {
      const { data: currentTextos } = await supabase.from('escolas').select('textos').eq('id', escolaId).single()
      const currentTextosData = (currentTextos?.textos as Record<string, unknown>) ?? {}
      dados.textos = { ...currentTextosData, ...textos }
    }

    const { error } = await supabase.from('escolas').update(dados).eq('id', escolaId)
    if (error) return { data: null, error: error.message }

    invalidateSchoolCache()
    revalidatePath('/admin/configuracoes')
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Erro ao salvar configurações' }
  }
}
