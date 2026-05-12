const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const CONNECTION_STRING =
  'postgresql://postgres:escola-claude-@db.ocgxwzeqnkrvaeymgvya.supabase.co:5432/postgres'

async function main() {
  const client = new Client({ connectionString: CONNECTION_STRING })
  await client.connect()
  console.log('Conectado ao banco.')

  // Drop only our tables/functions (not Supabase internals)
  console.log('Removendo tabelas existentes...')
  const dropSql = `
    DROP TABLE IF EXISTS lancamentos_financeiros CASCADE;
    DROP TABLE IF EXISTS config_mensalidades CASCADE;
    DROP TABLE IF EXISTS historico_escolar CASCADE;
    DROP TABLE IF EXISTS diarios_classe CASCADE;
    DROP TABLE IF EXISTS atividade_casa_entrega CASCADE;
    DROP TABLE IF EXISTS atividades_casa CASCADE;
    DROP TABLE IF EXISTS planejamento_aulas CASCADE;
    DROP TABLE IF EXISTS registro_aulas CASCADE;
    DROP TABLE IF EXISTS frequencias CASCADE;
    DROP TABLE IF EXISTS notas CASCADE;
    DROP TABLE IF EXISTS periodos_letivos CASCADE;
    DROP TABLE IF EXISTS matriculas CASCADE;
    DROP TABLE IF EXISTS turma_disciplina_professor CASCADE;
    DROP TABLE IF EXISTS disciplinas CASCADE;
    DROP TABLE IF EXISTS turmas CASCADE;
    DROP TABLE IF EXISTS aluno_responsavel CASCADE;
    DROP TABLE IF EXISTS responsaveis CASCADE;
    DROP TABLE IF EXISTS alunos CASCADE;
    DROP TABLE IF EXISTS funcionarios CASCADE;
    DROP TABLE IF EXISTS escolas CASCADE;
    DROP FUNCTION IF EXISTS get_escola_id CASCADE;
    DROP FUNCTION IF EXISTS update_updated_at CASCADE;
  `
  await client.query(dropSql)
  console.log('Tabelas antigas removidas.')

  const migrationsDir = path.resolve(__dirname, '..', 'supabase', 'migrations')
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
    try {
      await client.query(sql)
      console.log(`OK: ${file}`)
    } catch (err) {
      console.error(`ERRO em ${file}: ${err.message}`)
      process.exit(1)
    }
  }

  await client.end()
  console.log('\nTodas as migrations rodadas com sucesso.')
}

main().catch((err) => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
