-- CreateEnum
CREATE TYPE "TipoContrato" AS ENUM ('EDITAL', 'CREDENCIAMENTO', 'CONTRATO', 'CONVENIO', 'LOCACAO');

-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('EM_HABILITACAO', 'ATIVO', 'SUSPENSO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "CategoriaDocumento" AS ENUM ('FISCAL', 'TRABALHISTA', 'TECNICA', 'SANITARIA', 'JURIDICA', 'DECLARACAO', 'OUTROS');

-- CreateEnum
CREATE TYPE "StatusDocumento" AS ENUM ('SEM_DATA', 'VALIDO', 'ATENCAO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('VENCIMENTO_PROXIMO', 'VENCIDO', 'RENOVADO');

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoContrato" NOT NULL,
    "orgaoContratante" TEXT,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "status" "StatusContrato" NOT NULL DEFAULT 'EM_HABILITACAO',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "unidadeId" TEXT NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_documento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "orgaoEmissor" TEXT,
    "validadePadraoDias" INTEGER,
    "limiteAtencaoDias" INTEGER,
    "urlEmissao" TEXT,
    "categoria" "CategoriaDocumento" NOT NULL,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "dataEmissao" TIMESTAMP(3),
    "validadeDias" INTEGER,
    "dataVencimento" TIMESTAMP(3),
    "diasRestantes" INTEGER,
    "status" "StatusDocumento" NOT NULL DEFAULT 'SEM_DATA',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "contratoId" TEXT,
    "tipoDocumentoId" TEXT NOT NULL,
    "criadoPorId" TEXT,
    "atualizadoPorId" TEXT,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_arquivos" (
    "id" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "arquivoUrl" TEXT NOT NULL,
    "motivoUpload" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentoId" TEXT NOT NULL,
    "usuarioId" TEXT,

    CONSTRAINT "documentos_arquivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas_documentos" (
    "id" TEXT NOT NULL,
    "tipoAlerta" "TipoAlerta" NOT NULL,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "dataLeitura" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentoId" TEXT NOT NULL,
    "destinatarioId" TEXT,

    CONSTRAINT "alertas_documentos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_tipoDocumentoId_fkey" FOREIGN KEY ("tipoDocumentoId") REFERENCES "tipos_documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_arquivos" ADD CONSTRAINT "documentos_arquivos_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_arquivos" ADD CONSTRAINT "documentos_arquivos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_documentos" ADD CONSTRAINT "alertas_documentos_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_documentos" ADD CONSTRAINT "alertas_documentos_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
