/*
  Warnings:

  - You are about to drop the column `contratoId` on the `documentos` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "documentos" DROP CONSTRAINT "documentos_contratoId_fkey";

-- AlterTable
ALTER TABLE "documentos" DROP COLUMN "contratoId";

-- CreateTable
CREATE TABLE "documentos_contratos" (
    "id" TEXT NOT NULL,
    "emissaoMaximaDias" INTEGER,
    "satisfaz" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "documentoId" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,

    CONSTRAINT "documentos_contratos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "documentos_contratos_documentoId_contratoId_key" ON "documentos_contratos"("documentoId", "contratoId");

-- AddForeignKey
ALTER TABLE "documentos_contratos" ADD CONSTRAINT "documentos_contratos_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_contratos" ADD CONSTRAINT "documentos_contratos_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
