CREATE TABLE IF NOT EXISTS justificativas_falta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  frequencia_id UUID NOT NULL REFERENCES frequencias(id) ON DELETE CASCADE,
  responsavel_id UUID NOT NULL REFERENCES responsaveis(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL CHECK (motivo IN ('doenca', 'consulta_medica', 'viagem', 'outro')),
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceita', 'recusada')),
  justificada_em TIMESTAMPTZ,
  analisada_por UUID REFERENCES funcionarios(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_justificativas_falta_status ON justificativas_falta (escola_id, status);
CREATE INDEX IF NOT EXISTS idx_justificativas_falta_frequencia ON justificativas_falta (frequencia_id);
