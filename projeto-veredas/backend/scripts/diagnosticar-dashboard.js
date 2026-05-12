/**
 * Diagnóstico completo dos dados do dashboard.
 * Verifica: dados existem, escola_id está consistente, RLS está funcionando.
 *
 * Uso: node scripts/diagnosticar-dashboard.js
 */

const { createClient } = require('@supabase/supabase-js')
const { Client } = require('pg')

const SUPABASE_URL = 'https://ocgxwzeqnkrvaeymgvya.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ3h3emVxbmtydmFleW1ndnlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4MzIzOCwiZXhwIjoyMDkxMjU5MjM4fQ.cyFA7el-HmPbpDIQJi_yEfKoOGwmWiODWmK2YOmdesI'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ3h3emVxbmtydmFleW1ndnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODMyMzgsImV4cCI6MjA5MTI1OTIzOH0.mh3xcv6_jsw21yYKNicOqGOkJwSjiCF_MTW6TxLkdoA'
const CONNECTION_STRING = 'postgresql://postgres:escola-claude-@db.ocgxwzeqnkrvaeymgvya.supabase.co:5432/postgres'

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  DIAGNÓSTICO DE DADOS DO DASHBOARD')
  console.log('═══════════════════════════════════════════════════════════\n')

  const pgClient = new Client({ connectionString: CONNECTION_STRING })
  await pgClient.connect()

  // ── 1. ESCOLA ID do JWT vs banco ──
  console.log('┌─ 1. ESCOLA_ID (JWT vs Banco)')
  const esc = await pgClient.query(`SELECT id, nome, slug FROM escolas LIMIT 5`)
  const escolaId = esc.rows[0]?.id
  console.log(`│  Escola no banco: id=${escolaId}  nome=${esc.rows[0]?.nome}  slug=${esc.rows[0]?.slug}`)

  // escola_id do admin user
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
  const adminUser = users.find(u => u.email === 'admin@escola.com')
  const jwtEscolaId = adminUser?.app_metadata?.escola_id
  console.log(`│  escola_id no JWT (admin@escola.com): ${jwtEscolaId ?? 'NULO'}`)
  console.log(`│  Match: ${escolaId === jwtEscolaId ? 'SIM ✓' : 'DIFERENTE ✗'}`)
  console.log('└──────────────────────────────\n')

  // ── 2. DADOS EXISTEM? (count por tabela) ──
  console.log('┌─ 2. CONTAGEM DE REGISTROS (via PG, bypass RLS)')
  const TABELAS = [
    'alunos', 'funcionarios', 'turmas', 'disciplinas',
    'turma_disciplina_professor', 'matriculas', 'aluno_responsavel',
    'notas', 'frequencias', 'responsaveis',
    'comunicados', 'eventos_calendario', 'periodos_letivos',
  ]
  for (const t of TABELAS) {
    const { rows } = await pgClient.query(`SELECT COUNT(*)::int AS c FROM ${t}`)
    console.log(`│  ${t.padEnd(30)} ${String(rows[0].c).padStart(6)}`)
  }
  console.log('└──────────────────────────────\n')

  // ── 3. DADOS FILTRADOS POR ESCOLA_ID ──
  console.log('┌─ 3. REGISTROS DA ESCOLA (escola_id = ' + escolaId.substring(0, 8) + '…)')
  const TABELAS_COM_ESCOLA = [
    'alunos', 'funcionarios', 'turmas', 'disciplinas',
    'responsaveis', 'comunicados', 'eventos_calendario', 'periodos_letivos',
  ]
  for (const t of TABELAS_COM_ESCOLA) {
    const { rows } = await pgClient.query(`SELECT COUNT(*)::int AS c FROM ${t} WHERE escola_id = $1`, [escolaId])
    console.log(`│  ${t.padEnd(30)} ${String(rows[0].c).padStart(6)}`)
  }
  console.log('└──────────────────────────────\n')

  // ── 4. TESTE RLS: query com anon key simulando usuário logado ──
  console.log('┌─ 4. TESTE DE RLS (query como admin logado)')
  // Fazer login como admin
  const { data: { session }, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
    email: 'admin@escola.com',
    password: 'admin123',
  })
  if (loginError || !session) {
    console.log(`│  ✗ Erro ao logar como admin: ${loginError?.message}`)
  } else {
    // Criar client com a session do admin
    const supabaseAsAdmin = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    await supabaseAsAdmin.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })

    // Testar queries que o dashboard usaria
    const testes = [
      { nome: 'alunos (SELECT count)', query: () => supabaseAsAdmin.from('alunos').select('*', { count: 'exact', head: true }) },
      { nome: 'funcionarios (SELECT count)', query: () => supabaseAsAdmin.from('funcionarios').select('*', { count: 'exact', head: true }) },
      { nome: 'turmas (SELECT count)', query: () => supabaseAsAdmin.from('turmas').select('*', { count: 'exact', head: true }) },
      { nome: 'matriculas (SELECT count)', query: () => supabaseAsAdmin.from('matriculas').select('*', { count: 'exact', head: true }) },
      { nome: 'notas (SELECT count)', query: () => supabaseAsAdmin.from('notas').select('*', { count: 'exact', head: true }) },
    ]

    for (const t of testes) {
      try {
        const { count, error } = await t.query()
        if (error) {
          console.log(`│  ✗ ${t.nome.padEnd(40)} ERRO: ${error.message}`)
        } else {
          console.log(`│  ✓ ${t.nome.padEnd(40)} count=${count}`)
        }
      } catch (e) {
        console.log(`│  ✗ ${t.nome.padEnd(40)} EXCEPTION: ${e.message}`)
      }
    }
  }
  console.log('└──────────────────────────────\n')

  // ── 5. VERIFICAR RLS POLICIES ──
  console.log('┌─ 5. RLS POLICIES DAS TABELAS')
  const { rows: policies } = await pgClient.query(`
    SELECT schemaname, tablename, policyname, permissive, cmd, qual
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `)
  if (policies.length === 0) {
    console.log('│  Nenhuma RLS policy encontrada')
  } else {
    let lastTable = ''
    for (const p of policies) {
      if (p.tablename !== lastTable) {
        console.log(`│  [${p.tablename}]`)
        lastTable = p.tablename
      }
      console.log(`│    ${p.policyname} (${p.cmd}, ${p.permissive})`)
    }
  }
  console.log('└──────────────────────────────\n')

  // ── 6. RESUMO ──
  console.log('┌─ 6. CÓDIGO DO DASHBOARD')
  console.log(`│  O dashboard em src/app/(dashboard)/admin/page.tsx usa:`)
  console.log(`│  const CARDS = [`)
  console.log(`│    { label: 'Alunos', count: '—', ... },`)
  console.log(`│    { label: 'Turmas', count: '—', ... },`)
  console.log(`│    ...`)
  console.log(`│  ]`)
  console.log(`│  Os valores '—' são LITERAIS, hardcoded. Não há nenhuma query`)

  // escola_id do coordenador etc
  console.log(`│`)
  for (const email of ['coordenadora@escolazab.com.br', 'secretaria@escolazab.com.br', 'professor1@escolazab.com.br']) {
    const u = users.find(x => x.email === email)
    const eid = u?.app_metadata?.escola_id
    console.log(`│  ${email}: escola_id JWT = ${eid}, match banco = ${eid === escolaId ? 'SIM' : 'NÃO'}`)
  }
  console.log('└──────────────────────────────\n')

  console.log('═══════════════════════════════════════════════════════════')
  console.log('  DIAGNÓSTICO CONCLUÍDO')
  console.log('═══════════════════════════════════════════════════════════')

  await pgClient.end()
}

main().catch((err) => {
  console.error('Fatal:', err.message || err)
  process.exit(1)
})
