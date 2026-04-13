import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChecklistsUnidadeService {
  constructor(private readonly prisma: PrismaService) {}

  private calcularStatusItem(statusDocumento: string): string {
    if (statusDocumento === 'VALIDO') return 'ENTREGUE';
    if (statusDocumento === 'ATENCAO' || statusDocumento === 'VENCIDO') return 'COM_RESSALVA';
    return 'PENDENTE';
  }

  private calcularProgresso(itens: any[]) {
    const obrigatorios = itens.filter((i) => i.itemModelo.obrigatorio);
    const entregues = obrigatorios.filter((i) => i.status === 'ENTREGUE');
    const progresso =
      obrigatorios.length > 0
        ? Math.round((entregues.length / obrigatorios.length) * 100)
        : 0;
    return {
      total: itens.length,
      obrigatorios: obrigatorios.length,
      entregues: entregues.length,
      progresso,
    };
  }

  async listar(unidadeId?: string, modeloId?: string, status?: string) {
    return this.prisma.checklistUnidade.findMany({
      where: {
        ...(unidadeId && { unidadeId }),
        ...(modeloId && { modeloId }),
        ...(status && { status }),
      },
      include: {
        modelo: { select: { id: true, nome: true } },
        unidade: { select: { id: true, nome: true } },
        _count: { select: { itens: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async buscarPorId(id: string) {
    const checklist = await this.prisma.checklistUnidade.findUnique({
      where: { id },
      include: {
        modelo: { select: { id: true, nome: true, descricao: true } },
        unidade: { select: { id: true, nome: true } },
        itens: {
          include: {
            itemModelo: {
              select: {
                id: true,
                nomeItem: true,
                descricao: true,
                bloco: true,
                obrigatorio: true,
                ordem: true,
                tipoDocumento: { select: { id: true, nome: true, categoria: true } },
              },
            },
            documento: {
              select: {
                id: true,
                status: true,
                dataVencimento: true,
                diasRestantes: true,
                tipoDocumento: { select: { nome: true } },
              },
            },
          },
          orderBy: [
            { itemModelo: { bloco: 'asc' } },
            { itemModelo: { ordem: 'asc' } },
          ],
        },
      },
    });

    if (!checklist) throw new NotFoundException('Checklist não encontrado');

    const stats = this.calcularProgresso(checklist.itens);
    return { ...checklist, ...stats };
  }

  async gerar(dto: { modeloId: string; unidadeId: string }) {
    // Verifica se já existe checklist para este modelo/unidade
    const jaExiste = await this.prisma.checklistUnidade.findUnique({
      where: {
        modeloId_unidadeId: {
          modeloId: dto.modeloId,
          unidadeId: dto.unidadeId,
        },
      },
    });

    if (jaExiste) {
      throw new BadRequestException(
        'Já existe um checklist gerado para esta unidade com este modelo. ' +
        'Use o botão "Recalcular" para atualizar.',
      );
    }

    // Busca o modelo com todos os itens
    const modelo = await this.prisma.modeloChecklist.findUnique({
      where: { id: dto.modeloId },
      include: {
        itens: {
          orderBy: [{ bloco: 'asc' }, { ordem: 'asc' }],
        },
      },
    });

    if (!modelo) throw new NotFoundException('Modelo de checklist não encontrado');

    // Verifica se a unidade existe
    const unidade = await this.prisma.unidade.findUnique({
      where: { id: dto.unidadeId },
    });

    if (!unidade) throw new NotFoundException('Unidade não encontrada');

    // Cria o checklist
    const checklist = await this.prisma.checklistUnidade.create({
      data: {
        modeloId: dto.modeloId,
        unidadeId: dto.unidadeId,
        status: 'EM_ANDAMENTO',
      },
    });

    // Para cada item do modelo, cria o item do checklist
    for (const itemModelo of modelo.itens) {
      let statusInicial = 'PENDENTE';
      let documentoId: string | null = null;

      // Cruzamento automático com DocPrazo
      if (itemModelo.tipoDocumentoId) {
        const doc = await this.prisma.documento.findFirst({
          where: {
            unidadeId: dto.unidadeId,
            tipoDocumentoId: itemModelo.tipoDocumentoId,
          },
          orderBy: { atualizadoEm: 'desc' },
        });

        if (doc) {
          documentoId = doc.id;
          statusInicial = this.calcularStatusItem(doc.status);
        }
      }

      await this.prisma.itemChecklist.create({
        data: {
          checklistUnidadeId: checklist.id,
          itemModeloId: itemModelo.id,
          documentoId,
          status: statusInicial,
        },
      });
    }

    return this.buscarPorId(checklist.id);
  }

  async recalcular(id: string) {
    const checklist = await this.prisma.checklistUnidade.findUnique({
      where: { id },
      include: {
        itens: {
          include: {
            itemModelo: true,
          },
        },
      },
    });

    if (!checklist) throw new NotFoundException('Checklist não encontrado');

    // Recalcula cada item que tem tipo de documento vinculado
    for (const item of checklist.itens) {
      if (!item.itemModelo.tipoDocumentoId) continue;

      // Só recalcula itens que não foram marcados manualmente como NAO_APLICAVEL
      if (item.status === 'NAO_APLICAVEL') continue;

      const doc = await this.prisma.documento.findFirst({
        where: {
          unidadeId: checklist.unidadeId,
          tipoDocumentoId: item.itemModelo.tipoDocumentoId,
        },
        orderBy: { atualizadoEm: 'desc' },
      });

      const novoStatus = doc ? this.calcularStatusItem(doc.status) : 'PENDENTE';
      const novoDocumentoId = doc ? doc.id : null;

      await this.prisma.itemChecklist.update({
        where: { id: item.id },
        data: {
          status: novoStatus,
          documentoId: novoDocumentoId,
        },
      });
    }

    // Recalcula status geral do checklist
    await this.recalcularStatusGeral(id);

    return this.buscarPorId(id);
  }

  async recalcularStatusGeral(checklistId: string) {
    const itens = await this.prisma.itemChecklist.findMany({
      where: { checklistUnidadeId: checklistId },
      include: { itemModelo: { select: { obrigatorio: true } } },
    });

    const obrigatorios = itens.filter((i) => i.itemModelo.obrigatorio);
    const todosConcluidos = obrigatorios.every((i) => i.status === 'ENTREGUE');

    await this.prisma.checklistUnidade.update({
      where: { id: checklistId },
      data: { status: todosConcluidos ? 'COMPLETO' : 'EM_ANDAMENTO' },
    });
  }

  // Chamado pelo DocumentosService quando um documento é atualizado
  async atualizarItensPorDocumento(documentoId: string) {
    const documento = await this.prisma.documento.findUnique({
      where: { id: documentoId },
    });

    if (!documento) return;

    const itens = await this.prisma.itemChecklist.findMany({
      where: { documentoId },
    });

    for (const item of itens) {
      if (item.status === 'NAO_APLICAVEL') continue;

      const novoStatus = this.calcularStatusItem(documento.status);

      await this.prisma.itemChecklist.update({
        where: { id: item.id },
        data: { status: novoStatus },
      });

      await this.recalcularStatusGeral(item.checklistUnidadeId);
    }
  }

  async excluir(id: string) {
    const checklist = await this.prisma.checklistUnidade.findUnique({
      where: { id },
    });

    if (!checklist) throw new NotFoundException('Checklist não encontrado');

    return this.prisma.checklistUnidade.delete({ where: { id } });
  }
}