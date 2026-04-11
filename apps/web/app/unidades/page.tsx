'use client';

import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
  cnpj: string | null;
  ativo: boolean;
}

const tipoLabel: Record<string, string> = {
  CLINICA: 'Clínica',
  LABORATORIO: 'Laboratório',
  PREDIO: 'Prédio',
  FACULDADE: 'Faculdade',
  EMPRESA: 'Empresa',
};

const tipoIcon: Record<string, string> = {
  CLINICA: '🏥',
  LABORATORIO: '🔬',
  PREDIO: '🏗️',
  FACULDADE: '🎓',
  EMPRESA: '🏢',
};

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api
      .get('/unidades')
      .then((res) => setUnidades(res.data))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Unidades
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Empresas e entidades gerenciadas pelo sistema
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          + Nova Unidade
        </button>
      </div>

      {carregando ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <span className="animate-spin">⏳</span> Carregando...
        </div>
      ) : unidades.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">🏢</p>
          <p className="text-gray-500 dark:text-gray-400">
            Nenhuma unidade cadastrada ainda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {unidades.map((unidade) => (
            <div
              key={unidade.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {tipoIcon[unidade.tipo] ?? '🏢'}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {unidade.nome}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tipoLabel[unidade.tipo] ?? unidade.tipo}
                      {unidade.cnpj ? ` · ${unidade.cnpj}` : ''}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    unidade.ativo
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  }`}
                >
                  {unidade.ativo ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}