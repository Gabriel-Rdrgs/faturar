import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarUnidadeDto } from './dto/criar-unidade.dto';

@Injectable()
export class UnidadesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.unidade.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.unidade.findUnique({ where: { id } });
  }

  async criar(dto: CriarUnidadeDto) {
    return this.prisma.unidade.create({ data: dto });
  }

  async atualizar(id: string, dto: Partial<CriarUnidadeDto>) {
    return this.prisma.unidade.update({ where: { id }, data: dto });
  }

  async excluir(id: string) {
    return this.prisma.unidade.delete({ where: { id } });
  }
}