-- Migration 012: Fase 8 — Complementos Pedagógicos e Financeiros
-- Justificativa de falta, campo de recibo, declaração de frequência

-- ============================================================
-- Justificativa de falta na tabela frequencias
-- ============================================================
ALTER TABLE frequencias ADD COLUMN IF NOT EXISTS justificada BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE frequencias ADD COLUMN IF NOT EXISTS motivo_justificativa TEXT;

-- ============================================================
-- Número de recibo na tabela lancamentos_financeiros
-- ============================================================
ALTER TABLE lancamentos_financeiros ADD COLUMN IF NOT EXISTS numero_recibo TEXT;
ALTER TABLE lancamentos_financeiros ADD COLUMN IF NOT EXISTS mes_referencia INTEGER CHECK (mes_referencia >= 1 AND mes_referencia <= 12);
ALTER TABLE lancamentos_financeiros ADD COLUMN IF NOT EXISTS ano_referencia INTEGER;

CREATE INDEX IF NOT EXISTS idx_lancamentos_recibo ON lancamentos_financeiros (escola_id, numero_recibo);

-- ============================================================
-- Função para calcular frequência do aluno
-- ============================================================
CREATE OR REPLACE FUNCTION calcular_frequencia_aluno(
  p_matricula_id UUID,
  p_periodo_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_aulas BIGINT,
  total_presencas BIGINT,
  total_faltas BIGINT,
  total_justificadas BIGINT,
  frequencia_pct NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total BIGINT;
  v_presencas BIGINT;
  v_justificadas BIGINT;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE presenca = true), COUNT(*) FILTER (WHERE justificada = true)
  INTO v_total, v_presencas, v_justificadas
  FROM frequencias
  WHERE matricula_id = p_matricula_id;

  RETURN QUERY
  SELECT
    v_total,
    v_presencas,
    v_total - v_presencas,
    v_justificadas,
    CASE WHEN v_total > 0 THEN ROUND((v_presencas::NUMERIC / v_total) * 100, 1) ELSE 100 END;
END;
$$;

-- ============================================================
-- Função para média bimestral
-- ============================================================
CREATE OR REPLACE FUNCTION calcular_media_aluno(
  p_matricula_id UUID,
  p_turma_disciplina_id UUID,
  p_periodo_id UUID
)
RETURNS NUMERIC(4,2) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_prova NUMERIC(4,2) DEFAULT 0;
  v_trabalho NUMERIC(4,2) DEFAULT 0;
  v_recuperacao NUMERIC(4,2);
  v_media NUMERIC(4,2);
BEGIN
  SELECT valor INTO v_prova FROM notas
    WHERE matricula_id = p_matricula_id
      AND turma_disciplina_id = p_turma_disciplina_id
      AND periodo_id = p_periodo_id
      AND tipo = 'prova';

  SELECT valor INTO v_trabalho FROM notas
    WHERE matricula_id = p_matricula_id
      AND turma_disciplina_id = p_turma_disciplina_id
      AND periodo_id = p_periodo_id
      AND tipo = 'trabalho';

  v_media = (COALESCE(v_prova, 0) + COALESCE(v_trabalho, 0)) / 2;

  SELECT valor INTO v_recuperacao FROM notas
    WHERE matricula_id = p_matricula_id
      AND turma_disciplina_id = p_turma_disciplina_id
      AND periodo_id = p_periodo_id
      AND tipo = 'recuperacao';

  IF v_recuperacao IS NOT NULL AND v_media < 5 THEN
    v_media = (v_media + v_recuperacao) / 2;
  END IF;

  RETURN LEAST(ROUND(v_media, 1), 10.0);
END;
$$;
