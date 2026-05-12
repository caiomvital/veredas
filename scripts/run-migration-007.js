const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const CONNECTION_STRING =
  'postgresql://postgres:escola-claude-@db.ocgxwzeqnkrvaeymgvya.supabase.co:5432/postgres'

async function main() {
  const client = new Client({ connectionString: CONNECTION_STRING })
  await client.connect()
  console.log('Conectado ao banco.')

  const filePath = path.resolve(__dirname, '..', 'supabase', 'migrations', '007_create_fase7.sql')
  const sql = fs.readFileSync(filePath, 'utf-8')

  try {
    await client.query(sql)
    console.log('OK: 007_create_fase7.sql')
  } catch (err) {
    console.error('ERRO:', err.message)
    process.exit(1)
  }

  await client.end()
  console.log('Migration 007 executada com sucesso.')
}

main().catch((err) => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
