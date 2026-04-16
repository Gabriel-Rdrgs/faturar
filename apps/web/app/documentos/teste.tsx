'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface ResumoUnidade {
  unidadeId: string;
  total: number;
  vencidos: number;
  aVencer: number;
  semArquivo: number;
  emDia: number;
  percentualEmDia: number;
}

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
  resumo?: ResumoUnidade;
}

const TIPO_ICONE: Record<string, string> = {
  CLINICA: '🏥',
  LABORATORIO: '🔬',
  PREDIO: '🏢',
  FACULDADE: '🎓',
  EMPRESA: '💼',
};

const TIPO_LABEL: Record<string, string> = {
  CLINICA: 'Clínica',
  LABORATORIO: 'Laboratório',
  PREDIO: 'Prédio',
  FACULDADE: 'Faculdade',
  EMPRESA: 'Empresa',
};

function BarraProgresso({ percentual }: { percentual: number }) {
  const cor =
    percentual >= 80
      ? 'bg-green-500'
      : percentual >= 50
        ? 'bg-yellow-500'
        : percentual > 0
          ? 'bg-red-500'
          : 'bg-gray-300';

  return (
    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-2">
      <div
        className={`${cor} h-2 rounded-full transition-all duration-500`}
        style={{ width: `${percentual}%` }}
      />
    </div>
  );
}

function BadgeStatus({
  label,
  valor,
  cor,
}: {
  label: string;
  valor: number;
  cor: string;
}) {
  return (
    <div className={`flex flex-col items-center rounded-lg px-3 py-2 ${cor}`}>
      <span className="text-lg font-bold leading-none">{valor}</span>
      <span className="text-xs mt-0.5 leading-tight opacity-80">{label}</span>
    </div>
  );
}

function CardUnidade({
  unidade,
  onClick,
}: {
  unidade: Unidade;
  onClick: () => void;
}) {
  const resumo = unidade.resumo;
  const semDados = !resumo || resumo.total === 0;

  const borderCor = semDados
    ? 'border-gray-200 dark:border-gray-700'
    : resumo.vencidos > 0
      ? 'border-red-400'
      : resumo.aVencer > 0
        ? 'border-yellow-400'
        : 'border-green-400';

  const percentual = resumo?.percentualEmDia ?? 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left border-2 ${borderCor} rounded-2xl p-5 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3`}
    >
      {/* Topo: ícone + nome + percentual */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {TIPO_ICONE[unidade.tipo] ?? '🏛️'}
          </span>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
              {unidade.nome}
            </h2>
            <span className="text-xs text-gray-400">
              {TIPO_LABEL[unidade.tipo] ?? unidade.tipo}
            </span>
          </div>
        </div>

        {!semDados && (
          <div className="text-right shrink-0">
            <span
              className={`text-2xl font-bold ${
                percentual >= 80
                  ? 'text-green-600'
                  : percentual >= 50
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {percentual}%
            </span>
            <p className="text-xs text-gray-400">em dia</p>
          </div>
        )}
      </div>

      {/* Barra de progresso */}
      {!semDados && <BarraProgresso percentual={percentual} />}

      {/* Badges de status */}
      {semDados ? (
        <div className="flex items-center justify-center py-3">
          <p className="text-sm text-gray-400 italic">
            Nenhum documento cadastrado
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <BadgeStatus
            label="Vencidos"
            valor={resumo!.vencidos}
            cor={
              resumo!.vencidos > 0
                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-gray-50 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
            }
          />
          <BadgeStatus
            label="A vencer"
            valor={resumo!.aVencer}
            cor={
              resumo!.aVencer > 0
                ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                : 'bg-gray-50 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
            }
          />
          <BadgeStatus
            label="Total"
            valor={resumo!.total}
            cor="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          />
        </div>
      )}

      {/* Rodapé */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
        {resumo?.semArquivo ? (
          <span className="text-xs text-orange-500 font-medium">
            ⚠ {resumo.semArquivo} sem arquivo
          </span>
        ) : (
          <span />
        )}
        <span className="text-xs text-blue-500 font-medium">
          Ver documentos →
        </span>
      </div>
    </button>
  );
}

export default function DocumentosPage() {
  const router = useRouter();
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarUnidades();
  }, []);

  async function carregarUnidades() {
    try {
      setCarregando(true);
      const { data: lista } = await api.get<Unidade[]>('/unidades');

      const comResumo = await Promise.all(
        lista.map(async (u) => {
          try {
            const { data: resumo } = await api.get<ResumoUnidade>(
              `/unidades/${u.id}/documentos-resumo`,
            );
            return { ...u, resumo };
          } catch {
            return { ...u, resumo: undefined };
          }
        }),
      );

      setUnidades(comResumo);
    } catch {
      setErro('Erro ao carregar unidades.');
    } finally {
      setCarregando(false);
    }
  }

  // Resumo global consolidado
  const global = unidades.reduce(
    (acc, u) => {
      if (!u.resumo) return acc;
      return {
        total: acc.total + u.resumo.total,
        vencidos: acc.vencidos + u.resumo.vencidos,
        aVencer: acc.aVencer + u.resumo.aVencer,
        semArquivo: acc.semArquivo + u.resumo.semArquivo,
        emDia: acc.emDia + u.resumo.emDia,
      };
    },
    { total: 0, vencidos: 0, aVencer: 0, semArquivo: 0, emDia: 0 },
  );

  const percentualGlobal =
    global.total > 0 ? Math.round((global.emDia / global.total) * 100) : 0;

  // Ordenação: unidades com problema primeiro
  const unidadesOrdenadas = [...unidades].sort((a, b) => {
    const scoreA = (a.resumo?.vencidos ?? 0) * 3 + (a.resumo?.aVencer ?? 0);
    const scoreB = (b.resumo?.vencidos ?? 0) * 3 + (b.resumo?.aVencer ?? 0);
    return scoreB - scoreA;
  });

  if (carregando) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Documentos</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="p-6">
        <p className="text-red-500">{erro}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Documentos
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Selecione uma unidade para visualizar e gerenciar seus documentos.
        </p>
      </div>

      {/* Painel global */}
      {global.total > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Visão geral — todas as unidades
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>{global.total}</strong> documentos no total
                </span>
                {global.vencidos > 0 && (
                  <span className="text-red-600 font-medium">
                    ⚠ {global.vencidos} vencido(s)
                  </span>
                )}
                {global.aVencer > 0 && (
                  <span className="text-yellow-600 font-medium">
                    🕐 {global.aVencer} a vencer em 30 dias
                  </span>
                )}
                {global.semArquivo > 0 && (
                  <span className="text-orange-500 font-medium">
                    📎 {global.semArquivo} sem arquivo
                  </span>
                )}
              </div>
              <BarraProgresso percentual={percentualGlobal} />
            </div>
            <div className="text-center shrink-0">
              <p
                className={`text-4xl font-bold ${
                  percentualGlobal >= 80
                    ? 'text-green-600'
                    : percentualGlobal >= 50
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {percentualGlobal}%
              </p>
              <p className="text-xs text-gray-400 mt-0.5">regularidade geral</p>
            </div>
          </div>
        </div>
      )}

      {/* Grid de cards */}
      {unidades.length === 0 ? (
        <p className="text-gray-500">Nenhuma unidade encontrada.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {unidadesOrdenadas.map((unidade) => (
            <CardUnidade
              key={unidade.id}
              unidade={unidade}
              onClick={() =>
                router.push(`/documentos/unidade/${unidade.id}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}