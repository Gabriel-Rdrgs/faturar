import { Injectable } from '@nestjs/common';
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

  private calcularStatus(dataVencimento: Date | null, limiteAtencaoDias: number = 30): string {
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

  async listar(unidadeId?: string, contratoId?: string, status?: string) {
    return this.prisma.documento.findMany({
      where: {
        ...(unidadeId && { unidadeId }),
        ...(contratoId && { contratoId }),
        ...(status && { status: status as any }),
      },
      include: {
        unidade: { select: { id: true, nome: true } },
        contrato: { select: { id: true, nome: true } },
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
        contrato: { select: { id: true, nome: true } },
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
      ? Math.ceil((dataVencimento.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const documento = await this.prisma.documento.create({
      data: {
        ...dto,
        dataEmissao: dataEmissaoDate,
        validadeDias,
        dataVencimento,
        diasRestantes,
        status: status as any,
      },
    });

    await this.alertas.verificarDocumento(documento.id);
    return documento;
  }

  async atualizar(id: string, dto: Partial<CriarDocumentoDto>) {
    const documentoAtual = await this.prisma.documento.findUnique({
      where: { id },
      include: { tipoDocumento: true },
    });

    if (!documentoAtual) throw new Error('Documento não encontrado');

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
      ? Math.ceil((dataVencimento.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const documentoAtualizado = await this.prisma.documento.update({
      where: { id },
      data: {
        ...dto,
        dataEmissao: dataEmissaoDate,
        validadeDias,
        dataVencimento,
        diasRestantes,
        status: status as any,
      },
    });

    await this.alertas.verificarDocumento(id);
    return documentoAtualizado;
  }

  async excluir(id: string) {
    return this.prisma.documento.delete({ where: { id } });
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

    const validadeDias = dto.validadeDias ?? documento?.tipoDocumento?.validadePadraoDias ?? null;
    const dataVencimento = validadeDias
      ? this.calcularVencimento(new Date(dto.dataEmissao), validadeDias)
      : null;
    const limiteAtencao = documento?.tipoDocumento?.limiteAtencaoDias ?? 30;
    const status = this.calcularStatus(dataVencimento, limiteAtencao);
    const diasRestantes = dataVencimento
      ? Math.ceil((dataVencimento.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const documentoFinal = await this.prisma.documento.update({
      where: { id: documentoId },
      data: {
        dataEmissao: new Date(dto.dataEmissao),
        validadeDias,
        dataVencimento,
        diasRestantes,
        status: status as any,
      },
      include: {
        arquivos: { orderBy: { versao: 'desc' } },
        tipoDocumento: true,
      },
    });

    await this.alertas.verificarDocumento(documentoId);
    return documentoFinal;
  }

  async excluirArquivo(documentoId: string, arquivoId: string) {
    const arquivo = await this.prisma.documentoArquivo.findUnique({
      where: { id: arquivoId },
    });

    if (!arquivo) throw new Error('Arquivo não encontrado');
    if (arquivo.documentoId !== documentoId) throw new Error('Arquivo não pertence a este documento');

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