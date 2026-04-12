import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarContratoDto } from './dto/criar-contrato.dto';

@Injectable()
export class ContratosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(unidadeId?: string) {
    return this.prisma.contrato.findMany({
      where: unidadeId ? { unidadeId } : undefined,
      include: { unidade: { select: { id: true, nome: true } } },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.contrato.findUnique({
      where: { id },
      include: { unidade: { select: { id: true, nome: true } } },
    });
  }

  async criar(dto: CriarContratoDto) {
    return this.prisma.contrato.create({
      data: {
        ...dto,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : null,
        dataFim: dto.dataFim ? new Date(dto.dataFim) : null,
      },
    });
  }

  async atualizar(id: string, dto: Partial<CriarContratoDto>) {
    return this.prisma.contrato.update({
      where: { id },
      data: {
        ...dto,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : undefined,
        dataFim: dto.dataFim ? new Date(dto.dataFim) : undefined,
      },
    });
  }
  async excluir(id: string) {
  return this.prisma.contrato.delete({ where: { id } });
  }
}