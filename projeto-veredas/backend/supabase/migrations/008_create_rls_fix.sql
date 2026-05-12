-- Migration 008: Fix RLS policies for financeiro tables
-- Veredas - Adiciona políticas de INSERT/UPDATE/DELETE que estavam faltando

-- ============================================================
-- config_mensalidades: adicionar políticas de escrita
-- ============================================================

-- Já existe policy de SELECT (USING), adicionar INSERT
DROP POLICY IF EXISTS "config_mensalidades_insert" ON config_mensalidades;
CREATE POLICY "config_mensalidades_insert" ON config_mensalidades
  FOR INSERT
  WITH CHECK (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

-- UPDATE policy
DROP POLICY IF EXISTS "config_mensalidades_update" ON config_mensalidades;
CREATE POLICY "config_mensalidades_update" ON config_mensalidades
  FOR UPDATE
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid)
  WITH CHECK (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

-- DELETE policy
DROP POLICY IF EXISTS "config_mensalidades_delete" ON config_mensalidades;
CREATE POLICY "config_mensalidades_delete" ON config_mensalidades
  FOR DELETE
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

-- ============================================================
-- lancamentos_financeiros: adicionar políticas de escrita
-- ============================================================

-- INSERT policy
DROP POLICY IF EXISTS "lancamentos_financeiros_insert" ON lancamentos_financeiros;
CREATE POLICY "lancamentos_financeiros_insert" ON lancamentos_financeiros
  FOR INSERT
  WITH CHECK (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

-- UPDATE policy (necessário para baixar pagamento)
DROP POLICY IF EXISTS "lancamentos_financeiros_update" ON lancamentos_financeiros;
CREATE POLICY "lancamentos_financeiros_update" ON lancamentos_financeiros
  FOR UPDATE
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid)
  WITH CHECK (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

-- DELETE policy
DROP POLICY IF EXISTS "lancamentos_financeiros_delete" ON lancamentos_financeiros;
CREATE POLICY "lancamentos_financeiros_delete" ON lancamentos_financeiros
  FOR DELETE
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);
