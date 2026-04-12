export enum TipoUnidade {
  CLINICA = 'CLINICA',
  LABORATORIO = 'LABORATORIO',
  PREDIO = 'PREDIO',
  FACULDADE = 'FACULDADE',
  EMPRESA = 'EMPRESA',
}

export class CriarUnidadeDto {
  nome: string;
  tipo: TipoUnidade;
  cnpj?: string;
  ativo?: boolean;
  observacoes?: string;
}