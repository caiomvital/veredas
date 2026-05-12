export interface Escola {
  id: string
  slug: string
  nome: string
  razao_social: string | null
  cnpj: string | null
  endereco: Endereco
  contato: Contato
  identidade_visual: IdentidadeVisual
  config_academica: ConfigAcademica
  config_frequencia: ConfigFrequencia
  modulos_ativos: ModulosAtivos
  textos: TextosEscola
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Endereco {
  cep?: string
  rua?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
}

export interface Contato {
  telefone?: string
  email?: string
  site?: string
  redes_sociais?: { tipo: string; url: string }[]
}

export interface IdentidadeVisual {
  cor_primaria: string
  cor_secundaria: string
  cor_fundo?: string
  cor_texto?: string
  logo_url: string
  icone_url: string
}

export interface ConfigAcademica {
  regime: 'bimestral' | 'trimestral' | 'semestral'
  media_aprovacao: number
  qtd_avaliacoes_por_periodo: number
}

export interface ConfigFrequencia {
  minimo_aprovacao: number
}

export interface ModulosAtivos {
  financeiro: boolean
  comunicados: boolean
  calendario: boolean
  portal_responsavel: boolean
}

export interface TextosEscola {
  titulo_boletim?: string
  rodape_boletim?: string
  template_declaracao?: string
}

export type Perfil = 'admin' | 'coordenador' | 'secretaria' | 'professor' | 'responsavel'

export interface SchoolConfig {
  id: string
  slug: string
  nome: string
  cnpj: string | null
  endereco: Endereco
  contato: Contato
  identidade_visual: IdentidadeVisual
  config_academica: ConfigAcademica
  config_frequencia: ConfigFrequencia
  modulos_ativos: ModulosAtivos
  textos: TextosEscola
}
