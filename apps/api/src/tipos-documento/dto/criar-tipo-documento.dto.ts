export enum CategoriaDocumento {
  FISCAL = 'FISCAL',
  TRABALHISTA = 'TRABALHISTA',
  TECNICA = 'TECNICA',
  SANITARIA = 'SANITARIA',
  JURIDICA = 'JURIDICA',
  DECLARACAO = 'DECLARACAO',
  OUTROS = 'OUTROS',
}

export class CriarTipoDocumentoDto {
  nome: string;
  categoria: CategoriaDocumento;
  orgaoEmissor?: string;
  validadePadraoDias?: number;
  limiteAtencaoDias?: number;
  urlEmissao?: string;
  observacoes?: string;
}