-- Migration 017: Adicionar numero_contrato em matriculas

ALTER TABLE matriculas ADD COLUMN IF NOT EXISTS numero_contrato TEXT;

CREATE INDEX IF NOT EXISTS idx_matriculas_numero_contrato ON matriculas (numero_contrato);
