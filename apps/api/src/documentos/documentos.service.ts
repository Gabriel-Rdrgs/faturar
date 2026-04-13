import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarDocumentoDto } from './dto/criar-documento.dto';
import { AnexarArquivoDto } from './dto/anexar-arquivo.dto';
import { AlertasDocumentoService } from '../alertas-documento/alertas-documento.service';

@Injectable()
export class DocumentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertas: AlertasDocumentoService,
  ) {}

  private calcularStatus(dataVencimento: Date | null, limiteAtencaoDias = 30): string {
    if (!dataVencimento) return 'SEM_DATA';
    const hoje = new Date();
    const diasRestantes = Math.ceil(
      (dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diasRestantes <= 0) return 'VENCIDO';
    if (diasRestantes <= limiteAtencaoDias) return 'ATENCAO';
    return 'VALIDO';
  }

  private calcularVencimento(dataEmissao: Date, validadeDias: number): Date {
    const vencimento = new Date(dataEmissao);
    vencimento.setDate(vencimento.getDate() + validadeDias);
    return vencimento;
  }

  // Recalcula se um DocumentoContrato satisfaz as exigências do contrato
  private calcularSatisfaz(
    dataEmissao: Date | null,
    emissaoMaximaDias: number | null,
  ): boolean {
    if (!emissaoMaximaDias) return true;
    if (!dataEmissao) return false;
    const hoje = new Date();
    const diasDesdeEmissao = Math.ceil(
      (hoje.getTime() - dataEmissao.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diasDesdeEmissao <= emissaoMaximaDias;
  }

  async listar(unidadeId?: string, contratoId?: string, status?: string) {
    return this.prisma.documento.findMany({
      where: {
        ...(unidadeId && { unidadeId }),
        // Filtro por contrato agora usa a relação N:N
        ...(contratoId && {
          contratos: { some: { contratoId } },
        }),
        ...(status && { status: status as any }),
      },
      include: {
        unidade: { select: { id: true, nome: true } },
        // Retorna os contratos vinculados com dados básicos
        contratos: {
          include: {
            contrato: { select: { id: true, nome: true } },
          },
        },
        tipoDocumento: true,
      },
      orderBy: { dataVencimento: 'asc' },
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.documento.findUnique({
      where: { id },
      include: {
        unidade: { select: { id: true, nome: true } },
        contratos: {
          include: {
            contrato: { select: { id: true, nome: true, tipo: true, status: true } },
          },
        },
        tipoDocumento: true,
        arquivos: { orderBy: { versao: 'desc' } },
        alertas: { orderBy: { criadoEm: 'desc' } },
      },
    });
  }

  async criar(dto: CriarDocumentoDto) {
    const tipoDocumento = await this.prisma.tipoDocumento.findUnique({
      where: { id: dto.tipoDocumentoId },
    });

    const dataEmissaoDate = dto.dataEmissao ? new Date(dto.dataEmissao) : null;
    const validadeDias = dto.validadeDias ?? tipoDocumento?.validadePadraoDias ?? null;
    const dataVencimento =
      dataEmissaoDate && validadeDias
        ? this.calcularVencimento(dataEmissaoDate, validadeDias)
        : null;
    const limiteAtencao = tipoDocumento?.limiteAtencaoDias ?? 30;
    const status = this.calcularStatus(dataVencimento, limiteAtencao);
    const diasRestantes = dataVencimento
      ? Math.ceil(
          (dataVencimento.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        )
      : null;

    // Extrai contratoId do dto se vier (para manter compatibilidade com o frontend atual)
    // mas não passa para o Prisma, pois o campo não existe mais no modelo Documento
    const { contratoId, ...dadosDocumento } = dto as any;

    const documento = await this.prisma.documento.create({
      data: {
        ...dadosDocumento,
        dataEmissao: dataEmissaoDate,
        validadeDias,
        dataVencimento,
        diasRestantes,
        status: status as any,
      },
    });

    // Se veio contratoId no dto, já vincula automaticamente
    if (contratoId) {
      await this.prisma.documentoContrato.create({
        data: {
          documentoId: documento.id,
          contratoId,
          satisfaz: this.calcularSatisfaz(dataEmissaoDate, null),
        },
      });
    }

    await this.alertas.verificarDocumento(documento.id);
    return documento;
  }

  async atualizar(id: string, dto: Partial<CriarDocumentoDto>) {
    const documentoAtual = await this.prisma.documento.findUnique({
      where: { id },
      include: { tipoDocumento: true },
    });

    if (!documentoAtual) throw new NotFoundException('Documento não encontrado');

    const dataEmissaoDate = dto.dataEmissao
      ? new Date(dto.dataEmissao)
      : documentoAtual.dataEmissao;

    const validadeDias =
      dto.validadeDias ??
      documentoAtual.validadeDias ??
      documentoAtual.tipoDocumento?.validadePadraoDias ??
      null;

    const dataVencimento =
      dataEmissaoDate && validadeDias
        ? this.calcularVencimento(dataEmissaoDate, validadeDias)
        : null;

    const limiteAtencao = documentoAtual.tipoDocumento?.limiteAtencaoDias ?? 30;
    const status = this.calcularStatus(dataVencimento, limiteAtencao);
    const diasRestantes = dataVencimento
      ? Math.ceil(
          (dataVencimento.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        )
      : null;

    // Remove contratoId do dto para não passar ao Prisma
    const { contratoId, ...dadosDocumento } = dto as any;

    const documentoAtualizado = await this.prisma.documento.update({
      where: { id },
      data: {
        ...dadosDocumento,
        dataEmissao: dataEmissaoDate,
        validadeDias,
        dataVencimento,
        diasRestantes,
        status: status as any,
      },
    });

    // Recalcula satisfaz em todos os vínculos deste documento
    await this.recalcularSatisfazPorDocumento(id, dataEmissaoDate);

    await this.alertas.verificarDocumento(id);
    return documentoAtualizado;
  }

  async excluir(id: string) {
    // Remove vínculos antes de excluir o documento
    await this.prisma.documentoContrato.deleteMany({ where: { documentoId: id } });
    return this.prisma.documento.delete({ where: { id } });
  }

  // Vincula um documento a um contrato
  async vincularContrato(
    documentoId: string,
    contratoId: string,
    emissaoMaximaDias?: number,
    observacoes?: string,
  ) {
    const documento = await this.prisma.documento.findUnique({
      where: { id: documentoId },
    });
    if (!documento) throw new NotFoundException('Documento não encontrado');

    const contrato = await this.prisma.contrato.findUnique({
      where: { id: contratoId },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado');

    const jaVinculado = await this.prisma.documentoContrato.findUnique({
      where: { documentoId_contratoId: { documentoId, contratoId } },
    });
    if (jaVinculado) throw new BadRequestException('Documento já está vinculado a este contrato');

    const satisfaz = this.calcularSatisfaz(
      documento.dataEmissao,
      emissaoMaximaDias ?? null,
    );

    return this.prisma.documentoContrato.create({
      data: {
        documentoId,
        contratoId,
        emissaoMaximaDias: emissaoMaximaDias ?? null,
        observacoes: observacoes ?? null,
        satisfaz,
      },
      include: {
        contrato: { select: { id: true, nome: true } },
      },
    });
  }

  // Desvincula um documento de um contrato
  async desvincularContrato(documentoId: string, contratoId: string) {
    const vinculo = await this.prisma.documentoContrato.findUnique({
      where: { documentoId_contratoId: { documentoId, contratoId } },
    });
    if (!vinculo) throw new NotFoundException('Vínculo não encontrado');

    return this.prisma.documentoContrato.delete({
      where: { documentoId_contratoId: { documentoId, contratoId } },
    });
  }

  // Lista contratos vinculados a um documento
  async listarContratos(documentoId: string) {
    return this.prisma.documentoContrato.findMany({
      where: { documentoId },
      include: {
        contrato: {
          select: { id: true, nome: true, tipo: true, status: true, orgaoContratante: true },
        },
      },
      orderBy: { criadoEm: 'asc' },
    });
  }

  // Recalcula o campo satisfaz de todos os vínculos de um documento
  private async recalcularSatisfazPorDocumento(
    documentoId: string,
    dataEmissao: Date | null,
  ) {
    const vinculos = await this.prisma.documentoContrato.findMany({
      where: { documentoId },
    });

    for (const vinculo of vinculos) {
      const satisfaz = this.calcularSatisfaz(dataEmissao, vinculo.emissaoMaximaDias);
      await this.prisma.documentoContrato.update({
        where: { id: vinculo.id },
        data: { satisfaz },
      });
    }
  }

  async anexarArquivo(documentoId: string, dto: AnexarArquivoDto) {
    const ultimoArquivo = await this.prisma.documentoArquivo.findFirst({
      where: { documentoId },
      orderBy: { versao: 'desc' },
    });

    const novaVersao = ultimoArquivo ? ultimoArquivo.versao + 1 : 1;

    if (ultimoArquivo) {
      await this.prisma.documentoArquivo.update({
        where: { id: ultimoArquivo.id },
        data: { ativo: false },
      });
    }

    await this.prisma.documentoArquivo.create({
      data: {
        documentoId,
        versao: novaVersao,
        arquivoUrl: dto.arquivoUrl,
        motivoUpload: dto.motivoUpload,
        observacoes: dto.observacoes,
        usuarioId: dto.usuarioId,
        ativo: true,
      },
    });

    const documento = await this.prisma.documento.findUnique({
      where: { id: documentoId },
      include: { tipoDocumento: true },
    });

    const validadeDias =
      dto.validadeDias ?? documento?.tipoDocumento?.validadePadraoDias ?? null;
    const dataEmissaoDate = new Date(dto.dataEmissao);
    const dataVencimento = validadeDias
      ? this.calcularVencimento(dataEmissaoDate, validadeDias)
      : null;
    const limiteAtencao = documento?.tipoDocumento?.limiteAtencaoDias ?? 30;
    const status = this.calcularStatus(dataVencimento, limiteAtencao);
    const diasRestantes = dataVencimento
      ? Math.ceil(
          (dataVencimento.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        )
      : null;

    const documentoFinal = await this.prisma.documento.update({
      where: { id: documentoId },
      data: {
        dataEmissao: dataEmissaoDate,
        validadeDias,
        dataVencimento,
        diasRestantes,
        status: status as any,
      },
      include: {
        arquivos: { orderBy: { versao: 'desc' } },
        tipoDocumento: true,
        contratos: {
          include: {
            contrato: { select: { id: true, nome: true } },
          },
        },
      },
    });

    // Recalcula satisfaz nos vínculos após novo arquivo
    await this.recalcularSatisfazPorDocumento(documentoId, dataEmissaoDate);
    await this.alertas.verificarDocumento(documentoId);

    return documentoFinal;
  }

  async excluirArquivo(documentoId: string, arquivoId: string) {
    const arquivo = await this.prisma.documentoArquivo.findUnique({
      where: { id: arquivoId },
    });

    if (!arquivo) throw new NotFoundException('Arquivo não encontrado');
    if (arquivo.documentoId !== documentoId)
      throw new BadRequestException('Arquivo não pertence a este documento');

        await this.prisma.documentoArquivo.delete({ where: { id: arquivoId } });

    if (arquivo.ativo) {
      const maisRecente = await this.prisma.documentoArquivo.findFirst({
        where: { documentoId },
        orderBy: { versao: 'desc' },
      });
      if (maisRecente) {
        await this.prisma.documentoArquivo.update({
          where: { id: maisRecente.id },
          data: { ativo: true },
        });
      }
    }

    return { sucesso: true };
  }
}