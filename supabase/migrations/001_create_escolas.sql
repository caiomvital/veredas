-- Migration 001: Create escolas table and seed data
-- Veredas - White-label school management system

-- Trigger helper for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Tabela: escolas
-- ============================================================
CREATE TABLE escolas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  razao_social TEXT,
  cnpj TEXT,
  endereco JSONB DEFAULT '{}'::jsonb,
  contato JSONB DEFAULT '{}'::jsonb,
  identidade_visual JSONB DEFAULT '{}'::jsonb,
  config_academica JSONB DEFAULT '{}'::jsonb,
  config_frequencia JSONB DEFAULT '{}'::jsonb,
  modulos_ativos JSONB DEFAULT '{}'::jsonb,
  textos JSONB DEFAULT '{}'::jsonb,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER escolas_updated_at
  BEFORE UPDATE ON escolas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for slug lookups (primary lookup key)
CREATE INDEX idx_escolas_slug ON escolas (slug);

-- ============================================================
-- Seed: escola de desenvolvimento
-- ============================================================
INSERT INTO escolas (slug, nome, razao_social, cnpj, endereco, contato, identidade_visual, config_academica, config_frequencia)
VALUES (
  'escola-teste',
  'Escola Teste',
  'Associação Educacional Teste Ltda.',
  '00.000.000/0001-00',
  jsonb_build_object(
    'cep', '50000-000',
    'rua', 'Rua Exemplo, 123',
    'bairro', 'Centro',
    'cidade', 'Recife',
    'uf', 'PE'
  ),
  jsonb_build_object(
    'telefone', '(81) 3000-0000',
    'email', 'contato@escolateste.com.br',
    'site', 'https://www.escolateste.com.br',
    'redes_sociais', jsonb_build_array(
      jsonb_build_object('tipo', 'instagram', 'url', 'https://instagram.com/escolateste')
    )
  ),
  jsonb_build_object(
    'cor_primaria', '#003366',
    'cor_secundaria', '#FF6B35',
    'cor_fundo', '#F9FAFB',
    'cor_texto', '#1F2937',
    'logo_url', '',
    'icone_url', ''
  ),
  jsonb_build_object(
    'regime', 'bimestral',
    'media_aprovacao', 6.0,
    'qtd_avaliacoes_por_periodo', 4
  ),
  jsonb_build_object(
    'minimo_aprovacao', 75
  )
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Helper: get school ID by slug
-- ============================================================
CREATE OR REPLACE FUNCTION get_escola_id(slug_param TEXT)
RETURNS UUID AS $$
  SELECT id FROM escolas WHERE slug = slug_param AND ativo = true LIMIT 1;
$$ LANGUAGE sql STABLE;
