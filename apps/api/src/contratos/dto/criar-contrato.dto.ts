export enum TipoContrato {
  EDITAL = 'EDITAL',
  CREDENCIAMENTO = 'CREDENCIAMENTO',
  CONTRATO = 'CONTRATO',
  CONVENIO = 'CONVENIO',
  LOCACAO = 'LOCACAO',
}

export enum StatusContrato {
  EM_HABILITACAO = 'EM_HABILITACAO',
  ATIVO = 'ATIVO',
  SUSPENSO = 'SUSPENSO',
  ENCERRADO = 'ENCERRADO',
}

export class CriarContratoDto {
  nome: string;
  tipo: TipoContrato;
  unidadeId: string;
  orgaoContratante?: string;
  dataInicio?: Date;
  dataFim?: Date;
  status?: StatusContrato;
  observacoes?: string;
}