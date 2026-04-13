import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ItensModeloChecklistService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorModelo(modeloId: string) {
    return this.prisma.itemModeloChecklist.findMany({
      where: { modeloId },
      include: {
        tipoDocumento: { select: { id: true, nome: true, categoria: true } },
      },
      orderBy: [{ bloco: 'asc' }, { ordem: 'asc' }],
    });
  }

  async criar(modeloId: string, dto: any) {
    const modelo = await this.prisma.modeloChecklist.findUnique({
      where: { id: modeloId },
    });
    if (!modelo) throw new NotFoundException('Modelo de checklist não encontrado');

    return this.prisma.itemModeloChecklist.create({
      data: {
        modeloId,
        nomeItem: dto.nomeItem,
        descricao: dto.descricao || null,
        obrigatorio: dto.obrigatorio ?? true,
        ordem: dto.ordem ?? 0,
        bloco: dto.bloco || null,
        tipoDocumentoId: dto.tipoDocumentoId || null,
      },
      include: {
        tipoDocumento: { select: { id: true, nome: true, categoria: true } },
      },
    });
  }

  async atualizar(id: string, dto: any) {
    const item = await this.prisma.itemModeloChecklist.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item não encontrado');

    return this.prisma.itemModeloChecklist.update({
      where: { id },
      data: {
        nomeItem: dto.nomeItem ?? item.nomeItem,
        descricao: dto.descricao !== undefined ? dto.descricao : item.descricao,
        obrigatorio: dto.obrigatorio ?? item.obrigatorio,
        ordem: dto.ordem ?? item.ordem,
        bloco: dto.bloco !== undefined ? dto.bloco : item.bloco,
        tipoDocumentoId:
          dto.tipoDocumentoId !== undefined ? dto.tipoDocumentoId : item.tipoDocumentoId,
      },
      include: {
        tipoDocumento: { select: { id: true, nome: true, categoria: true } },
      },
    });
  }

  async excluir(id: string) {
    const item = await this.prisma.itemModeloChecklist.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item não encontrado');

    return this.prisma.itemModeloChecklist.delete({ where: { id } });
  }
}