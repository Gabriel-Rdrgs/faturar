import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ItensChecklistService {
  constructor(private readonly prisma: PrismaService) {}

  async atualizar(id: string, dto: any) {
    const item = await this.prisma.itemChecklist.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item de checklist não encontrado');

    return this.prisma.itemChecklist.update({
      where: { id },
      data: {
        status: dto.status ?? item.status,
        observacao: dto.observacao !== undefined ? dto.observacao : item.observacao,
        dataEntrega: dto.dataEntrega ? new Date(dto.dataEntrega) : item.dataEntrega,
        documentoId: dto.documentoId !== undefined ? dto.documentoId : item.documentoId,
      },
      include: {
        itemModelo: { select: { nomeItem: true, bloco: true, obrigatorio: true } },
        documento: {
          select: {
            id: true,
            status: true,
            dataVencimento: true,
            tipoDocumento: { select: { nome: true } },
          },
        },
      },
    });
  }
}