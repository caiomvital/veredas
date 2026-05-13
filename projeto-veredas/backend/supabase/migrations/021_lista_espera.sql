CREATE TABLE IF NOT EXISTS lista_espera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  candidato_nome TEXT NOT NULL,
  responsavel_nome TEXT,
  telefone TEXT,
  data_interesse DATE NOT NULL DEFAULT CURRENT_DATE,
  notificado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lista_espera_turma ON lista_espera (turma_id);
CREATE INDEX IF NOT EXISTS idx_lista_espera_escola ON lista_espera (escola_id);
