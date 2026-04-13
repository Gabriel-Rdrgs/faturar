import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // -------------------------
  // UNIDADES
  // -------------------------
  console.log('📦 Criando unidades...');

  const [faturar, fleming, provida, solar, logos] = await Promise.all([
    prisma.unidade.upsert({
      where: { cnpj: '00.000.000/0001-01' },
      update: {},
      create: {
        nome: 'Faturar Gestão Administrativa',
        tipo: 'EMPRESA',
        cnpj: '00.000.000/0001-01',
        ativo: true,
        observacoes: 'Empresa central de gestão administrativa',
      },
    }),
    prisma.unidade.upsert({
      where: { cnpj: '00.000.000/0001-02' },
      update: {},
      create: {
        nome: 'Laboratório Fleming',
        tipo: 'LABORATORIO',
        cnpj: '00.000.000/0001-02',
        ativo: true,
        observacoes: 'Laboratório de análises clínicas',
      },
    }),
    prisma.unidade.upsert({
      where: { cnpj: '00.000.000/0001-03' },
      update: {},
      create: {
        nome: 'Clínica Provida',
        tipo: 'CLINICA',
        cnpj: '00.000.000/0001-03',
        ativo: true,
        observacoes: 'Clínica médica',
      },
    }),
    prisma.unidade.upsert({
      where: { cnpj: '00.000.000/0001-04' },
      update: {},
      create: {
        nome: 'Edifício Solar',
        tipo: 'PREDIO',
        cnpj: '00.000.000/0001-04',
        ativo: true,
        observacoes: 'Gestão predial',
      },
    }),
    prisma.unidade.upsert({
      where: { cnpj: '00.000.000/0001-05' },
      update: {},
      create: {
        nome: 'Faculdade Logos',
        tipo: 'FACULDADE',
        cnpj: '00.000.000/0001-05',
        ativo: true,
        observacoes: 'Instituição de ensino superior',
      },
    }),
  ]);

  console.log('✅ 5 unidades criadas');

  // -------------------------
  // TIPOS DE DOCUMENTO
  // -------------------------
  console.log('📄 Criando tipos de documento...');

  const tiposDocumento = [
    // Habilitação Jurídica
    {
      nome: 'Ato Constitutivo / Contrato Social',
      orgaoEmissor: 'Junta Comercial / Cartório',
      validadePadraoDias: null,
      limiteAtencaoDias: null,
      urlEmissao: null,
      categoria: 'JURIDICA' as const,
      observacoes: 'Com todas as alterações ou consolidado. Habilitação Jurídica.',
    },
    {
      nome: 'Ata de Eleição da Diretoria',
      orgaoEmissor: 'Junta Comercial / Cartório',
      validadePadraoDias: null,
      limiteAtencaoDias: null,
      urlEmissao: null,
      categoria: 'JURIDICA' as const,
      observacoes: 'Quando aplicável. Habilitação Jurídica.',
    },
    {
      nome: 'Procuração (representante legal)',
      orgaoEmissor: 'Cartório',
      validadePadraoDias: null,
      limiteAtencaoDias: null,
      urlEmissao: null,
      categoria: 'JURIDICA' as const,
      observacoes: 'Quando houver representante. Habilitação Jurídica.',
    },
    {
      nome: 'Cartão CNPJ',
      orgaoEmissor: 'Receita Federal',
      validadePadraoDias: 90,
      limiteAtencaoDias: 30,
      urlEmissao: 'https://servicos.receita.fazenda.gov.br/Servicos/cnpjreva/Cnpjreva_Solicitacao.asp',
      categoria: 'JURIDICA' as const,
      observacoes: null,
    },
    {
      nome: 'Alvará de Funcionamento',
      orgaoEmissor: 'Prefeitura Municipal',
      validadePadraoDias: 365,
      limiteAtencaoDias: 60,
      urlEmissao: null,
      categoria: 'JURIDICA' as const,
      observacoes: 'Renovação anual',
    },
    // Regularidade Fiscal
    {
      nome: 'Certidão Conjunta PGFN/RFB',
      orgaoEmissor: 'Receita Federal / PGFN',
      validadePadraoDias: 180,
      limiteAtencaoDias: 30,
      urlEmissao: 'https://solucoes.receita.fazenda.gov.br/Servicos/certidaointernet/PJ/Emitir',
      categoria: 'FISCAL' as const,
      observacoes: 'Certidão de débitos federais e dívida ativa da União.',
    },
    {
      nome: 'CND Estadual',
      orgaoEmissor: 'Secretaria de Fazenda Estadual',
      validadePadraoDias: 180,
      limiteAtencaoDias: 30,
      urlEmissao: null,
      categoria: 'FISCAL' as const,
      observacoes: 'Certidão Negativa de Débitos Estaduais.',
    },
    {
      nome: 'CND Municipal',
      orgaoEmissor: 'Secretaria Municipal da Fazenda',
      validadePadraoDias: 180,
      limiteAtencaoDias: 30,
      urlEmissao: null,
      categoria: 'FISCAL' as const,
      observacoes: 'Certidão Negativa de Débitos Municipais.',
    },
    {
      nome: 'Certidão Negativa de Tributos Mobiliários',
      orgaoEmissor: 'Secretaria Municipal da Fazenda',
      validadePadraoDias: 180,
      limiteAtencaoDias: 30,
      urlEmissao: null,
      categoria: 'FISCAL' as const,
      observacoes: 'Solicitar na Prefeitura da sede da empresa.',
    },
    // Regularidade Trabalhista
    {
      nome: 'Certidão Negativa de Débitos Trabalhistas (CNDT)',
      orgaoEmissor: 'Tribunal Superior do Trabalho',
      validadePadraoDias: 180,
      limiteAtencaoDias: 30,
      urlEmissao: 'https://cndt-certidao.tst.jus.br',
      categoria: 'TRABALHISTA' as const,
      observacoes: 'Regularidade Trabalhista.',
    },
    {
      nome: 'Certificado de Regularidade do FGTS (CRF)',
      orgaoEmissor: 'Caixa Econômica Federal',
      validadePadraoDias: 30,
      limiteAtencaoDias: 10,
      urlEmissao: 'https://consulta-crf.caixa.gov.br',
      categoria: 'TRABALHISTA' as const,
      observacoes: 'Regularidade Trabalhista.',
    },
    // Qualificação Técnica
    {
      nome: 'Licença de Funcionamento – Vigilância Sanitária',
      orgaoEmissor: 'Vigilância Sanitária Municipal',
      validadePadraoDias: 365,
      limiteAtencaoDias: 60,
      urlEmissao: null,
      categoria: 'SANITARIA' as const,
      observacoes: 'Renovação anual obrigatória. OBRIGATÓRIA para credenciamento SUS.',
    },
    {
      nome: 'Licença Sanitária',
      orgaoEmissor: 'Vigilância Sanitária Estadual',
      validadePadraoDias: 365,
      limiteAtencaoDias: 60,
      urlEmissao: null,
      categoria: 'SANITARIA' as const,
      observacoes: 'Qualificação Técnica.',
    },
    {
      nome: 'Licença de Funcionamento ANVISA',
      orgaoEmissor: 'ANVISA',
      validadePadraoDias: 365,
      limiteAtencaoDias: 60,
      urlEmissao: 'https://www.gov.br/anvisa',
      categoria: 'SANITARIA' as const,
      observacoes: 'Para laboratórios e clínicas.',
    },
    {
      nome: 'Comprovante de Credenciamento SUS (CNES)',
      orgaoEmissor: 'Secretaria de Saúde',
      validadePadraoDias: 365,
      limiteAtencaoDias: 60,
      urlEmissao: 'https://cnes.datasus.gov.br',
      categoria: 'TECNICA' as const,
      observacoes: 'CONDIÇÃO BÁSICA DE PARTICIPAÇÃO no Edital 007/2025.',
    },
    {
      nome: 'Registro/Inscrição no Conselho Regional (CRF/CRM/CRBM)',
      orgaoEmissor: 'Conselho Regional competente',
      validadePadraoDias: 365,
      limiteAtencaoDias: 60,
      urlEmissao: null,
      categoria: 'TECNICA' as const,
      observacoes: 'Verificar anuidade paga.',
    },
    {
      nome: 'Certidão de Registro dos Responsáveis Técnicos',
      orgaoEmissor: 'Conselho Regional competente',
      validadePadraoDias: 365,
      limiteAtencaoDias: 60,
      urlEmissao: null,
      categoria: 'TECNICA' as const,
      observacoes: 'Por profissional responsável técnico.',
    },
    {
      nome: 'Atestado de Capacidade Técnica',
      orgaoEmissor: 'Pessoa Jurídica pública ou privada',
      validadePadraoDias: null,
      limiteAtencaoDias: null,
      urlEmissao: null,
      categoria: 'TECNICA' as const,
      observacoes: 'Deve comprovar atividade compatível com o objeto do edital.',
    },
    // Qualificação Econômica
    {
      nome: 'Certidão Negativa de Falência e Recuperação Judicial',
      orgaoEmissor: 'Distribuidor Judicial da sede',
      validadePadraoDias: 60,
      limiteAtencaoDias: 20,
      urlEmissao: null,
      categoria: 'JURIDICA' as const,
      observacoes: 'Solicitar no Fórum/TJGO da sede. Qualificação Econômica.',
    },
    {
      nome: 'Balanço Patrimonial',
      orgaoEmissor: 'Contabilidade da empresa',
      validadePadraoDias: null,
      limiteAtencaoDias: null,
      urlEmissao: null,
      categoria: 'FISCAL' as const,
      observacoes: 'Último exercício. LG, LC e SG ≥ 1,0. Qualificação Econômica.',
    },
    // Declarações
    {
      nome: 'Declaração de Idoneidade',
      orgaoEmissor: 'Empresa (autodeclaração)',
      validadePadraoDias: null,
      limiteAtencaoDias: null,
      urlEmissao: null,
      categoria: 'DECLARACAO' as const,
      observacoes: 'Declaração de que não foi declarada inidônea.',
    },
    {
      nome: 'Declaração de Não Empregar Menor',
      orgaoEmissor: 'Empresa (autodeclaração)',
      validadePadraoDias: null,
      limiteAtencaoDias: null,
      urlEmissao: null,
      categoria: 'DECLARACAO' as const,
      observacoes: 'Art. 7º, XXXIII da CF/88.',
    },
    // Específicos por tipo de unidade
    {
      nome: 'AVCB – Auto de Vistoria do Corpo de Bombeiros',
      orgaoEmissor: 'Corpo de Bombeiros',
      validadePadraoDias: 365,
      limiteAtencaoDias: 60,
      urlEmissao: null,
      categoria: 'SANITARIA' as const,
      observacoes: 'Obrigatório para prédios comerciais e clínicas.',
    },
    {
      nome: 'Laudo Técnico de Elevadores',
      orgaoEmissor: 'Empresa especializada',
      validadePadraoDias: 365,
      limiteAtencaoDias: 60,
      urlEmissao: null,
      categoria: 'TECNICA' as const,
      observacoes: 'Inspeção anual obrigatória.',
    },
    {
      nome: 'Certificação ISO 9001',
      orgaoEmissor: 'Organismo certificador acreditado',
      validadePadraoDias: 365,
      limiteAtencaoDias: 90,
      urlEmissao: null,
      categoria: 'TECNICA' as const,
      observacoes: 'Ou equivalente. Exigida pelo Edital 007/2025.',
    },
    {
      nome: 'Certidão de Regularidade INSS (CND/CPD-EN)',
      orgaoEmissor: 'Receita Federal',
      validadePadraoDias: 90,
      limiteAtencaoDias: 30,
      urlEmissao: 'https://solucoes.receita.fazenda.gov.br/Servicos/certidaointernet/PJ/Emitir',
      categoria: 'FISCAL' as const,
      observacoes: null,
    },
  ];

  let tiposCriados = 0;
  for (const tipo of tiposDocumento) {
    await prisma.tipoDocumento.upsert({
      where: { nome: tipo.nome },
      update: {},
      create: tipo as any,
    });
    tiposCriados++;
  }

  console.log(`✅ ${tiposCriados} tipos de documento criados`);

  // -------------------------
  // CONTRATOS — EDITAL 007/2025
  // -------------------------
  console.log('📋 Criando contratos...');

  const contratoFleming = await prisma.contrato.upsert({
    where: {
      nome_unidadeId: {
        nome: 'Edital 007/2025 – Laboratório Fleming',
        unidadeId: fleming.id,
      },
    },
    update: {},
    create: {
      nome: 'Edital 007/2025 – Laboratório Fleming',
      tipo: 'CREDENCIAMENTO',
      orgaoContratante: 'Fundo Municipal de Saúde de Cidade Ocidental/GO',
      status: 'EM_HABILITACAO',
      observacoes: 'Credenciamento de laboratório de análises clínicas. Processo inicial de habilitação.',
      unidadeId: fleming.id,
    },
  });

  const contratoProvida = await prisma.contrato.upsert({
    where: {
      nome_unidadeId: {
        nome: 'Edital 007/2025 – Clínica Provida',
        unidadeId: provida.id,
      },
    },
    update: {},
    create: {
      nome: 'Edital 007/2025 – Clínica Provida',
      tipo: 'CREDENCIAMENTO',
      orgaoContratante: 'Fundo Municipal de Saúde de Cidade Ocidental/GO',
      status: 'EM_HABILITACAO',
      observacoes: 'Credenciamento de clínica médica. Processo inicial de habilitação.',
      unidadeId: provida.id,
    },
  });

  console.log('✅ 2 contratos criados');

  // -------------------------
  // DOCUMENTOS INICIAIS — FLEMING
  // -------------------------
  console.log('📎 Criando documentos iniciais do Laboratório Fleming...');

  const tipoLicencaVigilancia = await prisma.tipoDocumento.findUnique({
    where: { nome: 'Licença de Funcionamento – Vigilância Sanitária' },
  });
  const tipoCNES = await prisma.tipoDocumento.findUnique({
    where: { nome: 'Comprovante de Credenciamento SUS (CNES)' },
  });
  const tipoCNDT = await prisma.tipoDocumento.findUnique({
    where: { nome: 'Certidão Negativa de Débitos Trabalhistas (CNDT)' },
  });
  const tipoCRF = await prisma.tipoDocumento.findUnique({
    where: { nome: 'Certificado de Regularidade do FGTS (CRF)' },
  });
  const tipoPGFN = await prisma.tipoDocumento.findUnique({
    where: { nome: 'Certidão Conjunta PGFN/RFB' },
  });
  const tipoAlvara = await prisma.tipoDocumento.findUnique({
    where: { nome: 'Alvará de Funcionamento' },
  });
  const tipoContratoSocial = await prisma.tipoDocumento.findUnique({
    where: { nome: 'Ato Constitutivo / Contrato Social' },
  });
  const tipoFalencia = await prisma.tipoDocumento.findUnique({
    where: { nome: 'Certidão Negativa de Falência e Recuperação Judicial' },
  });
  const tipoDecIdoneidade = await prisma.tipoDocumento.findUnique({
    where: { nome: 'Declaração de Idoneidade' },
  });
  const tipoDecMenor = await prisma.tipoDocumento.findUnique({
    where: { nome: 'Declaração de Não Empregar Menor' },
  });

  // Documentos do Fleming — sem data (aguardando emissão)
  const documentosFleming = [
    tipoLicencaVigilancia,
    tipoCNES,
    tipoCNDT,
    tipoCRF,
    tipoPGFN,
    tipoAlvara,
    tipoContratoSocial,
    tipoFalencia,
    tipoDecIdoneidade,
    tipoDecMenor,
  ].filter(Boolean);

  const docsFlemingCriados: string[] = [];

  for (const tipo of documentosFleming) {
    if (!tipo) continue;

    // Verifica se já existe documento deste tipo para o Fleming
    const jaExiste = await prisma.documento.findFirst({
      where: {
        unidadeId: fleming.id,
        tipoDocumentoId: tipo.id,
      },
    });

    if (!jaExiste) {
      const doc = await prisma.documento.create({
        data: {
          unidadeId: fleming.id,
          tipoDocumentoId: tipo.id,
          status: 'SEM_DATA',
          observacoes: 'Criado via seed — aguardando emissão',
        },
      });
      docsFlemingCriados.push(doc.id);

      // Vincula ao contrato do Fleming
      await prisma.documentoContrato.create({
        data: {
          documentoId: doc.id,
          contratoId: contratoFleming.id,
          satisfaz: false,
        },
      });
    }
  }

  console.log(`✅ ${docsFlemingCriados.length} documentos criados para o Fleming`);

  // -------------------------
  // DOCUMENTOS INICIAIS — PROVIDA
  // -------------------------
  console.log('📎 Criando documentos iniciais da Clínica Provida...');

  const tipoLicencaAnvisa = await prisma.tipoDocumento.findUnique({
    where: { nome: 'Licença de Funcionamento ANVISA' },
  });
  const tipoAVCB = await prisma.tipoDocumento.findUnique({
    where: { nome: 'AVCB – Auto de Vistoria do Corpo de Bombeiros' },
  });

  const documentosProvida = [
    tipoLicencaVigilancia,
    tipoLicencaAnvisa,
    tipoCNES,
    tipoCNDT,
    tipoCRF,
    tipoPGFN,
    tipoAlvara,
    tipoContratoSocial,
    tipoFalencia,
    tipoDecIdoneidade,
    tipoDecMenor,
    tipoAVCB,
  ].filter(Boolean);

  const docsProvidaCriados: string[] = [];

  for (const tipo of documentosProvida) {
    if (!tipo) continue;

    const jaExiste = await prisma.documento.findFirst({
      where: {
        unidadeId: provida.id,
        tipoDocumentoId: tipo.id,
      },
    });

    if (!jaExiste) {
      const doc = await prisma.documento.create({
        data: {
          unidadeId: provida.id,
          tipoDocumentoId: tipo.id,
          status: 'SEM_DATA',
          observacoes: 'Criado via seed — aguardando emissão',
        },
      });
      docsProvidaCriados.push(doc.id);

      // Vincula ao contrato da Provida
      await prisma.documentoContrato.create({
        data: {
          documentoId: doc.id,
          contratoId: contratoProvida.id,
          satisfaz: false,
        },
      });
    }
  }

  console.log(`✅ ${docsProvidaCriados.length} documentos criados para a Provida`);
  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });