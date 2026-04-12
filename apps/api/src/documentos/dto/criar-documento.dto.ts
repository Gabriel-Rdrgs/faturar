export class CriarDocumentoDto {
  unidadeId: string;
  tipoDocumentoId: string;
  contratoId?: string;
  dataEmissao?: Date;
  validadeDias?: number;
  observacoes?: string;
  criadoPorId?: string;
}