'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';

interface DocumentoVinculo {
  id: string;
  emissaoMaximaDias: number | null;
  satisfaz: boolean;
  documento: {
    id: string;
    status: string;
    dataEmissao: string | null;
    dataVencimento: string | null;
    diasRestantes: number | null;
    tipoDocumento: {
      nome: string;
      categoria: string;
      orgaoEmissor: string | null;
    };
    unidade: { id: string; nome: string };
  };
}

interface Contrato {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  orgaoContratante: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  observacoes: string | null;
  unidade: { id: string; nome: string };
  documentos: DocumentoVinculo[];
}

const statusContratoConfig: Record<string, { label: string; cor: string }> = {
  EM_HABILITACAO: { label: 'Em Habilitação', cor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  ATIVO: { label: 'Ativo', cor: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  SUSPENSO: { label: 'Suspenso', cor: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  ENCERRADO: { label: 'Encerrado', cor: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
};

const statusDocConfig: Record<string, { label: string; cor: string; icone: string }> = {
  VALIDO: { label: 'Válido', cor: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icone: '✅' },
  ATENCAO: { label: 'Atenção', cor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', icone: '⚠️' },
  VENCIDO: { label: 'Vencido', cor: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icone: '❌' },
  SEM_DATA: { label: 'Sem data', cor: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', icone: '⏳' },
};

const tipoLabel: Record<string, string> = {
  EDITAL: 'Edital',
  CREDENCIAMENTO: 'Credenciamento',
  CONTRATO: 'Contrato',
  CONVENIO: 'Convênio',
  LOCACAO: 'Locação',
};

function formatarData(data: string | null): string {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR');
}

export default function ContratoDetalhePage() {
  const { id } = useParams();
  const router = useRouter();
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/contratos/${id}`)
      .then((res) => setContrato(res.data))
      .catch(() => router.push('/contratos'))
      .finally(() => setCarregando(false));
  }, [id]);

  if (carregando) {
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <span className="animate-spin">⏳</span> Carregando...
      </div>
    );
  }

  if (!contrato) return null;

  const sc = statusContratoConfig[contrato.status] ?? statusContratoConfig['ENCERRADO'];
  const vinculos = contrato.documentos ?? [];
  const totalDocs = vinculos.length;
  const validos = vinculos.filter((v) => v.documento.status === 'VALIDO').length;
  const atencao = vinculos.filter((v) => v.documento.status === 'ATENCAO').length;
  const vencidos = vinculos.filter((v) => v.documento.status === 'VENCIDO').length;
  const semData = vinculos.filter((v) => v.documento.status === 'SEM_DATA').length;
  const naoSatisfazem = vinculos.filter((v) => !v.satisfaz).length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Voltar */}
      <button
        onClick={() => router.push('/contratos')}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6 flex items-center gap-1"
      >
        ← Voltar para Contratos
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{contrato.nome}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {contrato.unidade.nome}
            {contrato.orgaoContratante ? ` · ${contrato.orgaoContratante}` : ''}
          </p>
        </div>
        <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${sc.cor}`}>
          {sc.label}
        </span>
      </div>

      {/* Dados do contrato */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Dados do Contrato
        </h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Tipo</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {tipoLabel[contrato.tipo] ?? contrato.tipo}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Início</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {formatarData(contrato.dataInicio)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Fim</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {formatarData(contrato.dataFim)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Unidade</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {contrato.unidade.nome}
            </dd>
          </div>
        </dl>
        {contrato.observacoes && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <dt className="text-xs text-gray-500 dark:text-gray-400 mb-1">Observações</dt>
            <dd className="text-sm text-gray-700 dark:text-gray-300">{contrato.observacoes}</dd>
          </div>
        )}
      </div>

      {/* Resumo de documentos */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDocs}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-800 p-4 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{validos}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">✅ Válidos</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-yellow-200 dark:border-yellow-800 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{atencao}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">⚠️ Atenção</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-4 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{vencidos + semData}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">❌ Críticos</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-800 p-4 text-center">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{naoSatisfazem}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">🚫 Não satisfazem</p>
        </div>
      </div>

      {/* Lista de documentos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Documentos Vinculados
          </h2>
          <button
            onClick={() => router.push('/documentos')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
          >
            Gerenciar Documentos
          </button>
        </div>

        {vinculos.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📄</p>
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Nenhum documento vinculado a este contrato ainda.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Acesse um documento e use a seção "Contratos" para vinculá-lo aqui.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Documento</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Unidade</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Emissão</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Vencimento</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Satisfaz</th>
              </tr>
            </thead>
            <tbody>
              {vinculos.map((vinculo) => {
                const doc = vinculo.documento;
                const config = statusDocConfig[doc.status] ?? statusDocConfig['SEM_DATA'];
                return (
                  <tr
                    key={vinculo.id}
                    onClick={() => router.push(`/documentos/${doc.id}`)}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {doc.tipoDocumento.nome}
                      </p>
                      {doc.tipoDocumento.orgaoEmissor && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {doc.tipoDocumento.orgaoEmissor}
                        </p>
                      )}
                                            {vinculo.emissaoMaximaDias && (
                        <p className="text-xs text-orange-500 dark:text-orange-400 mt-0.5">
                          Emissão máx: {vinculo.emissaoMaximaDias} dias
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                      {doc.unidade.nome}
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                      {formatarData(doc.dataEmissao)}
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                      {formatarData(doc.dataVencimento)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.cor}`}>
                        {config.icone} {config.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {vinculo.emissaoMaximaDias ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          vinculo.satisfaz
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {vinculo.satisfaz ? '✅ Sim' : '🚫 Não'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          Sem restrição
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}