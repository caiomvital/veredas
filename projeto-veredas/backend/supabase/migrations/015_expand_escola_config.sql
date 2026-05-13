-- Migration 015: Expandir configurações da escola
-- Novos campos: config_financeira, config_portal
-- Expansão: config_academica, textos

-- ============================================================
-- config_financeira: configurações financeiras da escola
-- ============================================================
ALTER TABLE escolas ADD COLUMN IF NOT EXISTS config_financeira JSONB DEFAULT '{}'::jsonb;

-- ============================================================
-- config_portal: permissões do portal do responsável
-- ============================================================
ALTER TABLE escolas ADD COLUMN IF NOT EXISTS config_portal JSONB DEFAULT '{}'::jsonb;

-- ============================================================
-- Valores padrão para escolas existentes
-- ============================================================
UPDATE escolas SET
  config_financeira = jsonb_build_object(
    'dia_vencimento', 10,
    'percentual_multa', 2.0,
    'juros_ao_dia', 0.033,
    'cobra_taxa_matricula', false,
    'valor_taxa_matricula', 0,
    'desconto_pontualidade', false,
    'percentual_desconto_pontualidade', 0
  )
WHERE config_financeira = '{}'::jsonb;

UPDATE escolas SET
  config_portal = jsonb_build_object(
    'pode_ver_notas', true,
    'pode_ver_frequencia', true,
    'pode_ver_financeiro', true,
    'pode_ver_agenda', true,
    'pode_ver_comunicados', true,
    'pode_ver_calendario', true,
    'pode_justificar_falta', false,
    'pode_solicitar_documentos', false,
    'pode_responder_agenda', true,
    'pode_atualizar_dados', false
  )
WHERE config_portal = '{}'::jsonb;
