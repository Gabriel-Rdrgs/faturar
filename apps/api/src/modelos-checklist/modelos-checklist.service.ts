import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModelosChecklistService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.modeloChecklist.findMany({
      include: {
        contrato: { select: { id: true, nome: true } },
        _count: { select: { itens: true, checklists: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async buscarPorId(id: string) {
    const modelo = await this.prisma.modeloChecklist.findUnique({
      where: { id },
      include: {
        contrato: { select: { id: true, nome: true } },
        itens: {
          include: {
            tipoDocumento: { select: { id: true, nome: true, categoria: true } },
          },
          orderBy: [{ bloco: 'asc' }, { ordem: 'asc' }],
        },
        _count: { select: { checklists: true } },
      },
    });

    if (!modelo) throw new NotFoundException('Modelo de checklist não encontrado');
    return modelo;
  }

  async criar(dto: any) {
    return this.prisma.modeloChecklist.create({
      data: {
        nome: dto.nome,
        descricao: dto.descricao || null,
        ativo: dto.ativo ?? true,
        contratoId: dto.contratoId || null,
      },
    });
  }

  async atualizar(id: string, dto: any) {
    const modelo = await this.prisma.modeloChecklist.findUnique({ where: { id } });
    if (!modelo) throw new NotFoundException('Modelo de checklist não encontrado');

    return this.prisma.modeloChecklist.update({
      where: { id },
      data: {
        nome: dto.nome ?? modelo.nome,
        descricao: dto.descricao !== undefined ? dto.descricao : modelo.descricao,
        ativo: dto.ativo ?? modelo.ativo,
        contratoId: dto.contratoId !== undefined ? dto.contratoId : modelo.contratoId,
      },
    });
  }

  async excluir(id: string) {
    const modelo = await this.prisma.modeloChecklist.findUnique({
      where: { id },
      include: { _count: { select: { checklists: true } } },
    });

    if (!modelo) throw new NotFoundException('Modelo de checklist não encontrado');

    if (modelo._count.checklists > 0) {
      throw new BadRequestException(
        `Este modelo possui ${modelo._count.checklists} checklist(s) gerado(s). ` +
        'Exclua os checklists antes de excluir o modelo.',
      );
    }

    return this.prisma.modeloChecklist.delete({ where: { id } });
  }
}