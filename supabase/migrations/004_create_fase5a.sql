-- Migration 004: Create Fase 5a tables
-- Veredas - Secretaria: historico_escolar, transferencia

-- ============================================================
-- Tabela: historico_escolar
-- ============================================================
CREATE TABLE historico_escolar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  ano_letivo INTEGER NOT NULL,
  situacao TEXT NOT NULL CHECK (situacao IN ('aprovado', 'reprovado', 'transferido')),
  observacoes TEXT,
  criado_por UUID REFERENCES funcionarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(aluno_id, ano_letivo)
);

CREATE TRIGGER historico_escolar_updated_at
  BEFORE UPDATE ON historico_escolar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_historico_aluno ON historico_escolar (aluno_id);

ALTER TABLE historico_escolar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "historico_escolar_isolation" ON historico_escolar
  USING (
    aluno_id IN (
      SELECT id FROM alunos WHERE escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid
    )
  );
