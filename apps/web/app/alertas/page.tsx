'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

interface Alerta {
  id: string;
  tipoAlerta: string;
  lido: boolean;
  dataLeitura: string | null;
  criadoEm: string;
  documento: {
    id: string;
    status: string;
    dataVencimento: string | null;
    diasRestantes: number | null;
    tipoDocumento: { nome: string };
    unidade: { nome: string };
  };
  destinatario: { id: string; nome: string } | null;
}

const tipoConfig: Record<string, { label: string; icone: string; cor: string }> = {
  VENCIDO: {
    label: 'Vencido',
    icone: '❌',
    cor: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
  },
  VENCIMENTO_PROXIMO: {
    label: 'Vencimento Próximo',
    icone: '⚠️',
    cor: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
  },
  RENOVADO: {
    label: 'Renovado',
    icone: '✅',
    cor: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
  },
};

function formatarDataHora(data: string): string {
  return new Date(data).toLocaleString('pt-BR');
}

function formatarData(data: string | null): string {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR');
}

export default function AlertasPage() {
  const router = useRouter();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroLido, setFiltroLido] = useState('false');
  const [marcandoTodos, setMarcandoTodos] = useState(false);

  function carregarAlertas() {
    setCarregando(true);
    const params = new URLSearchParams();
    if (filtroLido !== '') params.append('lido', filtroLido);
    api
      .get(`/alertas-documento?${params.toString()}`)
      .then((res) => setAlertas(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAlertas([]))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregarAlertas();
  }, [filtroLido]);

  async function marcarComoLido(id: string) {
    await api.patch(`/alertas-documento/${id}/marcar-como-lido`);
    carregarAlertas();
  }

  async function marcarTodosComoLido() {
    setMarcandoTodos(true);
    const naoLidos = alertas.filter((a) => !a.lido);
    await Promise.all(naoLidos.map((a) => api.patch(`/alertas-documento/${a.id}/marcar-como-lido`)));
    setMarcandoTodos(false);
    carregarAlertas();
  }

  const naoLidos = alertas.filter((a) => !a.lido).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alertas</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Notificações de vencimento e pendências de documentos
          </p>
        </div>
        {naoLidos > 0 && filtroLido === 'false' && (
          <button
            onClick={marcarTodosComoLido}
            disabled={marcandoTodos}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          >
            {marcandoTodos ? 'Marcando...' : `Marcar todos como lidos (${naoLidos})`}
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'false', label: '🔔 Não lidos' },
          { value: 'true', label: '✓ Lidos' },
          { value: '', label: 'Todos' },
        ].map((filtro) => (
          <button
            key={filtro.value}
            onClick={() => setFiltroLido(filtro.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filtroLido === filtro.value
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400'
            }`}
          >
            {filtro.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <span className="animate-spin">⏳</span> Carregando...
        </div>
      ) : alertas.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">
            {filtroLido === 'false' ? '🎉' : '🔔'}
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            {filtroLido === 'false'
              ? 'Nenhum alerta pendente. Tudo em dia!'
              : 'Nenhum alerta encontrado.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map((alerta) => {
            const config = tipoConfig[alerta.tipoAlerta] ?? tipoConfig['VENCIDO'];
            return (
              <div
                key={alerta.id}
                className={`rounded-xl border p-5 ${config.cor} ${
                  alerta.lido ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Tipo e documento */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{config.icone}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {config.label}
                      </span>
                      {!alerta.lido && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-medium">
                          Novo
                        </span>
                      )}
                    </div>

                    <p
                      className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:underline"
                      onClick={() => router.push(`/documentos/${alerta.documento.id}`)}
                    >
                      {alerta.documento.tipoDocumento.nome}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {alerta.documento.unidade.nome}
                    </p>

                    {/* Informações de vencimento */}
                    <div className="flex gap-4 mt-3">
                      {alerta.documento.dataVencimento && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Vencimento</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatarData(alerta.documento.dataVencimento)}
                          </p>
                        </div>
                      )}
                      {alerta.documento.diasRestantes !== null && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Dias restantes</p>
                          <p className={`text-sm font-medium ${
                            alerta.documento.diasRestantes <= 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {alerta.documento.diasRestantes <= 0
                              ? `${Math.abs(alerta.documento.diasRestantes)} dias atrás`
                              : `${alerta.documento.diasRestantes} dias`}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Gerado em</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {formatarDataHora(alerta.criadoEm)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => router.push(`/documentos/${alerta.documento.id}`)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 transition"
                    >
                      Ver documento
                    </button>
                    {!alerta.lido && (
                      <button
                        onClick={() => marcarComoLido(alerta.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-green-400 transition"
                      >
                        Marcar como lido
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}