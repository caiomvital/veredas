-- Migration 002: Create Fase 2 tables
-- Veredas - Cadastro Base: funcionarios, alunos, responsaveis, turmas, disciplinas, matriculas

-- ============================================================
-- Tabela: funcionarios
-- ============================================================
CREATE TABLE funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome_completo TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  rg TEXT,
  orgao_emissor TEXT,
  email TEXT NOT NULL,
  telefone TEXT,
  cargo TEXT NOT NULL CHECK (cargo IN ('admin', 'coordenador', 'secretaria', 'professor')),
  disciplinas TEXT[] DEFAULT '{}',
  formacao TEXT,
  data_admissao DATE,
  ativo BOOLEAN DEFAULT true,
  convite_enviado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER funcionarios_updated_at
  BEFORE UPDATE ON funcionarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_funcionarios_escola ON funcionarios (escola_id);
CREATE INDEX idx_funcionarios_cargo ON funcionarios (cargo);

-- RLS
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "funcionarios_escola_isolation" ON funcionarios
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

-- ============================================================
-- Tabela: alunos
-- ============================================================
CREATE TABLE alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  matricula TEXT UNIQUE NOT NULL,
  nome_completo TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  cpf TEXT UNIQUE,
  rg TEXT,
  orgao_emissor TEXT,
  naturalidade TEXT,
  nome_mae TEXT NOT NULL,
  nome_pai TEXT,
  endereco JSONB DEFAULT '{}'::jsonb,
  contato_responsavel JSONB DEFAULT '{}'::jsonb,
  foto_url TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'transferido', 'concluido')),
  lgpd_autorizacao_imagem BOOLEAN DEFAULT false,
  lgpd_autorizacao_dados BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER alunos_updated_at
  BEFORE UPDATE ON alunos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_alunos_escola ON alunos (escola_id);
CREATE INDEX idx_alunos_status ON alunos (status);

ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alunos_escola_isolation" ON alunos
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

-- ============================================================
-- Tabela: responsaveis
-- ============================================================
CREATE TABLE responsaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome_completo TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  rg TEXT,
  email TEXT NOT NULL,
  telefone TEXT,
  profissao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER responsaveis_updated_at
  BEFORE UPDATE ON responsaveis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_responsaveis_escola ON responsaveis (escola_id);

ALTER TABLE responsaveis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "responsaveis_escola_isolation" ON responsaveis
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

-- ============================================================
-- Tabela: aluno_responsavel (N:N)
-- ============================================================
CREATE TABLE aluno_responsavel (
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  responsavel_id UUID NOT NULL REFERENCES responsaveis(id) ON DELETE CASCADE,
  grau_parentesco TEXT NOT NULL,
  PRIMARY KEY (aluno_id, responsavel_id)
);

ALTER TABLE aluno_responsavel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aluno_responsavel_isolation" ON aluno_responsavel
  USING (
    aluno_id IN (SELECT id FROM alunos WHERE escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid)
  );

-- ============================================================
-- Tabela: turmas
-- ============================================================
CREATE TABLE turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  serie TEXT NOT NULL,
  turno TEXT NOT NULL CHECK (turno IN ('manha', 'tarde', 'noite')),
  ano_letivo INTEGER NOT NULL,
  capacidade INTEGER NOT NULL DEFAULT 40,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(escola_id, codigo, ano_letivo)
);

CREATE TRIGGER turmas_updated_at
  BEFORE UPDATE ON turmas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_turmas_escola ON turmas (escola_id);
CREATE INDEX idx_turmas_ano ON turmas (ano_letivo);

ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "turmas_escola_isolation" ON turmas
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

-- ============================================================
-- Tabela: disciplinas
-- ============================================================
CREATE TABLE disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL,
  area_conhecimento TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(escola_id, codigo)
);

CREATE INDEX idx_disciplinas_escola ON disciplinas (escola_id);

ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disciplinas_escola_isolation" ON disciplinas
  USING (escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid);

-- ============================================================
-- Tabela: turma_disciplina_professor (alocação)
-- ============================================================
CREATE TABLE turma_disciplina_professor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  carga_horaria_semanal INTEGER DEFAULT 4,
  UNIQUE(turma_id, disciplina_id, funcionario_id)
);

ALTER TABLE turma_disciplina_professor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tdp_isolation" ON turma_disciplina_professor
  USING (
    turma_id IN (SELECT id FROM turmas WHERE escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid)
  );

-- ============================================================
-- Tabela: matriculas
-- ============================================================
CREATE TABLE matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  data_matricula DATE NOT NULL DEFAULT CURRENT_DATE,
  data_cancelamento DATE,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'cancelada', 'concluida')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(aluno_id, turma_id)
);

CREATE INDEX idx_matriculas_aluno ON matriculas (aluno_id);
CREATE INDEX idx_matriculas_turma ON matriculas (turma_id);
CREATE INDEX idx_matriculas_status ON matriculas (status);

ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matriculas_isolation" ON matriculas
  USING (
    turma_id IN (SELECT id FROM turmas WHERE escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid)
  );
