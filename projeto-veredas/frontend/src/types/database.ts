export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      escolas: {
        Row: {
          id: string
          slug: string
          nome: string
          razao_social: string | null
          cnpj: string | null
          endereco: Json
          contato: Json
          identidade_visual: Json
          config_academica: Json
          config_frequencia: Json
          modulos_ativos: Json
          textos: Json
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          nome: string
          razao_social?: string | null
          cnpj?: string | null
          endereco?: Json
          contato?: Json
          identidade_visual?: Json
          config_academica?: Json
          config_frequencia?: Json
          modulos_ativos?: Json
          textos?: Json
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          nome?: string
          razao_social?: string | null
          cnpj?: string | null
          endereco?: Json
          contato?: Json
          identidade_visual?: Json
          config_academica?: Json
          config_frequencia?: Json
          modulos_ativos?: Json
          textos?: Json
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
