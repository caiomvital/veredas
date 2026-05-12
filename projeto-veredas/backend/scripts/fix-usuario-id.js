/**
 * Corrige o vínculo entre auth users e a tabela funcionarios.
 *
 * O seed não vinculou corretamente os usuario_id dos funcionarios aos Auth users.
 * Isso faz com que server actions (comunicados, etc.) falhem ao buscar o funcionário logado.
 *
 * Uso: node scripts/fix-usuario-id.js
 */

const { createClient } = require('@supabase/supabase-js')
const { Client } = require('pg')

const SUPABASE_URL = 'https://ocgxwzeqnkrvaeymgvya.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ3h3emVxbmtydmFleW1ndnlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4MzIzOCwiZXhwIjoyMDkxMjU5MjM4fQ.cyFA7el-HmPbpDIQJi_yEfKoOGwmWiODWmK2YOmdesI'
const CONNECTION_STRING = 'postgresql://postgres:escola-claude-@db.ocgxwzeqnkrvaeymgvya.supabase.co:5432/postgres'

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('=== Corrigindo vínculo auth users → funcionarios ===\n')

  // 1. Listar todos os auth users
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) {
    console.error('Erro ao listar auth users:', listError.message)
    process.exit(1)
  }

  const authByEmail = new Map(users.map((u) => [u.email, u]))
  console.log(`Encontrados ${users.length} auth users\n`)

  // 2. Conectar ao banco
  const client = new Client({ connectionString: CONNECTION_STRING })
  await client.connect()
  console.log('Conectado ao banco\n')

  // 3. Buscar funcionarios sem usuario_id
  const { rows: funcs } = await client.query(`
    SELECT id, nome_completo, email, usuario_id
    FROM funcionarios
    ORDER BY email
  `)

  let atualizados = 0
  let jaOk = 0
  let semAuth = 0

  for (const f of funcs) {
    const authUser = authByEmail.get(f.email)
    if (!authUser) {
      console.log(`  ✗ ${f.email} — não encontrado no Auth`)
      semAuth++
      continue
    }

    if (f.usuario_id === authUser.id) {
      console.log(`  ✓ ${f.email} — já vinculado corretamente`)
      jaOk++
      continue
    }

    // Atualizar
    await client.query(
      `UPDATE funcionarios SET usuario_id = $1 WHERE id = $2`,
      [authUser.id, f.id]
    )
    console.log(`  🔗 ${f.email} — vinculado (auth: ${authUser.id.substring(0, 8)}…)`)
    atualizados++
  }

  console.log(`\nResumo:`)
  console.log(`  Já vinculados: ${jaOk}`)
  console.log(`  Atualizados:   ${atualizados}`)
  console.log(`  Sem auth:      ${semAuth}`)

  await client.end()
  console.log('\nConcluído!')
}

main().catch((err) => {
  console.error('Fatal:', err.message || err)
  process.exit(1)
})
