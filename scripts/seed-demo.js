/**
 * Seed de dados realistas para apresentação ao cliente.
 * Escola: Grupo ZAB de Educação (Olinda-PE)
 * Ano letivo: 2025
 *
 * Uso: node scripts/seed-demo.js
 */

const { Client } = require('pg')
const { createClient } = require('@supabase/supabase-js')

const CONNECTION_STRING =
  'postgresql://postgres:escola-claude-@db.ocgxwzeqnkrvaeymgvya.supabase.co:5432/postgres'

const SUPABASE_URL = 'https://ocgxwzeqnkrvaeymgvya.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ3h3emVxbmtydmFleW1ndnlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4MzIzOCwiZXhwIjoyMDkxMjU5MjM4fQ.cyFA7el-HmPbpDIQJi_yEfKoOGwmWiODWmK2YOmdesI'

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ───── Helpers ─────

let _escolaId = null

async function getEscolaId(client) {
  if (_escolaId) return _escolaId
  const r = await client.query(`SELECT id FROM escolas WHERE slug = 'escola-teste' LIMIT 1`)
  if (r.rows.length === 0) throw new Error('Escola não encontrada. Execute as migrations primeiro.')
  _escolaId = r.rows[0].id
  return _escolaId
}

async function insertOne(client, table, data) {
  const cols = Object.keys(data)
  const vals = cols.map((_, i) => `$${i + 1}`)
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')}) RETURNING id`
  const res = await client.query(sql, cols.map((c) => data[c]))
  return res.rows[0].id
}

async function insertBatch(client, table, rows) {
  if (rows.length === 0) return []
  const cols = Object.keys(rows[0])
  const params = []
  const valueRows = rows.map((r, ri) => {
    const offset = ri * cols.length
    params.push(...cols.map((c) => r[c]))
    return `(${cols.map((_, i) => `$${offset + i + 1}`).join(', ')})`
  })
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES ${valueRows.join(', ')} RETURNING id`
  const res = await client.query(sql, params)
  return res.rows.map((r) => r.id)
}

// ───── Dados ─────

const PERIODOS = [
  { nome: '1º Bimestre', ordem: 1, data_inicio: '2025-02-03', data_fim: '2025-04-11', ano_letivo: 2025 },
  { nome: '2º Bimestre', ordem: 2, data_inicio: '2025-04-22', data_fim: '2025-06-27', ano_letivo: 2025 },
  { nome: '3º Bimestre', ordem: 3, data_inicio: '2025-07-07', data_fim: '2025-09-12', ano_letivo: 2025 },
  { nome: '4º Bimestre', ordem: 4, data_inicio: '2025-09-22', data_fim: '2025-12-12', ano_letivo: 2025 },
]

const TURMAS = [
  { codigo: 'MAT-II', serie: 'Maternal II', turno: 'manha', ano_letivo: 2025, capacidade: 20 },
  { codigo: 'JARDIM-I', serie: 'Jardim I', turno: 'manha', ano_letivo: 2025, capacidade: 20 },
  { codigo: '1ANO-A', serie: '1º Ano', turno: 'manha', ano_letivo: 2025, capacidade: 25 },
  { codigo: '3ANO-A', serie: '3º Ano', turno: 'tarde', ano_letivo: 2025, capacidade: 25 },
  { codigo: '5ANO-A', serie: '5º Ano', turno: 'tarde', ano_letivo: 2025, capacidade: 25 },
  { codigo: '7ANO-A', serie: '7º Ano', turno: 'tarde', ano_letivo: 2025, capacidade: 30 },
]

const DISCIPLINAS = [
  { nome: 'Português', codigo: 'PORT', area_conhecimento: 'Linguagens' },
  { nome: 'Matemática', codigo: 'MAT', area_conhecimento: 'Matemática' },
  { nome: 'Ciências', codigo: 'CIE', area_conhecimento: 'Natureza' },
  { nome: 'História', codigo: 'HIS', area_conhecimento: 'Humanas' },
  { nome: 'Geografia', codigo: 'GEO', area_conhecimento: 'Humanas' },
  { nome: 'Educação Física', codigo: 'EDF', area_conhecimento: 'Linguagens' },
  { nome: 'Arte', codigo: 'ART', area_conhecimento: 'Linguagens' },
]

const FUNCIONARIOS = [
  { nome: 'Maria Helena da Silva', cpf: '12345678901', email: 'coordenadora@escolazab.com.br', cargo: 'coordenador', formacao: 'Pedagogia — UFPE', data_admissao: '2023-01-15' },
  { nome: 'Ana Beatriz Costa', cpf: '23456789012', email: 'secretaria@escolazab.com.br', cargo: 'secretaria', formacao: 'Administração — UNINASSAU', data_admissao: '2023-02-01' },
  { nome: 'Clara de Oliveira', cpf: '34567890123', email: 'professor1@escolazab.com.br', cargo: 'professor', formacao: 'Pedagogia — UPE', data_admissao: '2024-01-10' },
  { nome: 'Marcos Antônio Lima', cpf: '45678901234', email: 'professor2@escolazab.com.br', cargo: 'professor', formacao: 'Letras — UFPE', data_admissao: '2024-01-10' },
  { nome: 'Juliana Ferreira Costa', cpf: '56789012345', email: 'professor3@escolazab.com.br', cargo: 'professor', formacao: 'Pedagogia — UFPE', data_admissao: '2023-03-01' },
  { nome: 'Ricardo Alves Neto', cpf: '67890123456', email: 'professor4@escolazab.com.br', cargo: 'professor', formacao: 'Matemática — UFPE', data_admissao: '2023-03-01' },
]

// Cada professor → quais turmas (todas as disciplinas)
const PROF_TURMAS = [
  { funcIdx: 2, turmaIdx: 0 }, // Clara → Maternal II
  { funcIdx: 2, turmaIdx: 1 }, // Clara → Jardim I
  { funcIdx: 3, turmaIdx: 2 }, // Marcos → 1º Ano
  { funcIdx: 3, turmaIdx: 3 }, // Marcos → 3º Ano
  { funcIdx: 4, turmaIdx: 4 }, // Juliana → 5º Ano
  { funcIdx: 5, turmaIdx: 5 }, // Ricardo → 7º Ano
]

const ALUNOS = [
  // Maternal II (5)
  { matricula: 'MAT001', nome: 'Alice Santos', nasc: '2022-05-10', cpf: '12345678911', mae: 'Camila Santos', pai: 'Rafael Santos' },
  { matricula: 'MAT002', nome: 'Benício Lima', nasc: '2022-08-15', cpf: '12345678912', mae: 'Tatiane Lima', pai: 'Felipe Lima' },
  { matricula: 'MAT003', nome: 'Cecília Oliveira', nasc: '2022-03-22', cpf: '12345678913', mae: 'Patrícia Oliveira', pai: null },
  { matricula: 'MAT004', nome: 'Davi Costa', nasc: '2021-11-30', cpf: '12345678914', mae: 'Renata Costa', pai: 'Thiago Costa' },
  { matricula: 'MAT005', nome: 'Elisa Martins', nasc: '2022-01-18', cpf: '12345678915', mae: 'Daniela Martins', pai: 'Lucas Martins' },
  // Jardim I (5)
  { matricula: 'JAR001', nome: 'Fábio Pereira', nasc: '2020-09-05', cpf: '12345678916', mae: 'Vanessa Pereira', pai: 'Eduardo Pereira' },
  { matricula: 'JAR002', nome: 'Gabriela Nunes', nasc: '2021-02-14', cpf: '12345678917', mae: 'Larissa Nunes', pai: null },
  { matricula: 'JAR003', nome: 'Heitor Ribeiro', nasc: '2020-12-20', cpf: '12345678918', mae: 'Aline Ribeiro', pai: 'Carlos Ribeiro' },
  { matricula: 'JAR004', nome: 'Isabela Carvalho', nasc: '2021-06-08', cpf: '12345678919', mae: 'Fernanda Carvalho', pai: 'Diego Carvalho' },
  { matricula: 'JAR005', nome: 'João Vitor Almeida', nasc: '2020-10-25', cpf: '12345678920', mae: 'Simone Almeida', pai: 'Roberto Almeida' },
  // 1º Ano (5)
  { matricula: '1AN001', nome: 'Laura Fernandes', nasc: '2019-04-03', cpf: '12345678921', mae: 'Juliana Fernandes', pai: 'André Fernandes' },
  { matricula: '1AN002', nome: 'Miguel Barbosa', nasc: '2018-11-12', cpf: '12345678922', mae: 'Priscila Barbosa', pai: 'Gustavo Barbosa' },
  { matricula: '1AN003', nome: 'Nina Campos', nasc: '2019-07-28', cpf: '12345678923', mae: 'Marina Campos', pai: null },
  { matricula: '1AN004', nome: 'Otávio Araújo', nasc: '2018-09-15', cpf: '12345678924', mae: 'Letícia Araújo', pai: 'Paulo Araújo' },
  { matricula: '1AN005', nome: 'Pietra Teixeira', nasc: '2019-01-20', cpf: '12345678925', mae: 'Bianca Teixeira', pai: 'Leonardo Teixeira' },
  // 3º Ano (5)
  { matricula: '3AN001', nome: 'Rafael Moreira', nasc: '2017-05-22', cpf: '12345678926', mae: 'Michele Moreira', pai: 'Alex Moreira' },
  { matricula: '3AN002', nome: 'Sophia Azevedo', nasc: '2016-08-10', cpf: '12345678927', mae: 'Carolina Azevedo', pai: null },
  { matricula: '3AN003', nome: 'Theo Cardoso', nasc: '2017-03-14', cpf: '12345678928', mae: 'Amanda Cardoso', pai: 'Fábio Cardoso' },
  { matricula: '3AN004', nome: 'Valentina Rocha', nasc: '2016-12-05', cpf: '12345678929', mae: 'Jéssica Rocha', pai: 'Igor Rocha' },
  { matricula: '3AN005', nome: 'Vicente Gomes', nasc: '2017-07-30', cpf: '12345678930', mae: 'Heloísa Gomes', pai: 'Marcelo Gomes' },
  // 5º Ano (5)
  { matricula: '5AN001', nome: 'Beatriz Castro', nasc: '2015-04-18', cpf: '12345678931', mae: 'Renata Castro', pai: 'Sérgio Castro' },
  { matricula: '5AN002', nome: 'Daniel Freitas', nasc: '2014-10-08', cpf: '12345678932', mae: 'Elaine Freitas', pai: 'Márcio Freitas' },
  { matricula: '5AN003', nome: 'Esther Melo', nasc: '2015-01-25', cpf: '12345678933', mae: 'Luciana Melo', pai: null },
  { matricula: '5AN004', nome: 'Felipe Dias', nasc: '2014-07-12', cpf: '12345678934', mae: 'Cristiane Dias', pai: 'Rodrigo Dias' },
  { matricula: '5AN005', nome: 'Giovanna Lopes', nasc: '2015-09-30', cpf: '12345678935', mae: 'Tânia Lopes', pai: 'Humberto Lopes' },
  // 7º Ano (5)
  { matricula: '7AN001', nome: 'Henrique Barros', nasc: '2013-02-28', cpf: '12345678936', mae: 'Adriana Barros', pai: 'Sílvio Barros' },
  { matricula: '7AN002', nome: 'Isadora Assis', nasc: '2012-11-15', cpf: '12345678937', mae: 'Lúcia Assis', pai: null },
  { matricula: '7AN003', nome: 'Lorenço Campos', nasc: '2013-06-20', cpf: '12345678938', mae: 'Viviane Campos', pai: 'Otávio Campos' },
  { matricula: '7AN004', nome: 'Maitê Duarte', nasc: '2012-08-05', cpf: '12345678939', mae: 'Sandra Duarte', pai: 'Ronaldo Duarte' },
  { matricula: '7AN005', nome: 'Nícolas Pinto', nasc: '2013-04-10', cpf: '12345678940', mae: 'Fernanda Pinto', pai: 'Jorge Pinto' },
]

const TURMA_ALUNOS = [
  { turmaIdx: 0, alunoIdxs: [0, 1, 2, 3, 4] },
  { turmaIdx: 1, alunoIdxs: [5, 6, 7, 8, 9] },
  { turmaIdx: 2, alunoIdxs: [10, 11, 12, 13, 14] },
  { turmaIdx: 3, alunoIdxs: [15, 16, 17, 18, 19] },
  { turmaIdx: 4, alunoIdxs: [20, 21, 22, 23, 24] },
  { turmaIdx: 5, alunoIdxs: [25, 26, 27, 28, 29] },
]

const RESPONSAVEIS = [
  { nome: 'Camila Santos', cpf: '98765432101', email: 'camila.santos@email.com', parentesco: 'Mãe', alunoIdx: 0 },
  { nome: 'Tatiane Lima', cpf: '98765432102', email: 'tatiane.lima@email.com', parentesco: 'Mãe', alunoIdx: 1 },
  { nome: 'Patrícia Oliveira', cpf: '98765432103', email: 'patricia.oliveira@email.com', parentesco: 'Mãe', alunoIdx: 2 },
  { nome: 'Renata Costa', cpf: '98765432104', email: 'renata.costa@email.com', parentesco: 'Mãe', alunoIdx: 3 },
  { nome: 'Daniela Martins', cpf: '98765432105', email: 'daniela.martins@email.com', parentesco: 'Mãe', alunoIdx: 4 },
  { nome: 'Vanessa Pereira', cpf: '98765432106', email: 'vanessa.pereira@email.com', parentesco: 'Mãe', alunoIdx: 5 },
  { nome: 'Larissa Nunes', cpf: '98765432107', email: 'larissa.nunes@email.com', parentesco: 'Mãe', alunoIdx: 6 },
  { nome: 'Aline Ribeiro', cpf: '98765432108', email: 'aline.ribeiro@email.com', parentesco: 'Mãe', alunoIdx: 7 },
  { nome: 'Fernanda Carvalho', cpf: '98765432109', email: 'fernanda.carvalho@email.com', parentesco: 'Mãe', alunoIdx: 8 },
  { nome: 'Simone Almeida', cpf: '98765432110', email: 'simone.almeida@email.com', parentesco: 'Mãe', alunoIdx: 9 },
  { nome: 'Juliana Fernandes', cpf: '98765432111', email: 'juliana.fernandes@email.com', parentesco: 'Mãe', alunoIdx: 10 },
  { nome: 'Priscila Barbosa', cpf: '98765432112', email: 'priscila.barbosa@email.com', parentesco: 'Mãe', alunoIdx: 11 },
  { nome: 'Marina Campos', cpf: '98765432113', email: 'marina.campos@email.com', parentesco: 'Mãe', alunoIdx: 12 },
  { nome: 'Letícia Araújo', cpf: '98765432114', email: 'leticia.araujo@email.com', parentesco: 'Mãe', alunoIdx: 13 },
  { nome: 'Bianca Teixeira', cpf: '98765432115', email: 'bianca.teixeira@email.com', parentesco: 'Mãe', alunoIdx: 14 },
  { nome: 'Michele Moreira', cpf: '98765432116', email: 'michele.moreira@email.com', parentesco: 'Mãe', alunoIdx: 15 },
  { nome: 'Carolina Azevedo', cpf: '98765432117', email: 'carolina.azevedo@email.com', parentesco: 'Mãe', alunoIdx: 16 },
  { nome: 'Amanda Cardoso', cpf: '98765432118', email: 'amanda.cardoso@email.com', parentesco: 'Mãe', alunoIdx: 17 },
  { nome: 'Jéssica Rocha', cpf: '98765432119', email: 'jessica.rocha@email.com', parentesco: 'Mãe', alunoIdx: 18 },
  { nome: 'Heloísa Gomes', cpf: '98765432120', email: 'heloisa.gomes@email.com', parentesco: 'Mãe', alunoIdx: 19 },
  { nome: 'Renata Castro', cpf: '98765432121', email: 'renata.castro@email.com', parentesco: 'Mãe', alunoIdx: 20 },
  { nome: 'Elaine Freitas', cpf: '98765432122', email: 'elaine.freitas@email.com', parentesco: 'Mãe', alunoIdx: 21 },
  { nome: 'Luciana Melo', cpf: '98765432123', email: 'luciana.melo@email.com', parentesco: 'Mãe', alunoIdx: 22 },
  { nome: 'Cristiane Dias', cpf: '98765432124', email: 'cristiane.dias@email.com', parentesco: 'Mãe', alunoIdx: 23 },
  { nome: 'Tânia Lopes', cpf: '98765432125', email: 'tania.lopes@email.com', parentesco: 'Mãe', alunoIdx: 24 },
  { nome: 'Adriana Barros', cpf: '98765432126', email: 'adriana.barros@email.com', parentesco: 'Mãe', alunoIdx: 25 },
  { nome: 'Lúcia Assis', cpf: '98765432127', email: 'lucia.assis@email.com', parentesco: 'Mãe', alunoIdx: 26 },
  { nome: 'Viviane Campos', cpf: '98765432128', email: 'viviane.campos@email.com', parentesco: 'Mãe', alunoIdx: 27 },
  { nome: 'Sandra Duarte', cpf: '98765432129', email: 'sandra.duarte@email.com', parentesco: 'Mãe', alunoIdx: 28 },
  { nome: 'Fernanda Pinto', cpf: '98765432130', email: 'fernanda.pinto@email.com', parentesco: 'Mãe', alunoIdx: 29 },
]

// ───── Geração de notas (valores realistas por faixa) ─────
function notaAleatoria(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10
}

function gerarNotasPorSerie(serie) {
  // Maternal e Jardim: só conceitos (8-10, sem reprovação)
  if (serie === 'Maternal II' || serie === 'Jardim I') return { prova: notaAleatoria(7, 10), trabalho: notaAleatoria(8, 10) }
  // 1º e 3º ano: médias boas
  if (serie === '1º Ano' || serie === '3º Ano') return { prova: notaAleatoria(5, 10), trabalho: notaAleatoria(6, 10) }
  // 5º ano: variado
  if (serie === '5º Ano') return { prova: notaAleatoria(4, 10), trabalho: notaAleatoria(5, 10) }
  // 7º ano: mais desafiador
  return { prova: notaAleatoria(3, 10), trabalho: notaAleatoria(4, 10) }
}

function gerarPresenca(diaSemana) {
  // Seg-sex, ~85% presença, alguns alunos com mais faltas
  return Math.random() < 0.85
}

// ───── Main ─────

async function main() {
  const client = new Client({ connectionString: CONNECTION_STRING })
  await client.connect()
  console.log('Conectado ao banco.\n')

  const escolaId = await getEscolaId(client)
  console.log(`Escola ID: ${escolaId}\n`)

  // ── Limpeza de dados de seed anteriores ──
  console.log('--- Limpando dados existentes ---')
  await client.query(`
    DELETE FROM diarios_classe;
    DELETE FROM atividade_casa_entrega;
    DELETE FROM atividades_casa;
    DELETE FROM planejamento_aulas;
    DELETE FROM registro_aulas;
    DELETE FROM frequencias;
    DELETE FROM notas;
    DELETE FROM aluno_responsavel;
    DELETE FROM matriculas;
    DELETE FROM turma_disciplina_professor;
    DELETE FROM comunicado_destinatarios;
    DELETE FROM comunicado_leitura;
    DELETE FROM comunicados;
    DELETE FROM eventos_calendario;
    DELETE FROM responsaveis;
    DELETE FROM alunos;
    DELETE FROM funcionarios WHERE email LIKE '%@escolazab.com.br';
    DELETE FROM disciplinas;
    DELETE FROM turmas;
    DELETE FROM periodos_letivos WHERE ano_letivo = 2025;
  `)
  console.log('  Limpeza concluída.\n')

  // ── Auth users ──

  const authUsers = [
    { email: 'coordenadora@escolazab.com.br', password: 'coord123', perfil: 'coordenador' },
    { email: 'secretaria@escolazab.com.br', password: 'secr123', perfil: 'secretaria' },
    { email: 'professor1@escolazab.com.br', password: 'prof123', perfil: 'professor' },
    { email: 'professor2@escolazab.com.br', password: 'prof123', perfil: 'professor' },
    { email: 'professor3@escolazab.com.br', password: 'prof123', perfil: 'professor' },
    { email: 'professor4@escolazab.com.br', password: 'prof123', perfil: 'professor' },
    { email: 'responsavel@escolazab.com.br', password: 'resp123', perfil: 'responsavel' },
  ]

  console.log('--- Criando usuários no Supabase Auth ---')
  const authUserIdMap = {}
  for (const u of authUsers) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        app_metadata: { perfil: u.perfil, escola_id: escolaId },
      })
      if (error) {
        // Pode ser duplicado
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`  ⚠ Usuário ${u.email} já existe. Buscando ID...`)
          const { data: existing } = await supabaseAdmin.auth.admin.listUsers()
          const found = existing.users.find((eu) => eu.email === u.email)
          if (found) authUserIdMap[u.email] = found.id
        } else {
          console.error(`  ERRO: ${u.email} -> ${error.message}`)
        }
      } else {
        authUserIdMap[u.email] = data.user.id
        console.log(`  ✓ ${u.email} (${u.perfil})`)
      }
    } catch (e) {
      console.error(`  ERRO: ${u.email} -> ${e.message}`)
    }
  }
  console.log('')

  // ── 1. Períodos letivos ──

  console.log('--- 1. Períodos Letivos ---')
  const periodoIds = []
  for (const p of PERIODOS) {
    const id = await insertOne(client, 'periodos_letivos', { ...p, escola_id: escolaId })
    periodoIds.push(id)
    console.log(`  ✓ ${p.nome} ${p.ano_letivo}`)
  }
  console.log('')

  // ── 2. Turmas ──

  console.log('--- 2. Turmas ---')
  const turmaIds = []
  for (const t of TURMAS) {
    const id = await insertOne(client, 'turmas', { ...t, escola_id: escolaId, ativa: true })
    turmaIds.push(id)
    console.log(`  ✓ ${t.codigo} - ${t.serie} (${t.turno})`)
  }
  console.log('')

  // ── 3. Disciplinas ──

  console.log('--- 3. Disciplinas ---')
  const disciplinaIds = []
  for (const d of DISCIPLINAS) {
    const id = await insertOne(client, 'disciplinas', { ...d, escola_id: escolaId })
    disciplinaIds.push(id)
    console.log(`  ✓ ${d.nome} (${d.codigo})`)
  }
  console.log('')

  // ── 4. Funcionários ──

  console.log('--- 4. Funcionários ---')
  const funcIds = []
  for (const f of FUNCIONARIOS) {
    const data = { nome_completo: f.nome, cpf: f.cpf, email: f.email, cargo: f.cargo, formacao: f.formacao, data_admissao: f.data_admissao, escola_id: escolaId, ativo: true, disciplinas: [] }
    const authId = authUserIdMap[f.email]
    if (authId) data.usuario_id = authId
    const id = await insertOne(client, 'funcionarios', data)
    funcIds.push(id)
    console.log(`  ✓ ${f.nome} (${f.cargo})`)
  }
  console.log('')

  // ── 5. Turma-Disciplina-Professor ──

  console.log('--- 5. Turma-Disciplina-Professor ---')
  const tdpIds = [] // [turmaIdx][discIdx] = tdpId
  for (let ti = 0; ti < TURMAS.length; ti++) tdpIds[ti] = {}
  let tdpCount = 0
  for (const pt of PROF_TURMAS) {
    const funcId = funcIds[pt.funcIdx]
    const turmaIdx = pt.turmaIdx
    const turmaId = turmaIds[turmaIdx]
    for (let di = 0; di < DISCIPLINAS.length; di++) {
      const discId = disciplinaIds[di]
      const id = await insertOne(client, 'turma_disciplina_professor', {
        turma_id: turmaId,
        disciplina_id: discId,
        funcionario_id: funcId,
        carga_horaria_semanal: di === 5 ? 2 : 4, // Ed. Física 2h, demais 4h
      })
      tdpIds[turmaIdx][di] = id
      tdpCount++
    }
  }
  console.log(`  ✓ ${tdpCount} registros criados`)
  console.log('')

  // ── 6. Alunos ──

  console.log('--- 6. Alunos ---')
  const alunoIds = []
  for (const a of ALUNOS) {
    const id = await insertOne(client, 'alunos', {
      escola_id: escolaId,
      matricula: a.matricula,
      nome_completo: a.nome,
      data_nascimento: a.nasc,
      cpf: a.cpf,
      nome_mae: a.mae,
      nome_pai: a.pai,
      status: 'ativo',
      lgpd_autorizacao_imagem: true,
      lgpd_autorizacao_dados: true,
    })
    alunoIds.push(id)
  }
  console.log(`  ✓ ${alunoIds.length} alunos`)
  console.log('')

  // ── 7. Responsáveis ──

  console.log('--- 7. Responsáveis ---')
  const respIds = []
  for (const r of RESPONSAVEIS) {
    const data = {
      escola_id: escolaId,
      nome_completo: r.nome,
      cpf: r.cpf,
      email: r.email,
    }
    // Vincular o auth user responsavel@ ao primeiro responsável para login
    if (r.alunoIdx === 0) {
      const authId = authUserIdMap['responsavel@escolazab.com.br']
      if (authId) data.usuario_id = authId
    }
    const id = await insertOne(client, 'responsaveis', data)
    respIds.push(id)
  }
  console.log(`  ✓ ${respIds.length} responsáveis`)
  console.log('')

  // ── 8. Aluno-Responsável ──

  console.log('--- 8. Vínculos Aluno-Responsável ---')
  for (let i = 0; i < RESPONSAVEIS.length; i++) {
    const r = RESPONSAVEIS[i]
    const alunoId = alunoIds[r.alunoIdx]
    const respId = respIds[i]
    await client.query(
      `INSERT INTO aluno_responsavel (aluno_id, responsavel_id, grau_parentesco) VALUES ($1, $2, $3)`,
      [alunoId, respId, r.parentesco]
    )
  }
  console.log(`  ✓ ${RESPONSAVEIS.length} vínculos`)
  console.log('')

  // ── 9. Matrículas ──

  console.log('--- 9. Matrículas ---')
  const matriculaIds = [] // [alunoGlobalIdx]
  let matCount = 0
  for (const ta of TURMA_ALUNOS) {
    const turmaId = turmaIds[ta.turmaIdx]
    for (const ai of ta.alunoIdxs) {
      const id = await insertOne(client, 'matriculas', {
        aluno_id: alunoIds[ai],
        turma_id: turmaId,
        data_matricula: '2025-01-15',
        status: 'ativa',
      })
      matriculaIds[ai] = id
      matCount++
    }
  }
  console.log(`  ✓ ${matCount} matrículas`)
  console.log('')

  // ── 10. Notas (1º Bimestre) ──

  console.log('--- 10. Notas (1º Bimestre) ---')
  let notaCount = 0
  const notaTipoLabels = ['prova', 'trabalho']
  const funcLancador = funcIds[2] // Clara, primeira professora

  for (const ta of TURMA_ALUNOS) {
    const turmaIdx = ta.turmaIdx
    const serie = TURMAS[turmaIdx].serie
    for (const ai of ta.alunoIdxs) {
      const matId = matriculaIds[ai]
      for (let di = 0; di < DISCIPLINAS.length; di++) {
        const tdpId = tdpIds[turmaIdx][di]
        if (!tdpId) continue
        const notas = gerarNotasPorSerie(serie)
        for (const tipo of notaTipoLabels) {
          await insertOne(client, 'notas', {
            matricula_id: matId,
            turma_disciplina_id: tdpId,
            periodo_id: periodoIds[0],
            valor: notas[tipo],
            tipo,
            lancado_por: funcLancador,
          })
          notaCount++
        }
      }
    }
  }
  console.log(`  ✓ ${notaCount} notas`)
  console.log('')

  // ── 11. Frequências (Maio 2025, últimas 5 dias úteis) ──

  console.log('--- 11. Frequências ---')
  let freqCount = 0
  // Dias úteis de maio/2025 (seg-sex)
  const diasMaio = []
  for (let d = 1; d <= 31; d++) {
    const dt = new Date(2025, 4, d) // maio = mês 4
    const diaSem = dt.getDay()
    if (diaSem >= 1 && diaSem <= 5) diasMaio.push(d)
  }
  // Pegar os últimos 5 dias úteis
  const ultimos5 = diasMaio.slice(-5)

  for (const ta of TURMA_ALUNOS) {
    const turmaIdx = ta.turmaIdx
    for (const ai of ta.alunoIdxs) {
      const matId = matriculaIds[ai]
      for (let di = 0; di < DISCIPLINAS.length; di++) {
        const tdpId = tdpIds[turmaIdx][di]
        if (!tdpId) continue
        for (const dia of ultimos5) {
          const dataAula = `2025-05-${String(dia).padStart(2, '0')}`
          const presenca = gerarPresenca(new Date(2025, 4, dia).getDay())
          await insertOne(client, 'frequencias', {
            matricula_id: matId,
            turma_disciplina_id: tdpId,
            data_aula: dataAula,
            presenca,
            lancado_por: funcLancador,
          })
          freqCount++
        }
      }
    }
  }
  console.log(`  ✓ ${freqCount} frequências`)
  console.log('')

  // ── 12. Registro de Aulas (3 por turma, na disciplina de Português) ──

  console.log('--- 12. Registro de Aulas ---')
  const conteudosAula = [
    { conteudo: 'Leitura e interpretação de texto: "A Menina e o Pássaro"', obs: 'Alunos participaram ativamente' },
    { conteudo: 'Produção textual: escrita de carta pessoal', obs: 'Dificuldade com estrutura textual' },
    { conteudo: 'Gramática: classes gramaticais (substantivo e adjetivo)', obs: 'Conteúdo concluído conforme planejado' },
  ]
  const datasAula = ['2025-05-05', '2025-05-12', '2025-05-19']
  let aulaCount = 0
  for (let ti = 0; ti < TURMAS.length; ti++) {
    const turmaIdx = ti
    for (const disciplina of [0]) {
      const tdpId = tdpIds[turmaIdx][0] // Português
      if (!tdpId) continue
      for (let ai = 0; ai < 3; ai++) {
        await insertOne(client, 'registro_aulas', {
          turma_disciplina_id: tdpId,
          data_aula: datasAula[ai],
          conteudo: conteudosAula[ai].conteudo,
          observacoes: conteudosAula[ai].obs,
          carga_horaria_minutos: 50,
        })
        aulaCount++
      }
    }
  }
  console.log(`  ✓ ${aulaCount} registros de aula`)
  console.log('')

  // ── 13. Comunicados ──

  console.log('--- 13. Comunicados ---')
  // Buscar funcionário coordenadora
  const coordId = funcIds[0]

  // Comunicado 1: geral para toda escola
  const c1Id = await insertOne(client, 'comunicados', {
    escola_id: escolaId,
    titulo: 'Festival da Primavera 2025',
    corpo: 'Comunicamos que o Festival da Primavera 2025 será realizado no dia 20 de setembro, a partir das 9h, no pátio da escola. Teremos apresentações musicais, barraquinhas de comidas típicas e feira de artesanato. Contamos com a presença de todos! As turmas do 3º, 5º e 7º anos farão apresentações preparadas pelos professores.\n\nPedimos que os responsáveis confirmem presença até 10/09.',
    data_publicacao: '2025-05-10',
    criado_por: coordId,
  })
  await client.query(
    `INSERT INTO comunicado_destinatarios (comunicado_id, tipo) VALUES ($1, 'toda_escola')`,
    [c1Id]
  )
  console.log('  ✓ Comunicado geral: Festival da Primavera')

  // Comunicado 2: para professores
  const c2Id = await insertOne(client, 'comunicados', {
    escola_id: escolaId,
    titulo: 'Reunião Pedagógica — Planejamento 2º Bimestre',
    corpo: 'Convocamos todos os professores para a reunião pedagógica de planejamento do 2º bimestre, que ocorrerá no dia 15/04/2025, das 14h às 17h, na sala de coordenação.\n\nPauta:\n1. Análise dos resultados do 1º bimestre\n2. Adequação curricular para alunos com dificuldade\n3. Planejamento do projeto interdisciplinar\n4. Orientações sobre preenchimento dos diários\n\nFavor confirmar presença com a secretaria.',
    data_publicacao: '2025-04-01',
    criado_por: coordId,
  })
  await client.query(
    `INSERT INTO comunicado_destinatarios (comunicado_id, tipo, perfil) VALUES ($1, 'perfil', 'professor')`,
    [c2Id]
  )
  console.log('  ✓ Comunicado professores: Reunião Pedagógica')

  // Comunicado 3: para turma 5º ano
  const c3Id = await insertOne(client, 'comunicados', {
    escola_id: escolaId,
    titulo: 'Excursão ao Museu de Ciências',
    corpo: 'A turma do 5º ano fará uma excursão ao Museu de Ciências de Olinda no dia 25/05/2025, das 8h30 às 12h.\n\nOs alunos devem trajar uniforme da escola, levar lanche e garrafa de água. O valor do transporte será rateado entre os participantes (R$ 15,00 por aluno).\n\nAutorizações serão enviadas na agenda. Pedimos que os responsáveis assinem e devolvam até 20/05.\n\nAcompanharão a turma a professora Juliana e a coordenadora Maria Helena.',
    data_publicacao: '2025-05-08',
    criado_por: coordId,
  })
  await client.query(
    `INSERT INTO comunicado_destinatarios (comunicado_id, tipo, turma_id) VALUES ($1, 'turma', $2)`,
    [c3Id, turmaIds[4]] // 5º ano
  )
  console.log('  ✓ Comunicado 5º ano: Excursão ao Museu')
  console.log('')

  // ── 14. Eventos no Calendário ──

  console.log('--- 14. Eventos no Calendário ---')
  const eventos = [
    { nome: 'Reunião de Pais — 1º Bimestre', descricao: 'Apresentação dos resultados e entrega de boletins.', data_inicio: '2025-04-14', tipo: 'reuniao' },
    { nome: 'Prova Bimestral — 1º Bimestre', descricao: 'Avaliações de todas as disciplinas.', data_inicio: '2025-04-07', data_fim: '2025-04-11', tipo: 'prova' },
    { nome: 'Tiradentes', descricao: 'Feriado nacional.', data_inicio: '2025-04-21', tipo: 'feriado' },
    { nome: 'Dia do Trabalhador', descricao: 'Feriado nacional.', data_inicio: '2025-05-01', tipo: 'feriado' },
    { nome: 'Recesso Escolar — 1º Bimestre', descricao: 'Recesso entre bimestres.', data_inicio: '2025-04-14', data_fim: '2025-04-21', tipo: 'recesso' },
    { nome: 'Festa Junina', descricao: 'Arraial da Escola ZAB — comidas típicas, quadrilha e brincadeiras.', data_inicio: '2025-06-28', tipo: 'evento' },
    { nome: 'Reunião de Pais — 2º Bimestre', descricao: 'Apresentação dos resultados semestrais.', data_inicio: '2025-07-03', tipo: 'reuniao' },
    { nome: 'Dia dos Professores', descricao: 'Homenagem aos professores com café da manhã e atividades.', data_inicio: '2025-10-15', tipo: 'evento' },
  ]
  for (const e of eventos) {
    await insertOne(client, 'eventos_calendario', {
      escola_id: escolaId,
      nome: e.nome,
      descricao: e.descricao ?? null,
      data_inicio: e.data_inicio,
      data_fim: e.data_fim ?? null,
      tipo: e.tipo,
      criado_por: coordId,
    })
  }
  console.log(`  ✓ ${eventos.length} eventos`)
  console.log('')

  // ── Contagens Finais ──

  const countQueries = [
    ['alunos', 'alunos'],
    ['matriculas', 'matrículas'],
    ['responsaveis', 'responsáveis'],
    ['aluno_responsavel', 'vínculos responsável-aluno'],
    ['turmas', 'turmas'],
    ['disciplinas', 'disciplinas'],
    ['turma_disciplina_professor', 'alocações professor-turma'],
    ['notas', 'notas'],
    ['frequencias', 'registros de frequência'],
    ['registro_aulas', 'registros de aula'],
    ['comunicados', 'comunicados'],
    ['eventos_calendario', 'eventos no calendário'],
  ]
  console.log('=== RESUMO ===')
  for (const [table, label] of countQueries) {
    const r = await client.query(`SELECT COUNT(*)::int AS c FROM ${table}`)
    console.log(`  ${r.rows[0].c} ${label}`)
  }

  await client.end()
  console.log('\nSeed concluído!')
}

main().catch((err) => {
  console.error('Fatal:', err.message || err)
  process.exit(1)
})
