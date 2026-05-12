/**
 * Diagnóstico de login — testa tudo que pode impedir o usuário de entrar.
 *
 * Uso: node scripts/diagnosticar-login.js
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://ocgxwzeqnkrvaeymgvya.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ3h3emVxbmtydmFleW1ndnlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4MzIzOCwiZXhwIjoyMDkxMjU5MjM4fQ.cyFA7el-HmPbpDIQJi_yEfKoOGwmWiODWmK2YOmdesI'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ3h3emVxbmtydmFleW1ndnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODMyMzgsImV4cCI6MjA5MTI1OTIzOH0.mh3xcv6_jsw21yYKNicOqGOkJwSjiCF_MTW6TxLkdoA'

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const supabaseAnon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const USERS_TO_TEST = [
  { email: 'admin@escola.com', password: 'admin123', label: 'admin' },
  { email: 'coordenadora@escolazab.com.br', password: 'coord123', label: 'coordenador' },
  { email: 'secretaria@escolazab.com.br', password: 'secr123', label: 'secretaria' },
  { email: 'professor1@escolazab.com.br', password: 'prof123', label: 'professor' },
  { email: 'responsavel@escolazab.com.br', password: 'resp123', label: 'responsavel' },
]

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  DIAGNÓSTICO DE LOGIN')
  console.log('═══════════════════════════════════════════\n')

  // ── 1. Status do servidor ──
  console.log('┌─ 1. SERVER STATUS')
  try {
    const res = await fetch('http://localhost:3000')
    console.log(`│  ✓ Servidor rodando na porta 3000 (status ${res.status})`)
  } catch {
    console.log('│  ✗ Servidor NÃO está rodando em localhost:3000')
    console.log('│  → Execute: npm run dev')
  }
  console.log('└──────────────────────\n')

  // ── 2. Rota /login ──
  console.log('┌─ 2. ROTA /LOGIN')
  try {
    const res = await fetch('http://localhost:3000/login')
    console.log(`│  ✓ /login acessível (status ${res.status})`)
  } catch (e) {
    console.log(`│  ✗ /login inacessível: ${e.message}`)
  }
  console.log('└──────────────────────\n')

  // ── 3. Auth users ──
  console.log('┌─ 3. USUÁRIOS NO SUPABASE AUTH')
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) {
    console.log(`│  ✗ Erro ao listar usuários: ${listError.message}`)
  } else {
    console.log(`│  Total de usuários Auth: ${users.length}`)
    for (const u of users) {
      const meta = u.app_metadata || {}
      console.log(`│  • ${u.email.padEnd(35)} perfil: ${(meta.perfil || 'NULO').toString().padEnd(12)} escola_id: ${meta.escola_id ? meta.escola_id.substring(0, 8)+'…' : 'NULO'}`)
    }
  }
  console.log('└──────────────────────\n')

  // ── 4. Testar login de cada usuário ──
  console.log('┌─ 4. TESTE DE LOGIN (signInWithPassword)')
  for (const u of USERS_TO_TEST) {
    try {
      const { data, error } = await supabaseAnon.auth.signInWithPassword({
        email: u.email,
        password: u.password,
      })
      if (error) {
        console.log(`│  ✗ ${u.label.padEnd(14)} ${u.email.padEnd(35)} ERRO: ${error.message}`)
      } else {
        const meta = data.user?.app_metadata || {}
        const session = data.session ? '✓ tem session' : '✗ sem session'
        console.log(`│  ✓ ${u.label.padEnd(14)} ${u.email.padEnd(35)} perfil=${meta.perfil} | ${session}`)
        // Sign out to not interfere with subsequent tests
        await supabaseAnon.auth.signOut()
      }
    } catch (e) {
      console.log(`│  ✗ ${u.label.padEnd(14)} ${u.email.padEnd(35)} EXCEPTION: ${e.message}`)
    }
  }
  console.log('└──────────────────────\n')

  // ── 5. Verificar app_metadata detalhado ──
  console.log('┌─ 5. APP_METADATA DETALHADO')
  for (const u of USERS_TO_TEST) {
    const found = users?.find((au) => au.email === u.email)
    if (found) {
      const meta = found.app_metadata || {}
      console.log(`│  ${u.email}`)
      console.log(`│    id:          ${found.id}`)
      console.log(`│    perfil:      ${meta.perfil ?? 'NULO'}`)
      console.log(`│    escola_id:   ${meta.escola_id ?? 'NULO'}`)
      console.log(`│    email_confirmado: ${found.email_confirmed_at ? 'sim' : 'não'}`)
      console.log(`│    user_metadata: ${JSON.stringify(found.user_metadata)}`)
    } else {
      console.log(`│  ✗ ${u.email} NÃO ENCONTRADO no Auth`)
    }
  }
  console.log('└──────────────────────\n')

  // ── 6. Verificar vínculo na tabela funcionarios ──
  console.log('┌─ 6. VÍNCULO FUNCIONARIOS (via PG)')
  const { Client } = require('pg')
  const pgClient = new Client({
    connectionString: 'postgresql://postgres:escola-claude-@db.ocgxwzeqnkrvaeymgvya.supabase.co:5432/postgres'
  })
  try {
    await pgClient.connect()
    // Check escolas
    const esc = await pgClient.query(`SELECT id, nome, slug FROM escolas LIMIT 5`)
    console.log(`│  Escolas:`)
    for (const row of esc.rows) {
      console.log(`│    • ${row.id} | ${row.nome} | slug=${row.slug}`)
    }

    // Check funcionarios linked to auth users
    const funcs = await pgClient.query(`
      SELECT f.id, f.nome_completo, f.email, f.cargo, f.usuario_id, f.escola_id
      FROM funcionarios f
      WHERE f.email LIKE '%@escola%' OR f.email LIKE '%@escolazab%'
      ORDER BY f.email
    `)
    console.log(`│  Funcionários com email de teste:`)
    if (funcs.rows.length === 0) {
      console.log(`│    (nenhum encontrado)`)
    } else {
      for (const f of funcs.rows) {
        const authUser = users?.find((u) => u.id === f.usuario_id)
        const uid = f.usuario_id ? f.usuario_id.substring(0, 8) + '…' : 'NULL'
        const status = authUser ? 'OK' : (f.usuario_id ? 'UUID INVÁLIDO' : 'NÃO VINCULADO')
        console.log(`│    • ${f.nome_completo.padEnd(25)} ${f.email.padEnd(35)} cargo=${f.cargo.toString().padEnd(12)} usuario_id=${uid} (${status})`)
        if (f.usuario_id && !authUser) {
          console.log(`│      ⚠ usuario_id não corresponde a nenhum Auth user`)
        }
      }
    }

    // Check for admin in table
    const adminUser = users?.find((u) => u.email === 'admin@escola.com')
    if (adminUser) {
      const fAdmin = await pgClient.query(`SELECT id, nome_completo, email FROM funcionarios WHERE usuario_id = $1`, [adminUser.id])
      if (fAdmin.rows.length > 0) {
        console.log(`│  ✓ admin@escola.com vinculado a funcionario: ${fAdmin.rows[0].nome_completo}`)
      } else {
        console.log(`│  ! admin@escola.com existe no Auth mas NÃO tem registro em funcionarios`)
      }
    }

  } catch (e) {
    console.log(`│  ✗ Erro PG: ${e.message}`)
  } finally {
    await pgClient.end()
  }
  console.log('└──────────────────────\n')

  // ── 7. Middleware ──
  console.log('┌─ 7. DIAGNÓSTICO DE MIDDLEWARE')
  console.log(`│  Permissões atuais:`)
  const path = require('path')
  const middlewarePath = path.join(__dirname, '..', 'src', 'middleware.ts')
  const fs = require('fs')
  const mwContent = fs.readFileSync(middlewarePath, 'utf8')

  // Extract PERMISSOES_ROTA_ESPECIFICAS
  const specMatch = mwContent.match(/PERMISSOES_ROTA_ESPECIFICAS: Record<string, Perfil[]> = \{([^}]+)\}/)
  if (specMatch) {
    console.log(`│  ${specMatch[0]}`)
  }

  // Check if admin route exists
  if (mwContent.includes("'/admin'")) {
    console.log(`│  ✓ Rota /admin configurada no middleware`)
  } else {
    console.log(`│  ✗ Rota /admin NÃO configurada`)
  }
  console.log('└──────────────────────\n')

  console.log('═══════════════════════════════════════════')
  console.log('  DIAGNÓSTICO CONCLUÍDO')
  console.log('═══════════════════════════════════════════')
}

main().catch((err) => {
  console.error('Fatal:', err.message || err)
  process.exit(1)
})
