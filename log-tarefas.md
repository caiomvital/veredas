# Log de Tarefas — Veredas

---

## Tarefa 008

**Data/Hora:** 2026-05-12

**Prompt:** Continuar implementação dos 3 módulos finais (Comunicados, Calendário, Portal do Responsável)

**Resumo:**
- **Módulo 1 — Comunicados**: Migration `006_create_fase6.sql` executada. Server actions (criar, listar, marcar lido). Páginas: listagem com expansão e badge de lido, formulário de criação com destinatários (toda_escola/perfil/turma). Admin/coord cria, todos visualizam. Build OK.
- **Módulo 2 — Calendário Escolar**: Migration executada. Server actions (criar, listar, excluir). Página com grade mensal e lista, navegação entre meses, destaque visual por tipo (feriado/prova/reunião/evento/recesso). Admin/coord gerencia. Build OK.
- **Módulo 3 — Portal do Responsável**: Migration executada. Server actions em `responsavel.ts` (getAlunosDoResponsavel, getNotasAluno, getFrequenciasAluno, getBoletimAluno, getComunicadosResponsavel, getEventosCalendario). Layout próprio `(portal)/layout.tsx` com header e auth guard. Páginas: dashboard (cards de aluno + links rápidos), notas (select + lista), frequência (resumo + por disciplina + barra %), boletim (notas agrupadas + frequência geral), comunicados (expansão com badge), calendário (grade/lista. `app_metadata.perfil = 'responsavel'` adicionado ao `Perfil` type, middleware e `useAuth`. Build OK.
- Migration 006 executada no Supabase (tabelas `comunicados`, `comunicado_destinatarios`, `comunicado_leitura`, `eventos_calendario`).
- **Todos os 3 módulos concluídos com build zero errors.**

## Tarefa 001

**Data/Hora:** 2026-05-11

**Prompt:**

> Você é um arquiteto de software sênior.
>
> Vamos construir um sistema de gestão escolar white-label chamado "Veredas", para escolas pequenas e médias do Brasil.
>
> Stack definida:
> - Next.js 14 (App Router) + TypeScript
> - Tailwind CSS
> - Supabase (banco + auth + storage)
> - Deploy: Vercel
> - PDF: react-pdf ou similar
>
> Referência visual: Instituto Capibaribe (https://www.institutocapibaribe.com.br)
>
> White-label via `schoolConfig.ts` — nenhum outro arquivo deve ter nome de escola hardcoded.
>
> Perfis: Administrador, Coordenador, Secretaria, Professor, Responsável (futuro).
>
> Módulos essenciais:
> - Landing page institucional configurável
> - Autenticação por perfil
> - Cadastro de alunos e responsáveis
> - Turmas e disciplinas
> - Notas e frequência
> - Boletim (PDF)
> - Declaração de matrícula (PDF)
>
> Módulos secundários (roadmap):
> - Financeiro básico
> - Comunicados
> - Calendário
> - Histórico escolar (PDF)
> - Portal do responsável
>
> Contexto brasileiro: CPF, RG, datas DD/MM/AAAA, notas 0–10, frequência em %, LGPD para dados de menores.
>
> ---
>
> Quero que você entregue, SEM GERAR CÓDIGO:
>
> 1. Estrutura de pastas comentada
> 2. Módulos com responsabilidade de cada um
> 3. Modelagem das entidades principais (tabelas, campos, relacionamentos)
> 4. Perfis de acesso e permissões
> 5. Fluxo de autenticação com Supabase
> 6. Estratégia white-label via schoolConfig.ts
> 7. Estratégia de geração de PDF
> 8. Estratégia de deploy (Vercel + Supabase)
> 9. Estratégia de backup
> 10. Sequência de implementação módulo a módulo
>
> Apresente tudo organizado. Aguarde minha aprovação antes de qualquer código.

**Resultado:** Documento de arquitetura completo em 10 seções, cobrindo todos os tópicos solicitados:

1. **Estrutura de pastas** — organização completa do `/src` incluindo app router com agrupamento por perfil (landing, dashboard/admin, dashboard/professor, etc.), lib com utils brasileiros (validação CPF/CNPJ, CEP, datas), tipos, hooks, e pastas de PDF/Supabase.

2. **Módulos com responsabilidades** — 14 módulos detalhados: Landing Page, Autenticação, Alunos, Responsáveis, Turmas/Disciplinas, Notas, Frequência, Boletim PDF, Declaração de Matrícula PDF, Comunicados, Calendário, Financeiro, Histórico Escolar, Portal do Responsável — cada um com suas responsabilidades e regras de negócio.

3. **Modelagem de entidades** — 12 tabelas com campos, tipos e relacionamentos: escolas, funcionarios, alunos, responsaveis, aluno_responsavel (N:N), turmas, disciplinas, turma_disciplina_professor (alocação), matriculas, periodos_letivos, notas (com índice único composto), frequencias. Além disso: comunicados (roadmap) e auditoria (cross-cutting). Estratégia de RLS por `escola_id` via JWT.

4. **Perfis e permissões** — Matriz completa (Admin, Coordenador, Secretaria, Professor) com 30+ recursos mapeados. JWT custom claims com `app_metadata.perfil` e `app_metadata.escola_id`.

5. **Fluxo de autenticação** — 7 sub-fluxos: criação de usuário pelo admin, login, proteção de rotas (middleware), logout, sessão server-side, relação `auth.users` ↔ `funcionarios`, e convite por email com token expirável.

6. **Estratégia white-label** — `schoolConfig.ts` com tipagem completa, duas abordagens (build-time vs runtime), recomendação de multi-tenancy no Supabase, resolução por subdomínio, lista do que NUNCA pode ser hardcoded, e tema Tailwind dinâmico via CSS variables.

7. **Estratégia de PDF** — `@react-pdf/renderer` como biblioteca principal (serverless-friendly), pipeline de geração via Route Handler, templates componentizados, e hash de autenticidade opcional com QR code.

8. **Estratégia de deploy** — Vercel + Supabase, variáveis de ambiente, domínios customizados com CNAME, pipeline CI/CD (main → produção, PR → preview), setup do Supabase (migrations, RLS, triggers, storage).

9. **Estratégia de backup** — PITR do Supabase, backup semanal via `pg_dump` + GitHub Actions, backup de storage com rclone, restore documentado, e política de retenção LGPD (anonimização após 5 anos).

10. **Sequência de implementação** — 6 fases (56 passos): Fundação (autenticação + tema) → Cadastro Base (CRUDs) → Acadêmico (notas/frequência) → PDFs → Secretaria → Roadmap.

**Tópicos abordados:** Arquitetura de software, modelagem de dados, white-label multi-tenancy, Supabase Auth + RLS, React-PDF serverless, deploy Vercel, backup/RTO/RPO, LGPD compliance, roadmap ágil.

---

### Revisão — Bloco Professor e Bloco Financeiro

**Data/Hora:** 2026-05-11 (mesma sessão)

**Prompt de revisão:**

> Na arquitetura que você entregou, dois blocos estão incompletos. Preciso que você revise antes de aprovarmos.
>
> **Bloco Professor — adicionar ao módulo correspondente:**
> - Descrição da aula (registro do que foi dado em cada aula)
> - Atividade de casa (registro e acompanhamento)
> - Planejamento de aula
> - Diário de classe → gerado pelo professor, acessado pela Coordenação
>
> **Bloco Financeiro — adicionar:**
> - Extras (ex: almoço, material — lançamentos avulsos por aluno)
> - Descrição + valor por lançamento financeiro
>
> Para cada item acima, atualize:
> 1. A tabela correspondente na modelagem (novos campos ou novas tabelas se necessário)
> 2. A responsabilidade do módulo
> 3. A matriz de permissões (quem pode criar, ver, editar)
> 4. A posição na sequência de implementação
>
> Não gere código. Apenas revise e reapresente os trechos afetados da arquitetura. Atualize o arquivo log-tarefas com esse prompt e o resultado, mas pode colocar na mesma 'Tarefa 001'

**Resultado da revisão:**

**Bloco Professor — 4 novas tabelas:**

| Tabela | FK principal | Função |
|---|---|---|
| `registro_aulas` | turma_disciplina_id | Conteúdo dado em cada aula (índice único: turma_disciplina_id + data_aula) |
| `planejamento_aulas` | turma_disciplina_id + periodo_id | Planejamento semanal do professor |
| `atividades_casa` | turma_disciplina_id | Tarefas com data de entrega |
| `atividade_casa_entrega` | atividade_id + matricula_id | Controle individual de entrega por aluno (índice único composto) |
| `diarios_classe` | turma_disciplina_id + periodo_id | Snapshot JSON consolidado no momento da geração + PDF no Storage |

O `diarios_classe.conteudo_json` armazena um snapshot imutável de aulas, notas, frequência e planejamento no momento da geração — garantindo que o diário não altera depois de emitido.

**Bloco Financeiro — 1 tabela reformulada:**

`lancamentos_financeiros` — única tabela que cobre mensalidades e extras:
- `tipo`: mensalidade | extra | desconto
- `descricao`: texto livre ("Almoço Janeiro", "Material didático", "Mensalidade Março")
- `valor`: numeric(10,2)
- `data_vencimento` + `data_pagamento` + `status` (pendente, pago, atrasado, cancelado)
- Extras são simplesmente lançamentos com `tipo = 'extra'`, cada um com sua própria descrição e valor

**Matriz de permissões atualizada:**

| Recurso | Admin | Coord. | Secret. | Prof. |
|---|---|---|---|---|
| **Registro de aulas** | | | | |
| Criar/Editar | ✅ (qualquer) | ✅ (qualquer) | ❌ | ✅ (suas turmas) |
| Visualizar | ✅ | ✅ | ❌ | ✅ |
| **Planejamento de aulas** | | | | |
| Criar/Editar | ❌ | ✅ (revisar) | ❌ | ✅ (suas turmas) |
| Visualizar | ✅ | ✅ | ❌ | ✅ |
| **Atividades de casa** | | | | |
| Criar/Editar | ❌ | ❌ | ❌ | ✅ (suas turmas) |
| Visualizar entregas | ✅ | ✅ | ❌ | ✅ (suas turmas) |
| **Diário de classe** | | | | |
| Gerar/assinar | ❌ | ❌ | ❌ | ✅ (suas turmas) |
| Visualizar | ✅ | ✅ | ❌ | ❌ (só o próprio) |
| **Lançamentos financeiros** | | | | |
| Criar mensalidade | ✅ | ❌ | ❌ | ❌ |
| Criar extra | ✅ | ❌ | ✅ | ❌ |
| Editar valor | ✅ | ❌ | ❌ | ❌ |
| Baixar pagamento | ✅ | ❌ | ✅ | ❌ |
| Visualizar extrato | ✅ | ❌ | ✅ (alunos) | ❌ |

**Sequência de implementação atualizada:**

- **Fase 3 (Acadêmico):** adicionar registro de aulas, planejamento de aula, atividades de casa com controle de entrega
- **Fase 4 (PDFs):** adicionar Diário de Classe (PDF) — consolidado do período gerado pelo professor
- **Fase 5a (Secretaria):** rotinas administrativas originais
- **Fase 5b (Financeiro v1):** CRUD de lançamentos financeiros (mensalidade + extra), descrição/valor por lançamento, controle de pagamento, extrato por aluno, bloqueio condicional

---

## Tarefa 002 — Execução da Fase 1 (Fundação)

**Data/Hora:** 2026-05-11

**Prompt:**

> Arquitetura aprovada. Pode iniciar a implementação.
>
> Siga exatamente a sequência de fases definida:
>
> Fase 1 — Fundação:
> - Setup do projeto Next.js 14 com TypeScript e Tailwind
> - Configuração do Supabase (conexão, tipos gerados)
> - schoolConfig.ts com tipagem completa
> - Tema dinâmico via CSS variables
> - Sistema de autenticação completo (login, middleware, proteção de rotas)
> - Layout base dos dashboards por perfil (Admin, Coordenador, Secretaria, Professor)
>
> Execute apenas a Fase 1. Ao concluir, pare e aguarde minha confirmação antes de avançar para a Fase 2.

**Resultado:** Projeto Next.js 14.2.35 configurado e buildando com sucesso. Estrutura completa da Fase 1:

### Arquivos criados (30+)

**Configuração raiz:**
- `package.json` — dependências: next@14, react@18, supabase/ssr, supabase-js, zod, lucide-react, tailwind-merge, clsx
- `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.json`, `.gitignore`
- `.env.local` — template com placeholders para Supabase + config de escola

**Tipos (`/src/types/`):**
- `school.ts` — interfaces `SchoolConfig`, `IdentidadeVisual`, `ConfigAcademica`, `Perfil` e todas as sub-configs
- `entities.ts` — interfaces de todas as entidades do sistema (`Funcionario`, `Aluno`, `Turma`, `Nota`, etc.)
- `database.ts` — tipo `Database` compatível com Supabase (tabela `escolas` com Row/Insert/Update)

**Supabase (`/src/lib/supabase/`):**
- `client.ts` — `createBrowserClient` (lado do browser)
- `server.ts` — `createServerClient` com cookie handling via `next/headers` (server components)
- `admin.ts` — `createClient` com `service_role` (operações administrativas)

**White-label school config:**
- `src/lib/school.ts` — `getSchoolConfig(slug?)` server-side com cache em memória (TTL 5 min)
- `src/hooks/useSchool.tsx` — `SchoolProvider` + hook `useSchool()` client-side
  - Fetch da config no Supabase por slug
  - `applyTheme()`: injeta CSS variables no `:root` dinamicamente
  - Geração automática de shades da cor primária (50 a 900)
  - Estados: loading, error, success

**Autenticação:**
- `src/hooks/useAuth.ts` — hook `useAuth()` com `signIn`, `signOut`, `getDashboardUrl`, detecção de perfil via `app_metadata`
- `src/middleware.ts` — proteção de rotas: redireciona para login se não autenticado, redireciona para dashboard correto se perfil não tem acesso à rota
- `src/app/login/page.tsx` — formulário de login com email/senha, loading state, error state (mensagens em português)

**Layout e UI:**
- `src/components/ui/button.tsx` — 5 variantes (primary, secondary, ghost, outline, danger), 3 tamanhos, estado de loading com spinner
- `src/components/ui/input.tsx` — com label, error state, foco estilizado
- `src/components/ui/card.tsx` — Card, CardHeader, CardContent, CardFooter
- `src/components/ui/avatar.tsx` — com fallback de iniciais
- `src/components/layout/sidebar.tsx` — sidebar responsiva com:
  - Logo da escola vindo do schoolConfig
  - Itens de navegação filtrados por perfil
  - Destaque na rota ativa
  - Menu mobile com overlay + toggle
  - Informações do usuário logado + botão de logout
- `src/app/(dashboard)/layout.tsx` — layout com sidebar + main content
- `src/app/(dashboard)/*/page.tsx` — dashboards para admin, coordenador, secretaria, professor com cards de navegação

**Landing page:**
- `src/app/page.tsx` — página inicial institucional com header, hero e footer
- `src/app/globals.css` — CSS variables para o tema dinâmico + Tailwind base
- `src/app/layout.tsx` — root layout com SchoolProvider

**Banco de dados:**
- `supabase/migrations/001_create_escolas.sql` — criação da tabela `escolas` com trigger de `updated_at`, seed de dados de desenvolvimento, função `get_escola_id(slug)`

### Build Result
```
✓ Compiled successfully
✓ Generating static pages (9/9)

Route (app)                Size     First Load JS
┌ ○ /                      175 B          96.2 kB
├ ○ /admin                 2.01 kB         105 kB
├ ○ /coordenador           1.87 kB         105 kB
├ ○ /login                 2.4 kB          159 kB
├ ○ /professor             2 kB            105 kB
├ ○ /secretaria            1.79 kB         105 kB
```

### Pendente para execução
- Criar projeto Supabase e configurar as credenciais no `.env.local`
- Rodar a migration `001_create_escolas.sql` no Supabase
- Criar um usuário de teste via Supabase Auth com `app_metadata.perfil = 'admin'`
- Iniciar o dev server para testar visualmente

**Tópicos abordados:** Next.js 14 setup, Tailwind CSS variables dinâmicas, Supabase SSR clients, white-label multi-tenancy, autenticação com JWT claims, middleware de rotas, layout responsivo por perfil, sidebar com navegação contextual.

---

## Tarefa 003 — Execução da Fase 2 (Cadastro Base)

**Data/Hora:** 2026-05-11

**Prompt:**

> Fase 1 aprovada. Avançar para a Fase 2.
>
> Fase 2 — Cadastro Base:
> - CRUD de funcionários (Admin e Secretaria)
> - CRUD de alunos (com dados brasileiros: CPF, RG, data nascimento)
> - CRUD de responsáveis + vínculo com aluno (N:N)
> - CRUD de turmas e disciplinas
> - CRUD de matrículas
>
> Execute apenas a Fase 2. Ao concluir, pare e aguarde minha confirmação antes de avançar para a Fase 3.

**Resultado:** Build 100% verde — 20 páginas geradas, zero erros de TypeScript.

### Migration SQL
- `supabase/migrations/002_create_fase2.sql` — 8 tabelas com RLS, índices e triggers:
  - `funcionarios` — com cargo (admin, coordenador, secretaria, professor), vinculo com auth.users
  - `alunos` — CPF, RG, filiação, endereço, status, autorizações LGPD
  - `responsaveis` — dados completos + vinculo opcional com auth.users
  - `aluno_responsavel` — N:N com grau de parentesco
  - `turmas` — código+série+turno+ano_letivo (unique composto)
  - `disciplinas` — nome, código, área de conhecimento
  - `turma_disciplina_professor` — alocação com carga horária
  - `matriculas` — aluno+turma+status+data

### Server Actions (`/src/lib/actions/`)
- `types.ts` — tipo `ActionResult<T>` com helpers `ok()` e `fail()`
- `funcionarios.ts` — listar, get, criar, atualizar, excluir (soft delete via ativo=false)
- `alunos.ts` — listar com filtros (status, busca textual), CRUD completo, soft delete
- `responsaveis.ts` — CRUD + vincular/desvincular aluno com grau de parentesco
- `turmas.ts` — CRUD turmas + disciplinas + alocações
- `matriculas.ts` — listar com filtros, criar, cancelar

### Componentes de UI
- `select.tsx` — dropdown com label, error state, options
- `textarea.tsx` — multiline com label, error state
- `badge.tsx` — 5 variantes (default, success, warning, danger, info) + helper `statusBadge()`
- `data-table.tsx` — tabela genérica com:
  - Busca textual com filtro por colunas específicas
  - Ordenação por coluna clicável
  - Paginação com navegação
  - Coluna de ações
  - Estados: loading, empty, erro

### Páginas CRUD criadas (16 novas rotas)

| Rota | Funcionalidade | Acesso |
|---|---|---|
| `/admin/funcionarios` | Lista de funcionários | Admin |
| `/admin/funcionarios/novo` | Formulário de criação | Admin |
| `/admin/funcionarios/[id]` | Edição + inativar | Admin |
| `/admin/alunos` | Lista com filtro por status | Admin, Coord, Secretaria |
| `/admin/alunos/novo` | Formulário completo (CPF, RG, filiação, endereço, LGPD) | Admin, Coord, Secretaria |
| `/admin/alunos/[id]` | Edição + inativar | Admin, Coord, Secretaria |
| `/admin/responsaveis` | Lista de responsáveis | Admin, Secretaria |
| `/admin/responsaveis/novo` | Formulário de criação | Admin, Secretaria |
| `/admin/responsaveis/[id]` | Edição + vínculo N:N com alunos (adicionar/remover) | Admin, Secretaria |
| `/admin/turmas` | Lista de turmas (ano atual) | Admin, Coord |
| `/admin/turmas/novo` | Formulário com série, turno, capacidade | Admin, Coord |
| `/admin/turmas/[id]` | Edição + desativar | Admin, Coord |
| `/admin/disciplinas` | Lista + formulário inline de criação | Admin, Coord |
| `/secretaria/matriculas` | Lista com filtros (status, turma) | Admin, Secretaria |
| `/secretaria/matriculas/nova` | Seleção de aluno + turma | Admin, Secretaria |

### Build Result
```
✓ Compiled successfully
✓ Generating static pages (20/20)

Route (app)                         Size     First Load JS
┌ ○ /admin/alunos                   2.12 kB         108 kB
├ ƒ /admin/alunos/[id]              2.82 kB         106 kB
├ ○ /admin/alunos/novo              2.75 kB         106 kB
├ ○ /admin/disciplinas              2.56 kB        99.5 kB
├ ○ /admin/funcionarios             1.7 kB          107 kB
├ ƒ /admin/funcionarios/[id]        2.78 kB         106 kB
├ ○ /admin/funcionarios/novo        2.51 kB         105 kB
├ ○ /admin/responsaveis             1.34 kB         107 kB
├ ƒ /admin/responsaveis/[id]        4.11 kB         107 kB
├ ○ /admin/responsaveis/novo        2.34 kB         105 kB
├ ○ /admin/turmas                   1.85 kB         107 kB
├ ƒ /admin/turmas/[id]              2.86 kB         106 kB
├ ○ /admin/turmas/novo              2.68 kB         105 kB
├ ○ /secretaria/matriculas          2.54 kB         108 kB
└ ○ /secretaria/matriculas/nova     2.99 kB         106 kB
```

### Pendente para execução
- Configurar projeto Supabase com as credenciais reais no `.env.local`
- Rodar as migrations `001` e `002` no Supabase SQL Editor
- Criar usuário de teste com `app_metadata = { "perfil": "admin", "escola_id": "<id>" }`
- Iniciar dev server e testar CRUDs

**Tópicos abordados:** Server Actions Next.js 14, CRUD completo com Supabase, DataTable genérico, formulários brasileiros (CPF/RG/LGPD), soft delete, vínculo N:N responsável-aluno, RLS policies, filtros e busca textual.

---

*Próximos passos: aguardando confirmação do usuário para avançar para a Fase 3 (Acadêmico).*

---

## Tarefa 004 — Execução da Fase 3 (Acadêmico)

**Data/Hora:** 2026-05-11

**Prompt:**

> Fase 2 aprovada. Avançar para a Fase 3.
>
> Fase 3 — Acadêmico:
> - Períodos letivos (CRUD)
> - Lançamento de notas (prova, trabalho, recuperação)
> - Lançamento de frequência (chamada)
> - Registro de aulas (descrição da aula)
> - Atividades de casa
> - Planejamento de aula
> - Diário de classe (gerado pelo professor, acessado pela Coordenação)
>
> Execute apenas a Fase 3. Ao concluir, pare e aguarde minha confirmação antes de avançar para a Fase 4.

**Resultado:** Build 100% verde — 41 rotas, zero erros de TypeScript.

### Migration SQL
- `supabase/migrations/003_create_fase3.sql` — 7 tabelas: periodos_letivos, notas, frequencias, registro_aulas, planejamento_aulas, atividades_casa, atividade_casa_entrega, diarios_classe

### Server Actions adicionadas
- `src/lib/actions/periodos.ts` — CRUD de períodos letivos
- `src/lib/actions/academico.ts` — getTurmasDoProfessor, getAlunosDaTurma, salvarNotas, getNotas, salvarFrequencias, getFrequencias
- `src/lib/actions/aulas.ts` — CRUD registro de aulas, atividades, planejamento, geração de diários

### Páginas criadas (21 novas rotas)

| Rota | Funcionalidade | Acesso |
|---|---|---|
| `/admin/periodos` | Lista de períodos letivos | Admin, Coord |
| `/admin/periodos/novo` | Criar período | Admin, Coord |
| `/admin/periodos/[id]` | Editar período | Admin, Coord |
| `/professor/minhas-turmas` | Cards com ações por turma | Professor |
| `/professor/notas` | Seleção de turma | Professor |
| `/professor/notas/[turmaDisciplinaId]` | Grid notas (prova/trab/recup) | Professor |
| `/professor/chamada` | Seleção de turma | Professor |
| `/professor/chamada/[turmaDisciplinaId]` | Chamada por data | Professor |
| `/professor/registro-aulas` | Lista com filtro | Professor |
| `/professor/registro-aulas/novo` | Criar registro | Professor |
| `/professor/registro-aulas/[id]` | Editar registro | Professor |
| `/professor/atividades` | Lista com filtro | Professor |
| `/professor/atividades/novo` | Criar atividade | Professor |
| `/professor/atividades/[id]` | View + entregas | Professor |
| `/professor/planejamento` | Lista com filtro | Professor |
| `/professor/planejamento/novo` | Criar planejamento | Professor |
| `/professor/planejamento/[id]` | Editar planejamento | Professor |
| `/professor/diarios` | Lista + gerar diário | Professor |
| `/coordenador/diarios` | Lista enriquecida | Coordenador |

### Erros corrigidos durante a execução
- `getAlunosDaTurma` return type mismatch → cast `as Array<...>` nos call sites
- Select Option type: `id` → `value` em turmas state
- `useSearchParams()` sem Suspense boundary → wrappers com `<Suspense fallback>`
- `useRouter` import não utilizado → removido

---

## Tarefa 005 — Execução da Fase 4 (PDFs)

**Data/Hora:** 2026-05-11

**Prompt:**

> Fase 3 aprovada. Avançar para a Fase 4.
>
> Fase 4 — PDFs:
> - Boletim escolar (notas + frequência por aluno)
> - Declaração de matrícula
> - Diário de classe (versão PDF para impressão)
>
> Execute apenas a Fase 4. Ao concluir, pare e aguarde minha confirmação antes de avançar para a Fase 5.

**Resultado:** Build 100% verde — 43 rotas, zero erros.

### Dependências
- Instalado `jspdf` + `jspdf-autotable`

### Server Actions adicionadas
- `getFrequenciasPorTurmaDisciplina(turmaDisciplinaId, periodoId?)` — retorna frequências de uma turma, com filtro opcional por período
- `getDiario(id)` — retorna diário completo com `conteudo_json`

### PDF Utilities (`/src/lib/pdf/`)
- `boletim.ts` — PDF com tabela de notas (prova/trabalho/recuperação) + frequência por aluno
- `declaracao.ts` — Declaração de matrícula com template configurável (variáveis `{{nome_aluno}}`, `{{matricula}}`, etc.)
- `diario.ts` — Diário de classe com 4 seções: planejamentos, aulas, frequências, notas

### Páginas novas
- `/professor/boletins` → `/professor/boletins/[turmaDisciplinaId]` — boletim por turma/período com download PDF
- `/secretaria/declaracoes` — selecionar aluno → gerar declaração de matrícula PDF

### Páginas modificadas
- `/professor/diarios` — coluna "Baixar" com geração de PDF via `gerarDiarioPDF`
- `/coordenador/diarios` — mesma funcionalidade + campo `turma_id` adicionado ao query enriquecido

### Erros corrigidos
- Type error: cast `as Record<string, unknown>` em tipos sem index signature → `as unknown as Record<string, unknown>`

---

## Tarefa 006 — Execução da Fase 5a (Secretaria: Histórico + Transferência)

**Data/Hora:** 2026-05-11

**Prompt:**

> Fase 4 aprovada. Avançar para a Fase 5a.
>
> Fase 5a — Secretaria:
> - Histórico escolar do aluno (registro anual, situação: aprovado/reprovado/transferido)
> - Geração de PDF do histórico escolar
> - Declaração de transferência
>
> Execute apenas a Fase 5a. Ao concluir, pare e aguarde minha confirmação antes de avançar para a Fase 5b.

**Resultado:** Build 100% verde — 45 rotas, zero erros.

### Migration SQL
- `supabase/migrations/004_create_fase5a.sql` — tabela `historico_escolar` com RLS, índice e trigger

### Server Actions criadas
- `src/lib/actions/historico.ts` — CRUD completo + `getHistoricoCompleto` (join com turmas para PDF)
- `src/lib/actions/transferencia.ts` — `realizarTransferencia` (atualiza aluno.status + matricula.status na 1ª vez; apenas retorna dados se já transferido)

### Entity Type adicionada
- `HistoricoEscolar` em `src/types/entities.ts`

### PDF Utilities criadas
- `src/lib/pdf/historico.ts` — PDF com cabeçalho da escola, dados do aluno, tabela de histórico por ano
- `src/lib/pdf/transferencia.ts` — Declaração de transferência com template configurável

### Páginas novas
- `/secretaria/historico` — Select de aluno → DataTable de registros → form inline (add/edit) → Baixar PDF
- `/secretaria/transferencia` — Select de aluno → card com dados → "Realizar Transferência" (com confirmação) → auto-download PDF

### Sidebar/Dashboard
- Nav items: Histórico Escolar + Transferência adicionados ao sidebar
- Cards: Mesmos links no dashboard da secretaria

---

## Tarefa 007 — Execução da Fase 5b (Financeiro v1)

**Data/Hora:** 2026-05-12

**Prompt:**
> Fase 5a aprovada. Avançar para a Fase 5b.
>
> Fase 5b — Financeiro v1:
> - Configuração de mensalidades por série (Admin)
> - Lançamentos financeiros (mensalidades + extras)
> - Baixa de pagamentos com cálculo automático de multa (2% após vencimento)
> - Listagem de inadimplentes
> - Admin: configura + gerencia tudo; Secretaria: baixa pagamentos e cria extras

**Resultado:** Build 100% verde — 47 rotas, zero erros.

### Migration SQL
- `supabase/migrations/005_create_fase5b.sql` — 2 tabelas:
  - `config_mensalidades` — escola_id, serie, ano_letivo, valor; UNIQUE(escola_id, serie, ano_letivo); RLS
  - `lancamentos_financeiros` — escola_id, aluno_id (nullable), tipo CHECK(mensalidade|extra), descricao, valor, data_vencimento, status CHECK(pendente|pago), data_pagamento, multa DEFAULT 0, pago_em, baixado_por, criado_por; RLS; índices em (escola_id, status), (aluno_id), (data_vencimento)

### Entity Types adicionadas
- `ConfigMensalidade`, `LancamentoFinanceiro`, `LancamentoTipo`, `LancamentoStatus` em `src/types/entities.ts`

### Server Actions criadas
- `src/lib/actions/financeiro.ts`:
  - `listarConfigMensalidades(anoLetivo?)` — lista configurações
  - `salvarConfigMensalidade(formData)` — upsert com onConflict
  - `excluirConfigMensalidade(id)` — remove configuração
  - `listarLancamentos(params?)` — lista com filtros (status, tipo, aluno_id)
  - `criarLancamentoExtra(formData)` — cria lançamento tipo 'extra'
  - `baixarPagamento(id, dataPagamento?)` — registra pagamento com multa 2% se atrasado
  - `listarInadimplentes()` — pendentes com data_vencimento < hoje

### Página criada
- `/admin/financeiro` — página única com seções condicionais por perfil:
  - Admin: configuração de mensalidades (form + tabela) + 4 tabs + criar extras
  - Secretaria: 4 tabs + baixar pagamentos + criar extras
  - Tabs: Pendentes, Pagos, Inadimplentes (com badge de contagem), Extras
  - Modal inline para baixa de pagamento com cálculo de multa

### Alterações em arquivos existentes
- `src/components/layout/sidebar.tsx` — Financeiro agora visível para admin e secretaria
- `src/middleware.ts` — adicionado `PERMISSOES_ROTA_ESPECIFICAS` para `/admin/financeiro` permitir secretaria

### Build Result
```
✓ Compiled successfully
✓ Generating static pages (38/38)

Route (app)                         Size     First Load JS
├ ○ /admin/financeiro               8.47 kB         166 kB
```

### Pendente para execução
- Rodar migration `005_create_fase5b.sql` no Supabase
- Testar fluxo completo: criar config → lançar mensalidades → baixar pagamento com/ sem multa → verificar inadimplentes

