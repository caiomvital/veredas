-- Migration 011: Correção completa de RLS policies para TODAS as tabelas
-- Veredas - Adiciona policies INSERT/UPDATE/DELETE ausentes em todas as tabelas
-- Padrão: escola_id = (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid
-- Tabelas sem escola_id direto usam JOIN para verificar o tenant correto

-- ============================================================
-- Helper: função auxiliar para extrair escola_id do JWT
-- ============================================================
CREATE OR REPLACE FUNCTION get_escola_id_jwt()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'escola_id')::uuid;
$$;

-- ============================================================
-- 1. escolas — tabela raiz (NUNCA teve RLS)
-- ============================================================
ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "escolas_select" ON escolas;
CREATE POLICY "escolas_select" ON escolas
  FOR SELECT
  USING (id = get_escola_id_jwt());

DROP POLICY IF EXISTS "escolas_insert" ON escolas;
-- Apenas service_role pode inserir escolas
CREATE POLICY "escolas_insert" ON escolas
  FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "escolas_update" ON escolas;
CREATE POLICY "escolas_update" ON escolas
  FOR UPDATE
  USING (id = get_escola_id_jwt())
  WITH CHECK (id = get_escola_id_jwt());

DROP POLICY IF EXISTS "escolas_delete" ON escolas;
-- Apenas service_role pode excluir escolas
CREATE POLICY "escolas_delete" ON escolas
  FOR DELETE
  USING (false);

-- ============================================================
-- 2. funcionarios
-- ============================================================
DROP POLICY IF EXISTS "funcionarios_insert" ON funcionarios;
CREATE POLICY "funcionarios_insert" ON funcionarios
  FOR INSERT
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "funcionarios_update" ON funcionarios;
CREATE POLICY "funcionarios_update" ON funcionarios
  FOR UPDATE
  USING (escola_id = get_escola_id_jwt())
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "funcionarios_delete" ON funcionarios;
CREATE POLICY "funcionarios_delete" ON funcionarios
  FOR DELETE
  USING (escola_id = get_escola_id_jwt());

-- ============================================================
-- 3. alunos
-- ============================================================
DROP POLICY IF EXISTS "alunos_insert" ON alunos;
CREATE POLICY "alunos_insert" ON alunos
  FOR INSERT
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "alunos_update" ON alunos;
CREATE POLICY "alunos_update" ON alunos
  FOR UPDATE
  USING (escola_id = get_escola_id_jwt())
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "alunos_delete" ON alunos;
CREATE POLICY "alunos_delete" ON alunos
  FOR DELETE
  USING (escola_id = get_escola_id_jwt());

-- ============================================================
-- 4. responsaveis
-- ============================================================
DROP POLICY IF EXISTS "responsaveis_insert" ON responsaveis;
CREATE POLICY "responsaveis_insert" ON responsaveis
  FOR INSERT
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "responsaveis_update" ON responsaveis;
CREATE POLICY "responsaveis_update" ON responsaveis
  FOR UPDATE
  USING (escola_id = get_escola_id_jwt())
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "responsaveis_delete" ON responsaveis;
CREATE POLICY "responsaveis_delete" ON responsaveis
  FOR DELETE
  USING (escola_id = get_escola_id_jwt());

-- ============================================================
-- 5. aluno_responsavel (N:N — sem escola_id, join via alunos)
-- ============================================================
DROP POLICY IF EXISTS "aluno_responsavel_insert" ON aluno_responsavel;
CREATE POLICY "aluno_responsavel_insert" ON aluno_responsavel
  FOR INSERT
  WITH CHECK (
    aluno_id IN (SELECT id FROM alunos WHERE escola_id = get_escola_id_jwt())
  );

DROP POLICY IF EXISTS "aluno_responsavel_update" ON aluno_responsavel;
CREATE POLICY "aluno_responsavel_update" ON aluno_responsavel
  FOR UPDATE
  USING (
    aluno_id IN (SELECT id FROM alunos WHERE escola_id = get_escola_id_jwt())
  )
  WITH CHECK (
    aluno_id IN (SELECT id FROM alunos WHERE escola_id = get_escola_id_jwt())
  );

DROP POLICY IF EXISTS "aluno_responsavel_delete" ON aluno_responsavel;
CREATE POLICY "aluno_responsavel_delete" ON aluno_responsavel
  FOR DELETE
  USING (
    aluno_id IN (SELECT id FROM alunos WHERE escola_id = get_escola_id_jwt())
  );

-- ============================================================
-- 6. turmas
-- ============================================================
DROP POLICY IF EXISTS "turmas_insert" ON turmas;
CREATE POLICY "turmas_insert" ON turmas
  FOR INSERT
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "turmas_update" ON turmas;
CREATE POLICY "turmas_update" ON turmas
  FOR UPDATE
  USING (escola_id = get_escola_id_jwt())
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "turmas_delete" ON turmas;
CREATE POLICY "turmas_delete" ON turmas
  FOR DELETE
  USING (escola_id = get_escola_id_jwt());

-- ============================================================
-- 7. disciplinas
-- ============================================================
DROP POLICY IF EXISTS "disciplinas_insert" ON disciplinas;
CREATE POLICY "disciplinas_insert" ON disciplinas
  FOR INSERT
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "disciplinas_update" ON disciplinas;
CREATE POLICY "disciplinas_update" ON disciplinas
  FOR UPDATE
  USING (escola_id = get_escola_id_jwt())
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "disciplinas_delete" ON disciplinas;
CREATE POLICY "disciplinas_delete" ON disciplinas
  FOR DELETE
  USING (escola_id = get_escola_id_jwt());

-- ============================================================
-- 8. turma_disciplina_professor (sem escola_id, join via turmas)
-- ============================================================
DROP POLICY IF EXISTS "tdp_insert" ON turma_disciplina_professor;
CREATE POLICY "tdp_insert" ON turma_disciplina_professor
  FOR INSERT
  WITH CHECK (
    turma_id IN (SELECT id FROM turmas WHERE escola_id = get_escola_id_jwt())
  );

DROP POLICY IF EXISTS "tdp_update" ON turma_disciplina_professor;
CREATE POLICY "tdp_update" ON turma_disciplina_professor
  FOR UPDATE
  USING (
    turma_id IN (SELECT id FROM turmas WHERE escola_id = get_escola_id_jwt())
  )
  WITH CHECK (
    turma_id IN (SELECT id FROM turmas WHERE escola_id = get_escola_id_jwt())
  );

DROP POLICY IF EXISTS "tdp_delete" ON turma_disciplina_professor;
CREATE POLICY "tdp_delete" ON turma_disciplina_professor
  FOR DELETE
  USING (
    turma_id IN (SELECT id FROM turmas WHERE escola_id = get_escola_id_jwt())
  );

-- ============================================================
-- 9. matriculas (sem escola_id, join via turmas)
-- ============================================================
DROP POLICY IF EXISTS "matriculas_insert" ON matriculas;
CREATE POLICY "matriculas_insert" ON matriculas
  FOR INSERT
  WITH CHECK (
    turma_id IN (SELECT id FROM turmas WHERE escola_id = get_escola_id_jwt())
  );

DROP POLICY IF EXISTS "matriculas_update" ON matriculas;
CREATE POLICY "matriculas_update" ON matriculas
  FOR UPDATE
  USING (
    turma_id IN (SELECT id FROM turmas WHERE escola_id = get_escola_id_jwt())
  )
  WITH CHECK (
    turma_id IN (SELECT id FROM turmas WHERE escola_id = get_escola_id_jwt())
  );

DROP POLICY IF EXISTS "matriculas_delete" ON matriculas;
CREATE POLICY "matriculas_delete" ON matriculas
  FOR DELETE
  USING (
    turma_id IN (SELECT id FROM turmas WHERE escola_id = get_escola_id_jwt())
  );

-- ============================================================
-- 10. periodos_letivos
-- ============================================================
DROP POLICY IF EXISTS "periodos_letivos_insert" ON periodos_letivos;
CREATE POLICY "periodos_letivos_insert" ON periodos_letivos
  FOR INSERT
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "periodos_letivos_update" ON periodos_letivos;
CREATE POLICY "periodos_letivos_update" ON periodos_letivos
  FOR UPDATE
  USING (escola_id = get_escola_id_jwt())
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "periodos_letivos_delete" ON periodos_letivos;
CREATE POLICY "periodos_letivos_delete" ON periodos_letivos
  FOR DELETE
  USING (escola_id = get_escola_id_jwt());

-- ============================================================
-- 11. notas (sem escola_id, join via turma_disciplina_professor → turmas)
-- ============================================================
DROP POLICY IF EXISTS "notas_insert" ON notas;
CREATE POLICY "notas_insert" ON notas
  FOR INSERT
  WITH CHECK (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

DROP POLICY IF EXISTS "notas_update" ON notas;
CREATE POLICY "notas_update" ON notas
  FOR UPDATE
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  )
  WITH CHECK (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

DROP POLICY IF EXISTS "notas_delete" ON notas;
CREATE POLICY "notas_delete" ON notas
  FOR DELETE
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

-- ============================================================
-- 12. frequencias (sem escola_id, join via turma_disciplina_professor → turmas)
-- ============================================================
DROP POLICY IF EXISTS "frequencias_insert" ON frequencias;
CREATE POLICY "frequencias_insert" ON frequencias
  FOR INSERT
  WITH CHECK (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

DROP POLICY IF EXISTS "frequencias_update" ON frequencias;
CREATE POLICY "frequencias_update" ON frequencias
  FOR UPDATE
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  )
  WITH CHECK (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

DROP POLICY IF EXISTS "frequencias_delete" ON frequencias;
CREATE POLICY "frequencias_delete" ON frequencias
  FOR DELETE
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

-- ============================================================
-- 13. registro_aulas (sem escola_id, join via turma_disciplina_professor → turmas)
-- ============================================================
DROP POLICY IF EXISTS "registro_aulas_insert" ON registro_aulas;
CREATE POLICY "registro_aulas_insert" ON registro_aulas
  FOR INSERT
  WITH CHECK (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

DROP POLICY IF EXISTS "registro_aulas_update" ON registro_aulas;
CREATE POLICY "registro_aulas_update" ON registro_aulas
  FOR UPDATE
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  )
  WITH CHECK (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

DROP POLICY IF EXISTS "registro_aulas_delete" ON registro_aulas;
CREATE POLICY "registro_aulas_delete" ON registro_aulas
  FOR DELETE
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

-- ============================================================
-- 14. planejamento_aulas (sem escola_id, join via turma_disciplina_professor → turmas)
-- ============================================================
DROP POLICY IF EXISTS "planejamento_aulas_insert" ON planejamento_aulas;
CREATE POLICY "planejamento_aulas_insert" ON planejamento_aulas
  FOR INSERT
  WITH CHECK (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

DROP POLICY IF EXISTS "planejamento_aulas_update" ON planejamento_aulas;
CREATE POLICY "planejamento_aulas_update" ON planejamento_aulas
  FOR UPDATE
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  )
  WITH CHECK (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

DROP POLICY IF EXISTS "planejamento_aulas_delete" ON planejamento_aulas;
CREATE POLICY "planejamento_aulas_delete" ON planejamento_aulas
  FOR DELETE
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

-- ============================================================
-- 15. atividades_casa (sem escola_id, join via turma_disciplina_professor → turmas)
-- ============================================================
DROP POLICY IF EXISTS "atividades_casa_insert" ON atividades_casa;
CREATE POLICY "atividades_casa_insert" ON atividades_casa
  FOR INSERT
  WITH CHECK (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

DROP POLICY IF EXISTS "atividades_casa_update" ON atividades_casa;
CREATE POLICY "atividades_casa_update" ON atividades_casa
  FOR UPDATE
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  )
  WITH CHECK (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

DROP POLICY IF EXISTS "atividades_casa_delete" ON atividades_casa;
CREATE POLICY "atividades_casa_delete" ON atividades_casa
  FOR DELETE
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

-- ============================================================
-- 16. atividade_casa_entrega (sem escola_id, join via atividades_casa → tdp → turmas)
-- ============================================================
DROP POLICY IF EXISTS "atividade_casa_entrega_insert" ON atividade_casa_entrega;
CREATE POLICY "atividade_casa_entrega_insert" ON atividade_casa_entrega
  FOR INSERT
  WITH CHECK (
    atividade_id IN (
      SELECT ac.id FROM atividades_casa ac
      JOIN turma_disciplina_professor tdp ON tdp.id = ac.turma_disciplina_id
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

DROP POLICY IF EXISTS "atividade_casa_entrega_update" ON atividade_casa_entrega;
CREATE POLICY "atividade_casa_entrega_update" ON atividade_casa_entrega
  FOR UPDATE
  USING (
    atividade_id IN (
      SELECT ac.id FROM atividades_casa ac
      JOIN turma_disciplina_professor tdp ON tdp.id = ac.turma_disciplina_id
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  )
  WITH CHECK (
    atividade_id IN (
      SELECT ac.id FROM atividades_casa ac
      JOIN turma_disciplina_professor tdp ON tdp.id = ac.turma_disciplina_id
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

DROP POLICY IF EXISTS "atividade_casa_entrega_delete" ON atividade_casa_entrega;
CREATE POLICY "atividade_casa_entrega_delete" ON atividade_casa_entrega
  FOR DELETE
  USING (
    atividade_id IN (
      SELECT ac.id FROM atividades_casa ac
      JOIN turma_disciplina_professor tdp ON tdp.id = ac.turma_disciplina_id
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

-- ============================================================
-- 17. diarios_classe (sem escola_id, join via turma_disciplina_professor → turmas)
-- ============================================================
DROP POLICY IF EXISTS "diarios_classe_insert" ON diarios_classe;
CREATE POLICY "diarios_classe_insert" ON diarios_classe
  FOR INSERT
  WITH CHECK (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

DROP POLICY IF EXISTS "diarios_classe_update" ON diarios_classe;
CREATE POLICY "diarios_classe_update" ON diarios_classe
  FOR UPDATE
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  )
  WITH CHECK (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

DROP POLICY IF EXISTS "diarios_classe_delete" ON diarios_classe;
CREATE POLICY "diarios_classe_delete" ON diarios_classe
  FOR DELETE
  USING (
    turma_disciplina_id IN (
      SELECT tdp.id FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id
      WHERE t.escola_id = get_escola_id_jwt()
    )
  );

-- ============================================================
-- 18. historico_escolar (sem escola_id, join via alunos)
-- ============================================================
DROP POLICY IF EXISTS "historico_escolar_insert" ON historico_escolar;
CREATE POLICY "historico_escolar_insert" ON historico_escolar
  FOR INSERT
  WITH CHECK (
    aluno_id IN (SELECT id FROM alunos WHERE escola_id = get_escola_id_jwt())
  );

DROP POLICY IF EXISTS "historico_escolar_update" ON historico_escolar;
CREATE POLICY "historico_escolar_update" ON historico_escolar
  FOR UPDATE
  USING (
    aluno_id IN (SELECT id FROM alunos WHERE escola_id = get_escola_id_jwt())
  )
  WITH CHECK (
    aluno_id IN (SELECT id FROM alunos WHERE escola_id = get_escola_id_jwt())
  );

DROP POLICY IF EXISTS "historico_escolar_delete" ON historico_escolar;
CREATE POLICY "historico_escolar_delete" ON historico_escolar
  FOR DELETE
  USING (
    aluno_id IN (SELECT id FROM alunos WHERE escola_id = get_escola_id_jwt())
  );

-- ============================================================
-- 19. comunicados
-- ============================================================
DROP POLICY IF EXISTS "comunicados_insert" ON comunicados;
CREATE POLICY "comunicados_insert" ON comunicados
  FOR INSERT
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "comunicados_update" ON comunicados;
CREATE POLICY "comunicados_update" ON comunicados
  FOR UPDATE
  USING (escola_id = get_escola_id_jwt())
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "comunicados_delete" ON comunicados;
CREATE POLICY "comunicados_delete" ON comunicados
  FOR DELETE
  USING (escola_id = get_escola_id_jwt());

-- ============================================================
-- 20. comunicado_destinatarios (sem escola_id, join via comunicados)
-- ============================================================
DROP POLICY IF EXISTS "comunicado_destinatarios_insert" ON comunicado_destinatarios;
CREATE POLICY "comunicado_destinatarios_insert" ON comunicado_destinatarios
  FOR INSERT
  WITH CHECK (
    comunicado_id IN (SELECT id FROM comunicados WHERE escola_id = get_escola_id_jwt())
  );

DROP POLICY IF EXISTS "comunicado_destinatarios_update" ON comunicado_destinatarios;
CREATE POLICY "comunicado_destinatarios_update" ON comunicado_destinatarios
  FOR UPDATE
  USING (
    comunicado_id IN (SELECT id FROM comunicados WHERE escola_id = get_escola_id_jwt())
  )
  WITH CHECK (
    comunicado_id IN (SELECT id FROM comunicados WHERE escola_id = get_escola_id_jwt())
  );

DROP POLICY IF EXISTS "comunicado_destinatarios_delete" ON comunicado_destinatarios;
CREATE POLICY "comunicado_destinatarios_delete" ON comunicado_destinatarios
  FOR DELETE
  USING (
    comunicado_id IN (SELECT id FROM comunicados WHERE escola_id = get_escola_id_jwt())
  );

-- ============================================================
-- 21. comunicado_leitura (sem escola_id, join via comunicados)
-- ============================================================
DROP POLICY IF EXISTS "comunicado_leitura_insert" ON comunicado_leitura;
CREATE POLICY "comunicado_leitura_insert" ON comunicado_leitura
  FOR INSERT
  WITH CHECK (
    comunicado_id IN (SELECT id FROM comunicados WHERE escola_id = get_escola_id_jwt())
  );

DROP POLICY IF EXISTS "comunicado_leitura_update" ON comunicado_leitura;
CREATE POLICY "comunicado_leitura_update" ON comunicado_leitura
  FOR UPDATE
  USING (
    comunicado_id IN (SELECT id FROM comunicados WHERE escola_id = get_escola_id_jwt())
  )
  WITH CHECK (
    comunicado_id IN (SELECT id FROM comunicados WHERE escola_id = get_escola_id_jwt())
  );

DROP POLICY IF EXISTS "comunicado_leitura_delete" ON comunicado_leitura;
CREATE POLICY "comunicado_leitura_delete" ON comunicado_leitura
  FOR DELETE
  USING (
    comunicado_id IN (SELECT id FROM comunicados WHERE escola_id = get_escola_id_jwt())
  );

-- ============================================================
-- 22. eventos_calendario
-- ============================================================
DROP POLICY IF EXISTS "eventos_calendario_insert" ON eventos_calendario;
CREATE POLICY "eventos_calendario_insert" ON eventos_calendario
  FOR INSERT
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "eventos_calendario_update" ON eventos_calendario;
CREATE POLICY "eventos_calendario_update" ON eventos_calendario
  FOR UPDATE
  USING (escola_id = get_escola_id_jwt())
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "eventos_calendario_delete" ON eventos_calendario;
CREATE POLICY "eventos_calendario_delete" ON eventos_calendario
  FOR DELETE
  USING (escola_id = get_escola_id_jwt());

-- ============================================================
-- 23. avisos_whatsapp
-- ============================================================
DROP POLICY IF EXISTS "avisos_whatsapp_insert" ON avisos_whatsapp;
CREATE POLICY "avisos_whatsapp_insert" ON avisos_whatsapp
  FOR INSERT
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "avisos_whatsapp_update" ON avisos_whatsapp;
CREATE POLICY "avisos_whatsapp_update" ON avisos_whatsapp
  FOR UPDATE
  USING (escola_id = get_escola_id_jwt())
  WITH CHECK (escola_id = get_escola_id_jwt());

DROP POLICY IF EXISTS "avisos_whatsapp_delete" ON avisos_whatsapp;
CREATE POLICY "avisos_whatsapp_delete" ON avisos_whatsapp
  FOR DELETE
  USING (escola_id = get_escola_id_jwt());
