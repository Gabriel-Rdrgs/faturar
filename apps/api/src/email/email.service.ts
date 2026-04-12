import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async enviarAlertaDocumento(params: {
    destinatarios: string[];
    nomeDocumento: string;
    nomeUnidade: string;
    status: string;
    diasRestantes: number | null;
    dataVencimento: string | null;
    linkDocumento: string;
  }) {
        this.logger.log(`API Key carregada: ${process.env.RESEND_API_KEY ? 'SIM' : 'NÃO'}`);
        this.logger.log(`API Key (primeiros 10 chars): ${process.env.RESEND_API_KEY?.substring(0, 10)}`);
    const { destinatarios, nomeDocumento, nomeUnidade, status, diasRestantes, dataVencimento, linkDocumento } = params;

    const isVencido = status === 'VENCIDO';

    const assunto = isVencido
      ? `❌ Documento VENCIDO: ${nomeDocumento} — ${nomeUnidade}`
      : `⚠️ Documento vencendo em ${diasRestantes} dias: ${nomeDocumento} — ${nomeUnidade}`;

    const corStatus = isVencido ? '#dc2626' : '#d97706';
    const textoStatus = isVencido ? 'VENCIDO' : `Vence em ${diasRestantes} dias`;
    const dataFormatada = dataVencimento
      ? new Date(dataVencimento).toLocaleDateString('pt-BR')
      : '—';

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                
                <!-- Header -->
                <tr>
                  <td style="background:#1e293b;padding:24px 32px;">
                    <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">
                      Sistema Faturar
                    </h1>
                    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">
                      Alerta de Documento
                    </p>
                  </td>
                </tr>

                <!-- Status Banner -->
                <tr>
                  <td style="background:${corStatus};padding:16px 32px;">
                    <p style="margin:0;color:#ffffff;font-size:16px;font-weight:700;">
                      ${isVencido ? '❌' : '⚠️'} ${textoStatus}
                    </p>
                  </td>
                </tr>

                <!-- Conteúdo -->
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                      O documento abaixo requer atenção imediata:
                    </p>

                    <!-- Card do documento -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Documento</p>
                          <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">${nomeDocumento}</p>
                          
                          <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Unidade</p>
                          <p style="margin:0 0 16px;color:#0f172a;font-size:14px;">${nomeUnidade}</p>

                          <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Data de Vencimento</p>
                          <p style="margin:0;color:${corStatus};font-size:14px;font-weight:700;">${dataFormatada}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:8px;background:#2563eb;">
                          <a href="${linkDocumento}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
                            Ver documento no sistema →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;">
                    <p style="margin:0;color:#94a3b8;font-size:12px;">
                      Este é um alerta automático do Sistema Faturar. Não responda este e-mail.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      await this.resend.emails.send({
        from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
        to: destinatarios,
        subject: assunto,
        html,
      });
      this.logger.log(`E-mail de alerta enviado para ${destinatarios.join(', ')}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar e-mail de alerta: ${error}`);
    }
  }
}