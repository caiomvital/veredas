ALTER TABLE comunicados ADD COLUMN IF NOT EXISTS requer_confirmacao BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS confirmacoes_presenca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunicado_id UUID NOT NULL REFERENCES comunicados(id) ON DELETE CASCADE,
  responsavel_id UUID NOT NULL REFERENCES responsaveis(id) ON DELETE CASCADE,
  confirmado BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comunicado_id, responsavel_id)
);

CREATE INDEX IF NOT EXISTS idx_confirmacoes_comunicado ON confirmacoes_presenca (comunicado_id);
