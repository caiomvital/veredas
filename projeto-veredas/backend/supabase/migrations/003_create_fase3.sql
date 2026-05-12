-- Migration 003: Create Fase 3 tables
-- Veredas - Acadêmico: periodos, notas, frequencia, registro_aulas, atividades, planejamento, diarios

-- ============================================================
-- Tabela: periodos_letivos
-- ============================================================
CREATE TABLE periodos_letivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ano_letivo INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(escola_id, ordem, ano_letivo)
);

CREATE INDEX idx_periodos_escola_ano ON periodos_letivos (escola_id, ano_letivo);

ALTER TABLE periodos_letivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "periodos_escola_isolation" ON periodos_letivos
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

-- ============================================================
-- Tabela: notas
-- ============================================================
CREATE TABLE notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  turma_disciplina_id UUID NOT NULL REFERENCES turma_disciplina_professor(id) ON DELETE CASCADE,
  periodo_id UUID NOT NULL REFERENCES periodos_letivos(id) ON DELETE CASCADE,
  valor NUMERIC(4,2) NOT NULL CHECK (valor >= 0 AND valor <= 10),
  tipo TEXT NOT NULL CHECK (tipo IN ('prova', 'trabalho', 'recuperacao', 'media_final')),
  lancado_por UUID NOT NULL REFERENCES funcionarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(matricula_id, turma_disciplina_id, periodo_id, tipo)
);

CREATE TRIGGER notas_updated_at
  BEFORE UPDATE ON notas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_notas_matricula ON notas (matricula_id);
CREATE INDEX idx_notas_turma_disciplina ON notas (turma_disciplina_id);
CREATE INDEX idx_notas_periodo ON notas (periodo_id);

ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notas_turma_isolation" ON notas
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid
    )
  );

-- ============================================================
-- Tabela: frequencias
-- ============================================================
CREATE TABLE frequencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  turma_disciplina_id UUID NOT NULL REFERENCES turma_disciplina_professor(id) ON DELETE CASCADE,
  data_aula DATE NOT NULL,
  presenca BOOLEAN NOT NULL DEFAULT true,
  lancado_por UUID NOT NULL REFERENCES funcionarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(matricula_id, turma_disciplina_id, data_aula)
);

CREATE INDEX idx_frequencias_turma_data ON frequencias (turma_disciplina_id, data_aula);

ALTER TABLE frequencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "frequencias_turma_isolation" ON frequencias
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid
    )
  );

-- ============================================================
-- Tabela: registro_aulas
-- ============================================================
CREATE TABLE registro_aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_disciplina_id UUID NOT NULL REFERENCES turma_disciplina_professor(id) ON DELETE CASCADE,
  data_aula DATE NOT NULL,
  conteudo TEXT NOT NULL,
  observacoes TEXT,
  carga_horaria_minutos INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(turma_disciplina_id, data_aula)
);

CREATE TRIGGER registro_aulas_updated_at
  BEFORE UPDATE ON registro_aulas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_registro_aulas_turma ON registro_aulas (turma_disciplina_id);

ALTER TABLE registro_aulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "registro_aulas_turma_isolation" ON registro_aulas
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid
    )
  );

-- ============================================================
-- Tabela: planejamento_aulas
-- ============================================================
CREATE TABLE planejamento_aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_disciplina_id UUID NOT NULL REFERENCES turma_disciplina_professor(id) ON DELETE CASCADE,
  periodo_id UUID NOT NULL REFERENCES periodos_letivos(id) ON DELETE CASCADE,
  semana_inicio DATE NOT NULL,
  objetivos TEXT,
  conteudo_planejado TEXT NOT NULL,
  metodologia TEXT,
  recursos TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(turma_disciplina_id, semana_inicio)
);

CREATE TRIGGER planejamento_aulas_updated_at
  BEFORE UPDATE ON planejamento_aulas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE planejamento_aulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "planejamento_turma_isolation" ON planejamento_aulas
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid
    )
  );

-- ============================================================
-- Tabela: atividades_casa
-- ============================================================
CREATE TABLE atividades_casa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_disciplina_id UUID NOT NULL REFERENCES turma_disciplina_professor(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data_atribuicao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_entrega DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_atividades_turma ON atividades_casa (turma_disciplina_id);

ALTER TABLE atividades_casa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "atividades_turma_isolation" ON atividades_casa
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid
    )
  );

-- ============================================================
-- Tabela: atividade_casa_entrega
-- ============================================================
CREATE TABLE atividade_casa_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id UUID NOT NULL REFERENCES atividades_casa(id) ON DELETE CASCADE,
  matricula_id UUID NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  entregue BOOLEAN NOT NULL DEFAULT false,
  data_entrega TIMESTAMPTZ,
  observacao_professor TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(atividade_id, matricula_id)
);

ALTER TABLE atividade_casa_entrega ENABLE ROW LEVEL SECURITY;
CREATE POLICY "atividade_entrega_isolation" ON atividade_casa_entrega
  USING (
    atividade_id IN (
      SELECT ac.id FROM atividades_casa ac
      JOIN turma_disciplina_professor tdp ON tdp.id = ac.turma_disciplina_id
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid
    )
  );

-- ============================================================
-- Tabela: diarios_classe
-- ============================================================
CREATE TABLE diarios_classe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_disciplina_id UUID NOT NULL REFERENCES turma_disciplina_professor(id) ON DELETE CASCADE,
  periodo_id UUID NOT NULL REFERENCES periodos_letivos(id) ON DELETE CASCADE,
  gerado_por UUID NOT NULL REFERENCES funcionarios(id),
  data_geracao TIMESTAMPTZ DEFAULT now(),
  conteudo_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_url TEXT,
  UNIQUE(turma_disciplina_id, periodo_id)
);

ALTER TABLE diarios_classe ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diarios_turma_isolation" ON diarios_classe
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid
    )
  );
