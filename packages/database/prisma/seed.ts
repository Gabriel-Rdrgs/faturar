import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // -------------------------
  // UNIDADES
  // -------------------------
  console.log('📦 Criando unidades...');

  const unidades = await Promise.all([
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

  console.log(`✅ ${unidades.length} unidades criadas`);

  // -------------------------
  // TIPOS DE DOCUMENTO
  // -------------------------
  console.log('📄 Criando tipos de documento...');

  const tiposDocumento = [
    // Fiscal
    {
      nome: 'Certidão Conjunta PGFN/RFB',
      orgaoEmissor: 'Receita Federal / PGFN',
      validadePadraoDias: 90,
      limiteAtencaoDias: 30,
      urlEmissao: 'https://solucoes.receita.fazenda.gov.br/Servicos/certidaointernet/PJ/Emitir',
      categoria: 'FISCAL' as const,
      observacoes: 'Certidão de débitos federais e dívida ativa da União',
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
    {
      nome: 'Certificado de Regularidade do FGTS (CRF)',
      orgaoEmissor: 'Caixa Econômica Federal',
      validadePadraoDias: 30,
      limiteAtencaoDias: 10,
      urlEmissao: 'https://consulta-crf.caixa.gov.br',
      categoria: 'FISCAL' as const,
      observacoes: null,
    },
    {
      nome: 'Certidão Negativa de Débitos Trabalhistas (CNDT)',
      orgaoEmissor: 'Tribunal Superior do Trabalho',
      validadePadraoDias: 180,
      limiteAtencaoDias: 30,
      urlEmissao: 'https://cndt-certidao.tst.jus.br',
      categoria: 'TRABALHISTA' as const,
      observacoes: null,
    },
    {
      nome: 'Certidão Negativa de Tributos Mobiliários',
      orgaoEmissor: 'Secretaria Municipal da Fazenda',
      validadePadraoDias: 60,
      limiteAtencaoDias: 20,
      urlEmissao: null,
      categoria: 'FISCAL' as const,
      observacoes: 'Solicitar na Prefeitura da sede da empresa',
    },
    {
      nome: 'Certidão Negativa de Falência e Recuperação Judicial',
      orgaoEmissor: 'Distribuidor Judicial da sede',
      validadePadraoDias: 60,
      limiteAtencaoDias: 20,
      urlEmissao: null,
      categoria: 'JURIDICA' as const,
      observacoes: 'Solicitar no Fórum/TJGO da sede',
    },
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
      nome: 'Registro/Inscrição no Conselho Regional (CRF/CRM/CRBM)',
      orgaoEmissor: 'Conselho Regional competente',
      validadePadraoDias: 365,
      limiteAtencaoDias: 60,
      urlEmissao: null,
      categoria: 'TECNICA' as const,
      observacoes: 'Verificar anuidade paga',
    },
    {
      nome: 'Certidão de Registro dos Responsáveis Técnicos',
      orgaoEmissor: 'Conselho Regional competente',
      validadePadraoDias: 365,
      limiteAtencaoDias: 60,
      urlEmissao: null,
      categoria: 'TECNICA' as const,
      observacoes: 'Por profissional responsável técnico',
    },
    {
      nome: 'Comprovante de Credenciamento SUS (CNES)',
      orgaoEmissor: 'Secretaria de Saúde',
      validadePadraoDias: 365,
      limiteAtencaoDias: 60,
      urlEmissao: 'https://cnes.datasus.gov.br',
      categoria: 'TECNICA' as const,
      observacoes: 'CONDIÇÃO BÁSICA DE PARTICIPAÇÃO no Edital 007/2025',
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
      nome: 'Ato Constitutivo / Contrato Social',
      orgaoEmissor: 'Junta Comercial / Cartório',
      validadePadraoDias: null,
      limiteAtencaoDias: null,
      urlEmissao: null,
      categoria: 'JURIDICA' as const,
      observacoes: 'Com todas as alterações ou consolidado',
    },
    {
      nome: 'Balanço Patrimonial',
      orgaoEmissor: 'Contabilidade da empresa',
      validadePadraoDias: null,
      limiteAtencaoDias: null,
      urlEmissao: null,
      categoria: 'JURIDICA' as const,
      observacoes: 'Último exercício com Termo de Abertura e Encerramento. LG, LC e SG ≥ 1,0',
    },
    {
      nome: 'Atestado de Capacidade Técnica',
      orgaoEmissor: 'Pessoa Jurídica pública ou privada',
      validadePadraoDias: null,
      limiteAtencaoDias: null,
      urlEmissao: null,
      categoria: 'TECNICA' as const,
      observacoes: 'Deve comprovar atividade compatível com o objeto do edital',
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
    {
      nome: 'AVCB – Auto de Vistoria do Corpo de Bombeiros',
      orgaoEmissor: 'Corpo de Bombeiros',
      validadePadraoDias: 365,
      limiteAtencaoDias: 60,
      urlEmissao: null,
      categoria: 'SANITARIA' as const,
      observacoes: 'Obrigatório para Edifício Solar',
    },
    {
      nome: 'Laudo Técnico de Elevadores',
      orgaoEmissor: 'Empresa especializada',
      validadePadraoDias: 365,
      limiteAtencaoDias: 60,
      urlEmissao: null,
      categoria: 'TECNICA' as const,
      observacoes: 'Inspeção anual obrigatória',
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
  ];

  let tiposCriados = 0;
  for (const tipo of tiposDocumento) {
    await prisma.tipoDocumento.upsert({
      where: { nome: tipo.nome } as any,
      update: {},
      create: tipo as any,
    });
    tiposCriados++;
  }

  console.log(`✅ ${tiposCriados} tipos de documento criados`);
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