import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarContratoDto } from './dto/criar-contrato.dto';

@Injectable()
export class ContratosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(unidadeId?: string) {
    return this.prisma.contrato.findMany({
      where: unidadeId ? { unidadeId } : undefined,
      include: {
        unidade: { select: { id: true, nome: true } },
        // Conta quantos documentos estão vinculados ao contrato
        _count: { select: { documentos: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.contrato.findUnique({
      where: { id },
      include: {
        unidade: { select: { id: true, nome: true } },
        // Retorna documentos vinculados via tabela intermediária
        // com todos os dados do documento e o badge satisfaz
        documentos: {
          include: {
            documento: {
              include: {
                tipoDocumento: {
                  select: {
                    id: true,
                    nome: true,
                    categoria: true,
                    limiteAtencaoDias: true,
                  },
                },
                unidade: { select: { id: true, nome: true } },
              },
            },
          },
          orderBy: { criadoEm: 'asc' },
        },
      },
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
    // Verifica se há documentos vinculados antes de excluir
    const contrato = await this.prisma.contrato.findUnique({
      where: { id },
      include: { _count: { select: { documentos: true } } },
    });

    if (!contrato) throw new NotFoundException('Contrato não encontrado');

    if (contrato._count.documentos > 0) {
      throw new BadRequestException(
        `Este contrato possui ${contrato._count.documentos} documento(s) vinculado(s). ` +
        'Desvincule os documentos antes de excluir o contrato.',
      );
    }

    return this.prisma.contrato.delete({ where: { id } });
  }
}