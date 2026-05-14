-- Seed data: Comunicados e eventos públicos de demonstração para landing page
-- Escola ZAB (slug: 'zab')

DO $$
DECLARE
  v_escola_id UUID;
BEGIN
  SELECT id INTO v_escola_id FROM escolas WHERE slug = 'zab';
  IF NOT FOUND THEN
    RAISE NOTICE 'Escola ZAB não encontrada. Execute este seed após criar a escola.';
    RETURN;
  END IF;

  -- ── Comunicados públicos ──
  INSERT INTO comunicados (escola_id, titulo, corpo, data_publicacao, publico, requer_confirmacao) VALUES
    (v_escola_id, 'Bem-vindos ao ano letivo 2026!', 'É com imensa alegria que recebemos todos os alunos e suas famílias para mais um ano letivo! Que 2026 seja um ano de muito aprendizado, descobertas e crescimento.', '2026-02-02', true, false),
    (v_escola_id, 'Reunião de pais — 1º Bimestre', 'Convidamos todos os responsáveis para a Reunião de Pais do 1º Bimestre. Serão abordados temas como desempenho escolar, projetos pedagógicos e cronograma de avaliações.', '2026-03-10', true, false),
    (v_escola_id, 'Festa Junina 2026', 'Chegou a época mais animada do ano! Nossa tradicional Festa Junina acontecerá no dia 13 de junho, a partir das 17h, no pátio da escola. Teremos quadrilha, comidas típicas e muita música boa.', '2026-05-25', true, false);

  -- ── Eventos públicos (datas futuras) ──
  INSERT INTO eventos_calendario (escola_id, nome, descricao, data_inicio, data_fim, tipo, publico) VALUES
    (v_escola_id, 'Reunião de pais — 1º Bimestre', 'Reunião para entrega de notas e discussões sobre o desempenho dos alunos.', '2026-05-28', NULL, 'reuniao', true),
    (v_escola_id, 'Festa Junina', 'Festa junina tradicional da escola com quadrilha, comidas típicas e apresentações.', '2026-06-13', '2026-06-13', 'evento', true),
    (v_escola_id, 'Recesso de julho', 'Recesso escolar do meio do ano.', '2026-07-21', '2026-07-31', 'recesso', true),
    (v_escola_id, 'Prova bimestral — 2º Bimestre', 'Avaliação bimestral referente ao 2º bimestre.', '2026-06-22', NULL, 'prova', true),
    (v_escola_id, 'Sábado letivo', 'Dia letivo com atividades especiais e projetos interdisciplinares.', '2026-06-06', NULL, 'evento', true);

  RAISE NOTICE 'Seed concluído: 3 comunicados e 5 eventos inseridos para escola ZAB.';
END $$;
