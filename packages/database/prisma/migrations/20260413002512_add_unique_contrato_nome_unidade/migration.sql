/*
  Warnings:

  - A unique constraint covering the columns `[nome,unidadeId]` on the table `contratos` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "contratos_nome_unidadeId_key" ON "contratos"("nome", "unidadeId");
