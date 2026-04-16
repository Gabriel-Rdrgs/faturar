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
    async getDocumentosResumo(unidadeId: string) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const em30dias = new Date(hoje);
      em30dias.setDate(hoje.getDate() + 30);

      const documentos = await this.prisma.documento.findMany({
        where: {
          unidadeId, // vínculo direto — correto conforme o schema
        },
        select: {
          id: true,
          status: true,
          dataVencimento: true,
          arquivos: {
            where: { ativo: true },
            select: { id: true },
            take: 1,
          },
        },
      });

      const total = documentos.length;

      const vencidos = documentos.filter(
        (d) =>
          d.status === 'VENCIDO' ||
          (d.dataVencimento && new Date(d.dataVencimento) < hoje),
      ).length;

      const aVencer = documentos.filter(
        (d) =>
          d.dataVencimento &&
          new Date(d.dataVencimento) >= hoje &&
          new Date(d.dataVencimento) <= em30dias &&
          d.status !== 'VENCIDO',
      ).length;

      const semArquivo = documentos.filter(
        (d) => d.arquivos.length === 0,
      ).length;

      const emDia = documentos.filter(
        (d) =>
          d.status === 'VALIDO' &&
          d.arquivos.length > 0 &&
          (!d.dataVencimento || new Date(d.dataVencimento) > em30dias),
      ).length;

      const percentualEmDia =
        total > 0 ? Math.round((emDia / total) * 100) : 0;

      return {
        unidadeId,
        total,
        vencidos,
        aVencer,
        semArquivo,
        emDia,
        percentualEmDia,
      };
    }
}