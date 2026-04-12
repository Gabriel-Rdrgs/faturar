import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AlertasDocumentoService {
  private readonly logger = new Logger(AlertasDocumentoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async listar(unidadeId?: string, lido?: string) {
    return this.prisma.alertaDocumento.findMany({
      where: {
        ...(lido !== undefined && { lido: lido === 'true' }),
        ...(unidadeId && { documento: { unidadeId } }),
      },
      include: {
        documento: {
          include: {
            tipoDocumento: { select: { nome: true } },
            unidade: { select: { nome: true } },
          },
        },
        destinatario: { select: { id: true, nome: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async marcarComoLido(id: string) {
    return this.prisma.alertaDocumento.update({
      where: { id },
      data: { lido: true, dataLeitura: new Date() },
    });
  }

  async verificarDocumento(documentoId: string) {
    this.logger.log(`Verificando documento ${documentoId}...`);

    const documento = await this.prisma.documento.findUnique({
      where: { id: documentoId },
      include: {
        tipoDocumento: true,
        unidade: true,
      },
    });

    if (!documento) {
      this.logger.warn(`Documento ${documentoId} não encontrado`);
      return;
    }

    this.logger.log(`Status do documento: ${documento.status}`);

    if (documento.status === 'VALIDO' || documento.status === 'SEM_DATA') {
      this.logger.log(`Documento não requer alerta (status: ${documento.status})`);
      return;
    }

    const tipoAlerta = documento.status === 'VENCIDO' ? 'VENCIDO' : 'VENCIMENTO_PROXIMO';

    const alertaExistente = await this.prisma.alertaDocumento.findFirst({
      where: {
        documentoId,
        tipoAlerta,
        lido: false,
      },
    });

    if (alertaExistente) {
      this.logger.log(`Alerta ${tipoAlerta} já existe para este documento`);
      return;
    }

    const gestores = await this.prisma.usuario.findMany({
      where: {
        ativo: true,
        papel: { in: ['ADMIN_GLOBAL', 'GESTOR_GLOBAL'] as any },
      },
      select: { id: true, email: true },
    });

    this.logger.log(`Gestores encontrados: ${gestores.length}`);

    const emailPadrao = process.env.EMAIL_ALERTA_PADRAO;
    const emails = [
      ...gestores.map((g) => g.email),
      ...(emailPadrao ? [emailPadrao] : []),
    ].filter((v, i, a) => a.indexOf(v) === i);

    this.logger.log(`E-mails destinatários: ${emails.join(', ')}`);

    for (const gestor of gestores) {
      await this.prisma.alertaDocumento.create({
        data: {
          documentoId,
          tipoAlerta,
          destinatarioId: gestor.id,
        },
      });
    }

    if (gestores.length === 0) {
      await this.prisma.alertaDocumento.create({
        data: {
          documentoId,
          tipoAlerta,
        },
      });
    }

    if (emails.length > 0) {
      await this.email.enviarAlertaDocumento({
        destinatarios: emails,
        nomeDocumento: documento.tipoDocumento.nome,
        nomeUnidade: documento.unidade.nome,
        status: documento.status,
        diasRestantes: documento.diasRestantes,
        dataVencimento: documento.dataVencimento?.toISOString() ?? null,
        linkDocumento: `http://localhost:3000/documentos/${documento.id}`,
      });
    }

    this.logger.log(
      `Alerta ${tipoAlerta} criado para ${documento.tipoDocumento.nome} — ${documento.unidade.nome}`,
    );
  }

  async verificarTodos() {
    this.logger.log('Iniciando verificação automática de documentos...');

    const documentos = await this.prisma.documento.findMany({
      where: {
        status: { in: ['VENCIDO', 'ATENCAO'] as any },
      },
      select: { id: true },
    });

    for (const doc of documentos) {
      await this.verificarDocumento(doc.id);
    }

    this.logger.log(`Verificação concluída. ${documentos.length} documentos verificados.`);
  }

  @Cron('0 6 * * *')
  async jobDiario() {
    this.logger.log('Executando job diário de alertas...');
    await this.verificarTodos();
  }
}