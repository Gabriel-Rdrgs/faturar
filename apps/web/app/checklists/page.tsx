'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

interface Unidade {
  id: string;
  nome: string;
}

interface ModeloChecklist {
  id: string;
  nome: string;
}

interface ChecklistUnidade {
  id: string;
  status: string;
  criadoEm: string;
  modelo: { id: string; nome: string };
  unidade: { id: string; nome: string };
  _count: { itens: number };
}

const statusConfig: Record<string, { label: string; cor: string; icone: string }> = {
  EM_ANDAMENTO: {
    label: 'Em andamento',
    cor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    icone: '⏳',
  },
  COMPLETO: {
    label: 'Completo',
    cor: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    icone: '✅',
  },
  REPROVADO: {
    label: 'Reprovado',
    cor: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    icone: '❌',
  },
};

export default function ChecklistsPage() {
  const router = useRouter();
  const [checklists, setChecklists] = useState<ChecklistUnidade[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [modelos, setModelos] = useState<ModeloChecklist[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  // Modal gerar checklist
  const [modalGerarAberto, setModalGerarAberto] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erroGerar, setErroGerar] = useState('');
  const [formGerar, setFormGerar] = useState({ modeloId: '', unidadeId: '' });

  // Modal excluir
  const [checklistExcluindo, setChecklistExcluindo] = useState<ChecklistUnidade | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState('');

  function carregarChecklists() {
    setCarregando(true);
    const params = new URLSearchParams();
    if (filtroUnidade) params.append('unidadeId', filtroUnidade);
    if (filtroStatus) params.append('status', filtroStatus);

    api
      .get(`/checklists-unidade?${params.toString()}`)
      .then((res) => setChecklists(Array.isArray(res.data) ? res.data : []))
      .catch(() => setChecklists([]))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregarChecklists();
  }, [filtroUnidade, filtroStatus]);

  useEffect(() => {
    api.get('/unidades').then((res) => setUnidades(Array.isArray(res.data) ? res.data : []));
    api.get('/modelos-checklist').then((res) => setModelos(Array.isArray(res.data) ? res.data : []));
  }, []);

  async function handleGerar(e: React.FormEvent) {
    e.preventDefault();
    setGerando(true);
    setErroGerar('');
    try {
      const res = await api.post('/checklists-unidade/gerar', formGerar);
      setModalGerarAberto(false);
      router.push(`/checklists/${res.data.id}`);
    } catch (error: any) {
      setErroGerar(error?.response?.data?.message ?? 'Erro ao gerar checklist. Tente novamente.');
    } finally {
      setGerando(false);
    }
  }

  async function handleExcluir() {
    if (!checklistExcluindo) return;
    setExcluindo(true);
    setErroExcluir('');
    try {
      await api.delete(`/checklists-unidade/${checklistExcluindo.id}`);
      setChecklistExcluindo(null);
      carregarChecklists();
    } catch (error: any) {
      setErroExcluir(error?.response?.data?.message ?? 'Erro ao excluir. Tente novamente.');
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checklists</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Acompanhamento de habilitação e conformidade por unidade
          </p>
        </div>
        <button
          onClick={() => {
            setFormGerar({ modeloId: '', unidadeId: '' });
            setErroGerar('');
            setModalGerarAberto(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Gerar Checklist
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <select
          value={filtroUnidade}
          onChange={(e) => setFiltroUnidade(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        >
          <option value="">Todas as unidades</option>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        >
          <option value="">Todos os status</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="COMPLETO">Completo</option>
          <option value="REPROVADO">Reprovado</option>
        </select>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <span className="animate-spin">⏳</span> Carregando...
        </div>
      ) : checklists.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            Nenhum checklist gerado ainda.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Clique em "Gerar Checklist" para criar o primeiro.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Unidade</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Modelo</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Itens</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Criado em</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {checklists.map((checklist) => {
                const sc = statusConfig[checklist.status] ?? statusConfig['EM_ANDAMENTO'];
                return (
                  <tr
                    key={checklist.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td
                      className="px-5 py-4 cursor-pointer"
                      onClick={() => router.push(`/checklists/${checklist.id}`)}
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {checklist.unidade.nome}
                      </p>
                    </td>
                    <td
                      className="px-5 py-4 text-gray-700 dark:text-gray-300 cursor-pointer"
                      onClick={() => router.push(`/checklists/${checklist.id}`)}
                    >
                      {checklist.modelo.nome}
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                      {checklist._count.itens}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.cor}`}>
                        {sc.icone} {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                      {new Date(checklist.criadoEm).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => router.push(`/checklists/${checklist.id}`)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => {
                            setChecklistExcluindo(checklist);
                            setErroExcluir('');
                          }}
                          className="text-sm text-red-500 dark:text-red-400 hover:underline"
                        >
                          🗑️ Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Gerar Checklist */}
      {modalGerarAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Gerar Checklist
              </h2>
              <button
                onClick={() => setModalGerarAberto(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleGerar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Modelo <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formGerar.modeloId}
                  onChange={(e) => setFormGerar({ ...formGerar, modeloId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">Selecione um modelo</option>
                  {modelos.map((m) => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unidade <span className="text-red-500">*</span>
                </label>
                                <select
                  required
                  value={formGerar.unidadeId}
                  onChange={(e) => setFormGerar({ ...formGerar, unidadeId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">Selecione uma unidade</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  O sistema cruzará automaticamente os itens do modelo com os documentos
                  já cadastrados para a unidade no DocPrazo.
                </p>
              </div>

              {erroGerar && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{erroGerar}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalGerarAberto(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={gerando}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition text-sm font-medium"
                >
                  {gerando ? 'Gerando...' : 'Gerar Checklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Excluir */}
      {checklistExcluindo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                ⚠️ Excluir Checklist
              </h2>
              <button
                onClick={() => setChecklistExcluindo(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  Esta ação é irreversível.
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  O checklist de <strong>{checklistExcluindo.unidade.nome}</strong> para o
                  modelo <strong>{checklistExcluindo.modelo.nome}</strong> será excluído
                  permanentemente, incluindo todos os seus itens e progresso.
                </p>
              </div>
              {erroExcluir && (
                <p className="text-red-500 text-sm">{erroExcluir}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setChecklistExcluindo(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExcluir}
                  disabled={excluindo}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition text-sm font-medium"
                >
                  {excluindo ? 'Excluindo...' : 'Confirmar Exclusão'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}