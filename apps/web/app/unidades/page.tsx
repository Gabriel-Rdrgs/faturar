'use client';

import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Link from 'next/link';

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
  cnpj: string | null;
  ativo: boolean;
}

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.get('/unidades')
      .then((res) => setUnidades(res.data))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              ← Voltar
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Unidades</h1>
          </div>
        </div>

        {carregando ? (
          <p className="text-gray-500">Carregando...</p>
        ) : unidades.length === 0 ? (
          <p className="text-gray-500">Nenhuma unidade cadastrada.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {unidades.map((unidade) => (
              <div
                key={unidade.id}
                className="bg-white rounded-lg shadow p-5 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {unidade.nome}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {unidade.tipo} {unidade.cnpj ? `· ${unidade.cnpj}` : ''}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      unidade.ativo
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
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
    </main>
  );
}