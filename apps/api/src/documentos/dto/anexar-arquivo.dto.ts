export class AnexarArquivoDto {
  arquivoUrl: string;
  dataEmissao: Date;
  validadeDias: number;
  motivoUpload?: string;
  observacoes?: string;
  usuarioId?: string;
}