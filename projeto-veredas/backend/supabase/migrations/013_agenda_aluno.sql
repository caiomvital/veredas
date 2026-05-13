-- Migration 013: Agenda do Aluno
-- Canal de comunicação diária entre professor e responsável

CREATE TABLE IF NOT EXISTS agenda_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('recado', 'tarefa', 'observacao', 'resposta_responsavel')),
  conteudo TEXT NOT NULL,
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  lido_responsavel BOOLEAN NOT NULL DEFAULT false,
  lido_professor BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agenda_aluno_data ON agenda_registros (aluno_id, data_registro DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agenda_escola ON agenda_registros (escola_id);
CREATE INDEX IF NOT EXISTS idx_agenda_nao_lido_responsavel ON agenda_registros (aluno_id, lido_responsavel) WHERE lido_responsavel = false;
CREATE INDEX IF NOT EXISTS idx_agenda_nao_lido_professor ON agenda_registros (autor_id, lido_professor) WHERE lido_professor = false;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE agenda_registros ENABLE ROW LEVEL SECURITY;

-- Policy de isolamento por escola (ALL para leitura)
CREATE POLICY agenda_escola_isolation ON agenda_registros
  FOR ALL USING (escola_id = get_escola_id_jwt());

-- INSERT: qualquer funcionário ou responsável vinculado pode inserir
CREATE POLICY agenda_insert ON agenda_registros
  FOR INSERT WITH CHECK (
    escola_id = get_escola_id_jwt()
    AND (
      EXISTS (SELECT 1 FROM funcionarios WHERE id = agenda_registros.autor_id AND escola_id = get_escola_id_jwt())
      OR
      EXISTS (SELECT 1 FROM responsaveis WHERE usuario_id = auth.uid() AND escola_id = get_escola_id_jwt())
    )
  );

-- UPDATE: só pode marcar como lido
CREATE POLICY agenda_update ON agenda_registros
  FOR UPDATE USING (escola_id = get_escola_id_jwt())
  WITH CHECK (
    escola_id = get_escola_id_jwt()
    AND (
      (lido_responsavel IS NOT NULL AND lido_professor IS NULL)
      OR (lido_professor IS NOT NULL AND lido_responsavel IS NULL)
    )
  );
