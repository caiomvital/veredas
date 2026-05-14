-- Migration 026: Fotos da escola + campo publico em comunicados e eventos

CREATE TABLE IF NOT EXISTS fotos_escola (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  legenda TEXT DEFAULT '',
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fotos_escola_ordem ON fotos_escola (escola_id, ordem);

ALTER TABLE fotos_escola ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fotos_escola_select" ON fotos_escola
  FOR SELECT USING (true);

CREATE POLICY "fotos_escola_insert" ON fotos_escola
  FOR INSERT WITH CHECK (escola_id = get_escola_id_jwt());

CREATE POLICY "fotos_escola_update" ON fotos_escola
  FOR UPDATE USING (escola_id = get_escola_id_jwt());

CREATE POLICY "fotos_escola_delete" ON fotos_escola
  FOR DELETE USING (escola_id = get_escola_id_jwt());

CREATE TRIGGER fotos_escola_updated_at
  BEFORE UPDATE ON fotos_escola
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Public flag for comunicados (permite exibir na landing page)
ALTER TABLE comunicados ADD COLUMN IF NOT EXISTS publico BOOLEAN DEFAULT false;

-- Public flag for eventos_calendario
ALTER TABLE eventos_calendario ADD COLUMN IF NOT EXISTS publico BOOLEAN DEFAULT false;
