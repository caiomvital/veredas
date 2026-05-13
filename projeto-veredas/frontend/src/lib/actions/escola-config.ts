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
    // Documentos
    const tdMatricula = formData.get('template_declaracao_matricula') as string
    const tdFrequencia = formData.get('template_declaracao_frequencia') as string
    const clausulas = formData.get('clausulas_contrato') as string
    const cidadeRodape = formData.get('cidade_rodape') as string
    const ufRodape = formData.get('uf_rodape') as string
    const assinanteNome = formData.get('assinante_nome') as string
    const assinanteCargo = formData.get('assinante_cargo') as string
    if (tdMatricula) textos.template_declaracao_matricula = tdMatricula
    if (tdFrequencia) textos.template_declaracao_frequencia = tdFrequencia
    if (clausulas) textos.clausulas_contrato = clausulas
    if (cidadeRodape) textos.cidade_rodape = cidadeRodape
    if (ufRodape) textos.uf_rodape = ufRodape
    if (assinanteNome) textos.assinante_nome = assinanteNome
    if (assinanteCargo) textos.assinante_cargo = assinanteCargo
    if (Object.keys(textos).length > 0) {
      const { data: currentTextos } = await supabase.from('escolas').select('textos').eq('id', escolaId).single()
      const currentTextosData = (currentTextos?.textos as Record<string, unknown>) ?? {}
      dados.textos = { ...currentTextosData, ...textos }
    }

    // Config acadêmica (JSONB)
    const configAcademica: Record<string, unknown> = {}
    const sistemaAvaliacao = formData.get('sistema_avaliacao') as string
    const mediaMinima = formData.get('media_minima') as string
    const numPeriodos = formData.get('num_periodos') as string
    const nomesPeriodos = formData.get('nomes_periodos') as string
    const temRecParalela = formData.get('tem_recuperacao_paralela') as string
    const temRecFinal = formData.get('tem_recuperacao_final') as string
    const pesoProva = formData.get('peso_prova') as string
    const pesoTrabalho = formData.get('peso_trabalho') as string
    if (sistemaAvaliacao) configAcademica.sistema_avaliacao = sistemaAvaliacao
    if (mediaMinima) configAcademica.media_minima = parseFloat(mediaMinima)
    if (numPeriodos) configAcademica.num_periodos = parseInt(numPeriodos)
    if (nomesPeriodos) configAcademica.nomes_periodos = nomesPeriodos
    if (temRecParalela) configAcademica.tem_recuperacao_paralela = temRecParalela === 'sim'
    if (temRecFinal) configAcademica.tem_recuperacao_final = temRecFinal === 'sim'
    if (pesoProva) configAcademica.peso_prova = parseFloat(pesoProva)
    if (pesoTrabalho) configAcademica.peso_trabalho = parseFloat(pesoTrabalho)
    if (Object.keys(configAcademica).length > 0) {
      const { data: currentCA } = await supabase.from('escolas').select('config_academica').eq('id', escolaId).single()
      const currentCAData = (currentCA?.config_academica as Record<string, unknown>) ?? {}
      dados.config_academica = { ...currentCAData, ...configAcademica }
    }

    // Config financeira (JSONB)
    const configFinanceira: Record<string, unknown> = {}
    const diaVenc = formData.get('dia_vencimento') as string
    const percMulta = formData.get('percentual_multa') as string
    const jurosDia = formData.get('juros_ao_dia') as string
    const cobraTaxa = formData.get('cobra_taxa_matricula') as string
    const valorTaxa = formData.get('valor_taxa_matricula') as string
    const descPont = formData.get('desconto_pontualidade') as string
    const percDesc = formData.get('percentual_desconto_pontualidade') as string
    if (diaVenc) configFinanceira.dia_vencimento = parseInt(diaVenc)
    if (percMulta) configFinanceira.percentual_multa = parseFloat(percMulta)
    if (jurosDia) configFinanceira.juros_ao_dia = parseFloat(jurosDia)
    if (cobraTaxa) configFinanceira.cobra_taxa_matricula = cobraTaxa === 'sim'
    if (valorTaxa) configFinanceira.valor_taxa_matricula = parseFloat(valorTaxa)
    if (descPont) configFinanceira.desconto_pontualidade = descPont === 'sim'
    if (percDesc) configFinanceira.percentual_desconto_pontualidade = parseFloat(percDesc)
    if (Object.keys(configFinanceira).length > 0) {
      const { data: currentCF } = await supabase.from('escolas').select('config_financeira').eq('id', escolaId).single()
      const currentCFData = (currentCF?.config_financeira as Record<string, unknown>) ?? {}
      dados.config_financeira = { ...currentCFData, ...configFinanceira }
    }

    // Config portal (JSONB)
    const configPortal: Record<string, unknown> = {}
    const portalCampos = [
      'pode_ver_notas', 'pode_ver_frequencia', 'pode_ver_financeiro',
      'pode_ver_agenda', 'pode_ver_comunicados', 'pode_ver_calendario',
      'pode_justificar_falta', 'pode_solicitar_documentos', 'pode_responder_agenda',
    ]
    for (const campo of portalCampos) {
      configPortal[campo] = formData.get(campo) === 'on'
    }
    const podeAtualizar = formData.get('pode_atualizar_dados') as string
    if (podeAtualizar === 'sim') configPortal.pode_atualizar_dados = true
    if (podeAtualizar === 'nao') configPortal.pode_atualizar_dados = false
    if (Object.keys(configPortal).length > 0) {
      const { data: currentCP } = await supabase.from('escolas').select('config_portal').eq('id', escolaId).single()
      const currentCPData = (currentCP?.config_portal as Record<string, unknown>) ?? {}
      dados.config_portal = { ...currentCPData, ...configPortal }
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
