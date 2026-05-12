-- Migration 008 + 009 consolidated — run this in Supabase SQL Editor

-- ============================================================
-- 008: Fix RLS policies for financeiro tables
-- ============================================================

DROP POLICY IF EXISTS "config_mensalidades_insert" ON config_mensalidades;
CREATE POLICY "config_mensalidades_insert" ON config_mensalidades
  FOR INSERT
  WITH CHECK (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

DROP POLICY IF EXISTS "config_mensalidades_update" ON config_mensalidades;
CREATE POLICY "config_mensalidades_update" ON config_mensalidades
  FOR UPDATE
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid)
  WITH CHECK (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

DROP POLICY IF EXISTS "config_mensalidades_delete" ON config_mensalidades;
CREATE POLICY "config_mensalidades_delete" ON config_mensalidades
  FOR DELETE
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

DROP POLICY IF EXISTS "lancamentos_financeiros_insert" ON lancamentos_financeiros;
CREATE POLICY "lancamentos_financeiros_insert" ON lancamentos_financeiros
  FOR INSERT
  WITH CHECK (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

DROP POLICY IF EXISTS "lancamentos_financeiros_update" ON lancamentos_financeiros;
CREATE POLICY "lancamentos_financeiros_update" ON lancamentos_financeiros
  FOR UPDATE
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid)
  WITH CHECK (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

DROP POLICY IF EXISTS "lancamentos_financeiros_delete" ON lancamentos_financeiros;
CREATE POLICY "lancamentos_financeiros_delete" ON lancamentos_financeiros
  FOR DELETE
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

-- ============================================================
-- 009: New columns on escolas table
-- ============================================================

ALTER TABLE escolas ADD COLUMN IF NOT EXISTS diretor_nome TEXT;
ALTER TABLE escolas ADD COLUMN IF NOT EXISTS diretor_cargo TEXT;
ALTER TABLE escolas ADD COLUMN IF NOT EXISTS ano_letivo_atual INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
ALTER TABLE escolas ADD COLUMN IF NOT EXISTS niveis_ensino JSONB DEFAULT '[]'::jsonb;

UPDATE escolas SET
  ano_letivo_atual = EXTRACT(YEAR FROM CURRENT_DATE)::int,
  diretor_nome = 'Diretor(a)',
  diretor_cargo = 'Diretor(a)'
WHERE ano_letivo_atual IS NULL;
