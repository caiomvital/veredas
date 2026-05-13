-- Migration 016: Criar tabela series_escolares
-- Substitui o array SERIES hardcoded por dados configuráveis por escola

CREATE TABLE series_escolares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  nivel TEXT NOT NULL CHECK (nivel IN ('infantil', 'fund1', 'fund2', 'medio')),
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(escola_id, nome)
);

CREATE INDEX idx_series_escolares_escola ON series_escolares (escola_id, ordem);

-- Seed para escolas existentes
DO $$
DECLARE
  escola RECORD;
  series_data JSONB := '[
    {"nivel": "infantil", "nome": "Maternal I", "ordem": 1},
    {"nivel": "infantil", "nome": "Maternal II", "ordem": 2},
    {"nivel": "infantil", "nome": "Jardim I", "ordem": 3},
    {"nivel": "infantil", "nome": "Jardim II", "ordem": 4},
    {"nivel": "fund1", "nome": "1º Ano", "ordem": 5},
    {"nivel": "fund1", "nome": "2º Ano", "ordem": 6},
    {"nivel": "fund1", "nome": "3º Ano", "ordem": 7},
    {"nivel": "fund1", "nome": "4º Ano", "ordem": 8},
    {"nivel": "fund1", "nome": "5º Ano", "ordem": 9},
    {"nivel": "fund2", "nome": "6º Ano", "ordem": 10},
    {"nivel": "fund2", "nome": "7º Ano", "ordem": 11},
    {"nivel": "fund2", "nome": "8º Ano", "ordem": 12},
    {"nivel": "fund2", "nome": "9º Ano", "ordem": 13},
    {"nivel": "medio", "nome": "1ª Série", "ordem": 14},
    {"nivel": "medio", "nome": "2ª Série", "ordem": 15},
    {"nivel": "medio", "nome": "3ª Série", "ordem": 16}
  ]';
  serie JSONB;
BEGIN
  FOR escola IN SELECT id FROM escolas LOOP
    FOR serie IN SELECT * FROM jsonb_array_elements(series_data) LOOP
      INSERT INTO series_escolares (escola_id, nivel, nome, ordem)
      VALUES (
        escola.id,
        serie->>'nivel',
        serie->>'nome',
        (serie->>'ordem')::int
      ) ON CONFLICT (escola_id, nome) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- RLS
ALTER TABLE series_escolares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "series_escolares_escola_select" ON series_escolares
  FOR SELECT USING (escola_id = get_escola_id_jwt());

CREATE POLICY "series_escolares_escola_insert" ON series_escolares
  FOR INSERT WITH CHECK (escola_id = get_escola_id_jwt());

CREATE POLICY "series_escolares_escola_update" ON series_escolares
  FOR UPDATE USING (escola_id = get_escola_id_jwt());

CREATE POLICY "series_escolares_escola_delete" ON series_escolares
  FOR DELETE USING (escola_id = get_escola_id_jwt());

-- Trigger updated_at
CREATE TRIGGER series_escolares_updated_at
  BEFORE UPDATE ON series_escolares
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
