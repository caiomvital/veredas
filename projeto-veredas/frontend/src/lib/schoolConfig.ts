/**
 * Configuração ativa — Escola: GRUPO ZAB DE EDUCAÇÃO
 *
 * Para trocar de escola, descomente o bloco "Template para nova escola" abaixo,
 * comente este bloco, e ajuste os valores.
 *
 * Os dados são usados pela landing page e complementam a tabela `escolas` no Supabase.
 * Ao alterar, reinicie o dev server para aplicar.
 */

export const schoolConfig = {
  // =========================================================
  // DADOS DA ESCOLA
  // =========================================================
  slug: 'zab',
  nome: 'Grupo ZAB de Educação',
  nome_curto: 'ZAB',
  cnpj: '00.000.000/0001-00',

  // =========================================================
  // ENDEREÇO
  // =========================================================
  endereco: {
    rua: 'Rua Professor João Alfredo Filho',
    numero: '321',
    bairro: 'Casa Caiada',
    cidade: 'Olinda',
    uf: 'PE',
    cep: '53030-000',
  },

  // =========================================================
  // CONTATO
  // =========================================================
  contato: {
    telefone: '(81) 3456-7890',
    email: 'contato@grupozabeducacao.com.br',
    site: 'https://www.grupozabeducacao.com.br',
  },

  // =========================================================
  // REDES SOCIAIS
  // =========================================================
  redesSociais: [
    { tipo: 'instagram', url: 'https://instagram.com/grupozabeducacao' },
    { tipo: 'facebook', url: 'https://facebook.com/grupozabeducacao' },
  ],

  // =========================================================
  // IDENTIDADE VISUAL
  // =========================================================
  identidadeVisual: {
    cor_primaria: '#1B5E20', // Verde-escuro — acolhimento, crescimento, educação
    cor_primaria_clara: '#E8F5E9',
    cor_secundaria: '#B8860B', // Dourado — qualidade, valor, aconchego
    cor_secundaria_clara: '#FFF8E1',
    cor_fundo: '#FEFCF3', // Off-white/creme
    cor_texto: '#1F2937',
    cor_texto_claro: '#6B7280',
    logo_url: '',
  },

  // =========================================================
  // CONFIGURAÇÃO ACADÊMICA
  // =========================================================
  configAcademica: {
    regime: 'bimestral',
    media_aprovacao: 6.0,
    qtd_avaliacoes_por_periodo: 4,
    anos_experiencia: 30,
  },

  // =========================================================
  // TEXTOS INSTITUCIONAIS
  // =========================================================
  textos: {
    slogan: 'Educação que transforma, acolhimento que desenvolve',
    sobre:
      'Fundado por Pedagogas, Psicólogas e Professoras com mais de 30 anos de experiência, o Grupo ZAB de Educação nasceu do sonho de oferecer uma educação que vai além do conteúdo. Acreditamos no desenvolvimento integral — onde o cuidar e o educar caminham juntos, respeitando o tempo de cada criança e valorizando as relações humanas.',
    missao:
      'Oferecer educação de qualidade que promova o desenvolvimento integral dos alunos, integrando aspectos cognitivos, socioemocionais e éticos, em um ambiente acolhedor e estimulante.',
    valores: [
      { titulo: 'Acolhimento', descricao: 'Cada criança é única e merece ser recebida com respeito, afeto e atenção às suas necessidades.' },
      { titulo: 'Excelência', descricao: 'Buscamos o melhor em práticas pedagógicas, formação continuada e infraestrutura.' },
      { titulo: 'Humanidade', descricao: 'Educar é um ato de amor. Priorizamos relações éticas, empáticas e colaborativas.' },
      { titulo: 'Inovação', descricao: 'Tradição e modernidade se encontram em metodologias ativas e recursos tecnológicos.' },
    ],
    niveis: [
      {
        nome: 'Educação Infantil',
        idade: '2 a 5 anos',
        icone: '🌸',
        descricao: 'Estimulação precoce, socialização e desenvolvimento da autonomia em um ambiente lúdico e seguro.',
        destaques: ['Alfabetização afetiva', 'Psicomotricidade', 'Arte e música', 'Horta pedagógica'],
      },
      {
        nome: 'Ensino Fundamental — Anos Iniciais',
        idade: '6 a 10 anos',
        icone: '📚',
        descricao: 'Base sólida em linguagens, matemática, ciências e valores humanos com metodologias participativas.',
        destaques: ['Projetos interdisciplinares', 'Acompanhamento personalizado', 'Educação socioemocional', 'Tecnologia educacional'],
      },
      {
        nome: 'Ensino Fundamental — Anos Finais',
        idade: '11 a 14 anos',
        icone: '🔬',
        descricao: 'Formação crítica e cidadã com aprofundamento curricular e preparação para o ensino médio.',
        destaques: ['Pensamento científico', 'Protagonismo juvenil', 'Eletivas e projetos', 'Preparação para o futuro'],
      },
    ],
    rodape:
      '© 2026 Grupo ZAB de Educação. Todos os direitos reservados. Olinda — PE',
  },
}

/* =============================================================
   TEMPLATE PARA NOVA ESCOLA
   =============================================================
   Instruções:
   1. Copie o bloco abaixo (da linha onde está "export const ..." até o final)
   2. Cole sobre o "schoolConfig" ativo (linha 11)
   3. Substitua os valores de exemplo pelos dados da sua escola
   4. Salve o arquivo e reinicie o dev server

   ATENÇÃO: lembre-se também de atualizar o seed da tabela `escolas`
   na migration `001_create_escolas.sql` para manter o Supabase sincronizado.

   // =============================================================
   // Exemplo completo (descomente para usar):
   // =============================================================

   // export const schoolConfig = {
   //   slug: 'nome-da-escola',
   //   nome: 'Nome Oficial da Escola',
   //   nome_curto: 'Sigla',
   //   cnpj: '00.000.000/0001-00',
   //
   //   // ENDEREÇO — usado no rodapé e na seção de contato
   //   endereco: {
   //     rua: 'Rua Exemplo',
   //     numero: '100',
   //     bairro: 'Centro',
   //     cidade: 'Recife',
   //     uf: 'PE',
   //     cep: '50000-000',
   //   },
   //
   //   // CONTATO — telefone, email e site
   //   contato: {
   //     telefone: '(81) 3000-0000',
   //     email: 'contato@escola.com.br',
   //     site: 'https://www.escola.com.br',
   //   },
   //
   //   // REDES SOCIAIS — adicione quantas quiser
   //   redesSociais: [
   //     { tipo: 'instagram', url: 'https://instagram.com/escola' },
   //     { tipo: 'facebook', url: 'https://facebook.com/escola' },
   //   ],
   //
   //   // IDENTIDADE VISUAL — cores e logo
   //   identidadeVisual: {
   //     cor_primaria: '#003366',        // Cor principal (sidebar, botões, headers)
   //     cor_primaria_clara: '#E6F0FA',  // Versão clara para fundos
   //     cor_secundaria: '#FF6B35',      // Cor de destaque (CTAs, badges)
   //     cor_secundaria_clara: '#FFF0E8', // Versão clara para fundos
   //     cor_fundo: '#F9FAFB',           // Fundo geral da página
   //     cor_texto: '#1F2937',            // Cor do texto principal
   //     cor_texto_claro: '#6B7280',      // Cor do texto secundário
   //     logo_url: '',                     // URL da logo (deixe '' se não tiver)
   //   },
   //
   //   // CONFIGURAÇÃO ACADÊMICA — notas e frequência
   //   configAcademica: {
   //     regime: 'bimestral',              // 'bimestral' | 'trimestral' | 'semestral'
   //     media_aprovacao: 6.0,             // Média para aprovação (0 a 10)
   //     qtd_avaliacoes_por_periodo: 4,    // Provas por período
   //   },
   //
   //   // TEXTOS INSTITUCIONAIS — usados na landing page e documentos
   //   textos: {
   //     slogan: 'Seu slogan aqui.',
   //     sobre: 'Conte a história da sua escola em 2 a 3 parágrafos.',
   //     missao: 'Descreva a missão da escola.',
   //     valores: [
   //       { titulo: 'Valor 1', descricao: 'Descrição do valor.' },
   //       { titulo: 'Valor 2', descricao: 'Descrição do valor.' },
   //     ],
   //     niveis: [
   //       {
   //         nome: 'Nome do Nível',
   //         idade: 'Faixa etária',
   //         icone: '🎯',
   //         descricao: 'Descrição do nível de ensino.',
   //         destaques: ['Destaque 1', 'Destaque 2'],
   //       },
   //     ],
   //     rodape: '© 2026 Sua Escola. Todos os direitos reservados.',
   //   },
   // }
   // ============================================================= */
