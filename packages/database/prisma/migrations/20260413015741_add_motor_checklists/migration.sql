-- CreateTable
CREATE TABLE "modelos_checklist" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "contratoId" TEXT,

    CONSTRAINT "modelos_checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_modelo_checklist" (
    "id" TEXT NOT NULL,
    "nomeItem" TEXT NOT NULL,
    "descricao" TEXT,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "bloco" TEXT,
    "modeloId" TEXT NOT NULL,
    "tipoDocumentoId" TEXT,

    CONSTRAINT "itens_modelo_checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklists_unidade" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "modeloId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,

    CONSTRAINT "checklists_unidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_checklist" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "dataEntrega" TIMESTAMP(3),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "checklistUnidadeId" TEXT NOT NULL,
    "itemModeloId" TEXT NOT NULL,
    "documentoId" TEXT,

    CONSTRAINT "itens_checklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checklists_unidade_modeloId_unidadeId_key" ON "checklists_unidade"("modeloId", "unidadeId");

-- AddForeignKey
ALTER TABLE "modelos_checklist" ADD CONSTRAINT "modelos_checklist_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_modelo_checklist" ADD CONSTRAINT "itens_modelo_checklist_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos_checklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_modelo_checklist" ADD CONSTRAINT "itens_modelo_checklist_tipoDocumentoId_fkey" FOREIGN KEY ("tipoDocumentoId") REFERENCES "tipos_documento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists_unidade" ADD CONSTRAINT "checklists_unidade_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos_checklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists_unidade" ADD CONSTRAINT "checklists_unidade_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_checklist" ADD CONSTRAINT "itens_checklist_checklistUnidadeId_fkey" FOREIGN KEY ("checklistUnidadeId") REFERENCES "checklists_unidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_checklist" ADD CONSTRAINT "itens_checklist_itemModeloId_fkey" FOREIGN KEY ("itemModeloId") REFERENCES "itens_modelo_checklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_checklist" ADD CONSTRAINT "itens_checklist_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
