CREATE TABLE IF NOT EXISTS solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  responsavel_id UUID NOT NULL REFERENCES responsaveis(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES alunos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('justificativa_falta', 'pedido_documento', 'atualizacao_dados', 'outro')),
  assunto TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'resolvida', 'cancelada')),
  resposta TEXT,
  respondido_por UUID REFERENCES funcionarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_escola_status ON solicitacoes (escola_id, status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_responsavel ON solicitacoes (responsavel_id);

CREATE OR REPLACE FUNCTION update_solicitacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER solicitacoes_updated_at
  BEFORE UPDATE ON solicitacoes
  FOR EACH ROW EXECUTE FUNCTION update_solicitacoes_updated_at();
