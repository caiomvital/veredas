ALTER TABLE escolas ADD COLUMN IF NOT EXISTS configuracao_concluida BOOLEAN DEFAULT false;

-- Escolas existentes são marcadas como concluídas
UPDATE escolas SET configuracao_concluida = true WHERE configuracao_concluida IS NULL OR configuracao_concluida = false;
