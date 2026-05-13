CREATE TABLE IF NOT EXISTS conselho_classe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  periodo_id UUID NOT NULL REFERENCES periodos_letivos(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  decisao TEXT NOT NULL CHECK (decisao IN ('aprovado', 'reprovado', 'retido', 'aceleracao', 'transferido')),
  observacoes TEXT,
  registrado_por UUID REFERENCES funcionarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(turma_id, periodo_id, aluno_id)
);

CREATE INDEX IF NOT EXISTS idx_conselho_classe_turma_periodo ON conselho_classe (turma_id, periodo_id);
CREATE INDEX IF NOT EXISTS idx_conselho_classe_escola ON conselho_classe (escola_id);
