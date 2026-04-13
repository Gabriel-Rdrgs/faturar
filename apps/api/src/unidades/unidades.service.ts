import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarUnidadeDto } from './dto/criar-unidade.dto';

@Injectable()
export class UnidadesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.unidade.findMany({
      orderBy: { nome: 'asc' },
      include: {
        _count: {
          select: {
            contratos: true,
            documentos: true,
            usuarios: true,
          },
        },
      },
    });
  }

  async buscarPorId(id: string) {
    const unidade = await this.prisma.unidade.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contratos: true,
            documentos: true,
            usuarios: true,
          },
        },
      },
    });

    if (!unidade) throw new NotFoundException('Unidade não encontrada');
    return unidade;
  }

  async criar(dto: CriarUnidadeDto) {
    return this.prisma.unidade.create({ data: dto });
  }

  async atualizar(id: string, dto: Partial<CriarUnidadeDto>) {
    const unidade = await this.prisma.unidade.findUnique({ where: { id } });
    if (!unidade) throw new NotFoundException('Unidade não encontrada');

    return this.prisma.unidade.update({ where: { id }, data: dto });
  }

  async excluir(id: string) {
    const unidade = await this.prisma.unidade.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contratos: true,
            documentos: true,
            usuarios: true,
          },
        },
      },
    });

    if (!unidade) throw new NotFoundException('Unidade não encontrada');

    if (unidade._count.contratos > 0) {
      throw new BadRequestException(
        `Esta unidade possui ${unidade._count.contratos} contrato(s) vinculado(s). ` +
        'Exclua ou desvincule os contratos antes de excluir a unidade.',
      );
    }

    if (unidade._count.documentos > 0) {
      throw new BadRequestException(
        `Esta unidade possui ${unidade._count.documentos} documento(s) vinculado(s). ` +
        'Exclua os documentos antes de excluir a unidade.',
      );
    }

    if (unidade._count.usuarios > 0) {
      throw new BadRequestException(
        `Esta unidade possui ${unidade._count.usuarios} usuário(s) vinculado(s). ` +
        'Desvincule os usuários antes de excluir a unidade.',
      );
    }

    return this.prisma.unidade.delete({ where: { id } });
  }
}