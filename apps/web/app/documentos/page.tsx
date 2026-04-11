'use client';

import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface Documento {
  id: string;
  status: string;
  dataEmissao: string | null;
  dataVencimento: string | null;
  diasRestantes: number | null;
  observacoes: string | null;
  tipoDocumento: {
    nome: string;
    categoria: string;
    orgaoEmissor: string | null;
  };
  unidade: {
    id: string;
    nome: string;
  };
  contrato: {
    id: string;
    nome: string;
  } | null;
}

const statusConfig: Record<string, { label: string; cor: string; icone: string }> = {
  VALIDO: {
    label: 'Válido',
    cor: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    icone: '✅',
  },
  ATENCAO: {
    label: 'Atenção',
    cor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    icone: '⚠️',
  },
  VENCIDO: {
    label: 'Vencido',
    cor: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    icone: '❌',
  },
  SEM_DATA: {
    label: 'Sem data',
    cor: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    icone: '⏳',
  },
};

const categoriaLabel: Record<string, string> = {
  FISCAL: 'Fiscal',
  TRABALHISTA: 'Trabalhista',
  TECNICA: 'Técnica',
  SANITARIA: 'Sanitária',
  JURIDICA: 'Jurídica',
  DECLARACAO: 'Declaração',
  OUTROS: 'Outros',
};

function formatarData(data: string | null): string {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR');
}

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (filtroStatus) params.append('status', filtroStatus);

    api
      .get(`/documentos?${params.toString()}`)
      .then((res) => setDocumentos(res.data))
      .finally(() => setCarregando(false));
  }, [filtroStatus]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Documentos com Prazo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Certidões, licenças e documentos com controle de vencimento
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          + Novo Documento
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'VALIDO', 'ATENCAO', 'VENCIDO', 'SEM_DATA'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setCarregando(true);
              setFiltroStatus(status);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filtroStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400'
            }`}
          >
            {status === '' && 'Todos'}
            {status === 'VALIDO' && '✅ Válidos'}
            {status === 'ATENCAO' && '⚠️ Atenção'}
            {status === 'VENCIDO' && '❌ Vencidos'}
            {status === 'SEM_DATA' && '⏳ Sem data'}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {carregando ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <span className="animate-spin">⏳</span> Carregando...
        </div>
      ) : documentos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum documento encontrado.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">
                  Documento
                </th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">
                  Unidade
                </th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">
                  Categoria
                </th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">
                  Emissão
                </th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">
                  Vencimento
                </th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">
                  Dias restantes
                </th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((doc) => {
                const config = statusConfig[doc.status] ?? statusConfig['SEM_DATA'];
                return (
                  <tr
                    key={doc.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
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
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                      {doc.unidade.nome}
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                      {categoriaLabel[doc.tipoDocumento.categoria] ?? doc.tipoDocumento.categoria}
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                      {formatarData(doc.dataEmissao)}
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                      {formatarData(doc.dataVencimento)}
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                      {doc.diasRestantes !== null ? (
                        <span className={doc.diasRestantes <= 30 ? 'font-semibold text-yellow-600 dark:text-yellow-400' : ''}>
                          {doc.diasRestantes} dias
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.cor}`}>
                        {config.icone} {config.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}