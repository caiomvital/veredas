-- Migration 007: Fase 7 — Avisos WhatsApp
-- Veredas

-- ============================================================
-- Tabela: avisos_whatsapp
-- ============================================================
CREATE TABLE avisos_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('falta', 'financeiro', 'comunicado')),
  aluno_id UUID REFERENCES alunos(id) ON DELETE SET NULL,
  responsavel_id UUID NOT NULL REFERENCES responsaveis(id) ON DELETE CASCADE,
  responsavel_nome TEXT NOT NULL,
  responsavel_telefone TEXT NOT NULL,
  aluno_nome TEXT,
  mensagem TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'descartado')),
  enviado_em TIMESTAMPTZ,
  enviado_por UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_avisos_escola_status ON avisos_whatsapp (escola_id, status);
CREATE INDEX idx_avisos_tipo ON avisos_whatsapp (tipo);
CREATE INDEX idx_avisos_criado_em ON avisos_whatsapp (created_at DESC);

ALTER TABLE avisos_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avisos_whatsapp_isolation" ON avisos_whatsapp
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);
