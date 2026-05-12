-- Migration 006: Fase 6 — Comunicados, Calendário Escolar, Portal do Responsável
-- Veredas

-- ============================================================
-- MÓDULO 1: Comunicados
-- ============================================================

CREATE TABLE comunicados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  corpo TEXT NOT NULL,
  data_publicacao DATE NOT NULL DEFAULT CURRENT_DATE,
  criado_por UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER comunicados_updated_at
  BEFORE UPDATE ON comunicados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_comunicados_escola ON comunicados (escola_id);
CREATE INDEX idx_comunicados_data ON comunicados (data_publicacao DESC);

ALTER TABLE comunicados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comunicados_isolation" ON comunicados
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

CREATE TABLE comunicado_destinatarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunicado_id UUID NOT NULL REFERENCES comunicados(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('toda_escola', 'turma', 'perfil')),
  turma_id UUID REFERENCES turmas(id) ON DELETE CASCADE,
  perfil TEXT CHECK (perfil IN ('admin', 'coordenador', 'secretaria', 'professor'))
);

ALTER TABLE comunicado_destinatarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comunicado_destinatarios_isolation" ON comunicado_destinatarios
  USING (
    comunicado_id IN (
      SELECT id FROM comunicados WHERE escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid
    )
  );

CREATE TABLE comunicado_leitura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunicado_id UUID NOT NULL REFERENCES comunicados(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lida_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comunicado_id, usuario_id)
);

ALTER TABLE comunicado_leitura ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comunicado_leitura_isolation" ON comunicado_leitura
  USING (
    comunicado_id IN (
      SELECT id FROM comunicados WHERE escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid
    )
  );

-- ============================================================
-- MÓDULO 2: Calendário Escolar
-- ============================================================

CREATE TABLE eventos_calendario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  tipo TEXT NOT NULL CHECK (tipo IN ('feriado', 'prova', 'reuniao', 'evento', 'recesso')),
  criado_por UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_eventos_escola ON eventos_calendario (escola_id);
CREATE INDEX idx_eventos_data ON eventos_calendario (data_inicio);

ALTER TABLE eventos_calendario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eventos_calendario_isolation" ON eventos_calendario
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);
