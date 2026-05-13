ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS documento_tipo TEXT CHECK (documento_tipo IN ('declaracao_matricula', 'declaracao_frequencia', 'historico', 'contrato'));
