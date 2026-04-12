import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarTipoDocumentoDto } from './dto/criar-tipo-documento.dto';

@Injectable()
export class TiposDocumentoService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(categoria?: string) {
    return this.prisma.tipoDocumento.findMany({
      where: categoria ? { categoria: categoria as any } : undefined,
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.tipoDocumento.findUnique({ where: { id } });
  }

  async criar(dto: CriarTipoDocumentoDto) {
    return this.prisma.tipoDocumento.create({ data: dto });
  }

  async atualizar(id: string, dto: Partial<CriarTipoDocumentoDto>) {
    return this.prisma.tipoDocumento.update({ where: { id }, data: dto });
  }
  async excluir(id: string) {
  return this.prisma.tipoDocumento.delete({ where: { id } });
  }
}
