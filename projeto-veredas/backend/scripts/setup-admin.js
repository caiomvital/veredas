const { Client } = require('pg')
const { createClient } = require('@supabase/supabase-js')

const CONNECTION_STRING =
  'postgresql://postgres:escola-claude-@db.ocgxwzeqnkrvaeymgvya.supabase.co:5432/postgres'

const SUPABASE_URL = 'https://ocgxwzeqnkrvaeymgvya.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ3h3emVxbmtydmFleW1ndnlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4MzIzOCwiZXhwIjoyMDkxMjU5MjM4fQ.cyFA7el-HmPbpDIQJi_yEfKoOGwmWiODWmK2YOmdesI'

async function main() {
  // Get escola_id from the database
  const pgClient = new Client({ connectionString: CONNECTION_STRING })
  await pgClient.connect()

  const { rows } = await pgClient.query("SELECT id FROM escolas WHERE slug = 'escola-teste' LIMIT 1")
  if (rows.length === 0) {
    console.error('Escola não encontrada.')
    process.exit(1)
  }
  const escolaId = rows[0].id
  console.log('Escola ID:', escolaId)

  // Drop existing admin user if exists
  await pgClient.query("DELETE FROM funcionarios WHERE email = 'admin@escola.com'")

  // Create user via Supabase Auth Admin API
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  })

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users?.find(u => u.email === 'admin@escola.com')
  if (existing) {
    await supabase.auth.admin.deleteUser(existing.id)
    console.log('Usuário antigo removido.')
  }

  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: 'admin@escola.com',
    password: 'admin123',
    email_confirm: true,
    app_metadata: {
      perfil: 'admin',
      escola_id: escolaId,
    },
  })

  if (createError) {
    console.error('Erro ao criar usuário:', createError.message)
    process.exit(1)
  }

  const usuarioId = userData.user.id
  console.log('Usuário admin criado:', usuarioId)

  // Create funcionario record linked to the auth user
  await pgClient.query(`
    INSERT INTO funcionarios (escola_id, usuario_id, nome_completo, cpf, email, cargo)
    VALUES ($1, $2, 'Administrador', '000.000.000-00', 'admin@escola.com', 'admin')
  `, [escolaId, usuarioId])

  console.log('Funcionário admin criado.')

  await pgClient.end()
  console.log('\nSetup completo!')
  console.log('Email: admin@escola.com')
  console.log('Senha: admin123')
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
