-- CreateEnum
CREATE TYPE "TipoUnidade" AS ENUM ('CLINICA', 'LABORATORIO', 'PREDIO', 'FACULDADE', 'EMPRESA');

-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('ADMIN_GLOBAL', 'GESTOR_GLOBAL', 'GESTOR_UNIDADE', 'OPERACIONAL_UNIDADE');

-- CreateTable
CREATE TABLE "unidades" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoUnidade" NOT NULL,
    "cnpj" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "unidadeId" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unidades_cnpj_key" ON "unidades"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;
