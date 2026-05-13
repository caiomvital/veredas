-- Migration 014: Adicionar campos de saúde e informações complementares na tabela alunos
ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS tipo_sanguineo TEXT,
  ADD COLUMN IF NOT EXISTS alergias TEXT,
  ADD COLUMN IF NOT EXISTS medicamentos TEXT,
  ADD COLUMN IF NOT EXISTS plano_saude TEXT,
  ADD COLUMN IF NOT EXISTS observacoes_medicas TEXT,
  ADD COLUMN IF NOT EXISTS pode_sair_sozinho BOOLEAN NOT NULL DEFAULT false;
