-- Migration 005: Create Fase 5b tables
-- Veredas - Financeiro v1: config_mensalidades, lancamentos_financeiros

-- ============================================================
-- Tabela: config_mensalidades
-- ============================================================
CREATE TABLE config_mensalidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  serie TEXT NOT NULL,
  ano_letivo INTEGER NOT NULL,
  valor NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(escola_id, serie, ano_letivo)
);

CREATE TRIGGER config_mensalidades_updated_at
  BEFORE UPDATE ON config_mensalidades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_config_mensalidades_escola_ano ON config_mensalidades (escola_id, ano_letivo);

ALTER TABLE config_mensalidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config_mensalidades_isolation" ON config_mensalidades
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

-- ============================================================
-- Tabela: lancamentos_financeiros
-- ============================================================
CREATE TABLE lancamentos_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES alunos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('mensalidade', 'extra')),
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
  data_pagamento DATE,
  multa NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (multa >= 0),
  pago_em TIMESTAMPTZ,
  baixado_por UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  criado_por UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER lancamentos_financeiros_updated_at
  BEFORE UPDATE ON lancamentos_financeiros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_lancamentos_escola_status ON lancamentos_financeiros (escola_id, status);
CREATE INDEX idx_lancamentos_aluno ON lancamentos_financeiros (aluno_id);
CREATE INDEX idx_lancamentos_vencimento ON lancamentos_financeiros (data_vencimento);

ALTER TABLE lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lancamentos_financeiros_isolation" ON lancamentos_financeiros
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);
