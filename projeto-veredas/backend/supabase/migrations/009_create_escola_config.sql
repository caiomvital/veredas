-- Migration 009: Novos campos na tabela escolas para Configurações da Escola
-- Veredas - Módulo de configurações dinâmicas

ALTER TABLE escolas ADD COLUMN IF NOT EXISTS diretor_nome TEXT;
ALTER TABLE escolas ADD COLUMN IF NOT EXISTS diretor_cargo TEXT;
ALTER TABLE escolas ADD COLUMN IF NOT EXISTS ano_letivo_atual INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
ALTER TABLE escolas ADD COLUMN IF NOT EXISTS niveis_ensino JSONB DEFAULT '[]'::jsonb;

-- Atualizar seed com valores padrão
UPDATE escolas SET
  ano_letivo_atual = EXTRACT(YEAR FROM CURRENT_DATE)::int,
  diretor_nome = 'Diretor(a)',
  diretor_cargo = 'Diretor(a)'
WHERE ano_letivo_atual IS NULL;
