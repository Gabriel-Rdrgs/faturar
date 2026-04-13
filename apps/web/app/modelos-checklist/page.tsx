'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

interface ModeloChecklist {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  criadoEm: string;
  contrato: { id: string; nome: string } | null;
  _count: { itens: number; checklists: number };
}

export default function ModelosChecklistPage() {
  const router = useRouter();
  const [modelos, setModelos] = useState<ModeloChecklist[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Modal criar/editar
  const [modalAberto, setModalAberto] = useState(false);
  const [modeloEditando, setModeloEditando] = useState<ModeloChecklist | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({ nome: '', descricao: '', ativo: true });

  // Modal excluir
  const [modeloExcluindo, setModeloExcluindo] = useState<ModeloChecklist | null>(null);
  const [confirmacaoNome, setConfirmacaoNome] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState('');

  function carregarModelos() {
    setCarregando(true);
    api
      .get('/modelos-checklist')
      .then((res) => setModelos(Array.isArray(res.data) ? res.data : []))
      .catch(() => setModelos([]))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregarModelos();
  }, []);

  function abrirModalCriar() {
    setModeloEditando(null);
    setForm({ nome: '', descricao: '', ativo: true });
    setErro('');
    setModalAberto(true);
  }

  function abrirModalEditar(modelo: ModeloChecklist) {
    setModeloEditando(modelo);
    setForm({
      nome: modelo.nome,
      descricao: modelo.descricao ?? '',
      ativo: modelo.ativo,
    });
    setErro('');
    setModalAberto(true);
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      const dados = {
        nome: form.nome,
        descricao: form.descricao || null,
        ativo: form.ativo,
      };
      if (modeloEditando) {
        await api.put(`/modelos-checklist/${modeloEditando.id}`, dados);
      } else {
        await api.post('/modelos-checklist', dados);
      }
      setModalAberto(false);
      carregarModelos();
    } catch (error: any) {
      setErro(error?.response?.data?.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir() {
    if (!modeloExcluindo) return;
    if (confirmacaoNome !== modeloExcluindo.nome) {
      setErroExcluir('O nome digitado não confere. Tente novamente.');
      return;
    }
    setExcluindo(true);
    setErroExcluir('');
    try {
      await api.delete(`/modelos-checklist/${modeloExcluindo.id}`);
      setModeloExcluindo(null);
      carregarModelos();
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Modelos de Checklist
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Templates reutilizáveis de documentos exigidos por edital ou processo
          </p>
        </div>
        <button
          onClick={abrirModalCriar}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Novo Modelo
        </button>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <span className="animate-spin">⏳</span> Carregando...
        </div>
      ) : modelos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum modelo de checklist cadastrado ainda.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Nome</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Itens</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Checklists gerados</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {modelos.map((modelo) => (
                <tr
                  key={modelo.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <td
                    className="px-5 py-4 cursor-pointer"
                    onClick={() => router.push(`/modelos-checklist/${modelo.id}`)}
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{modelo.nome}</p>
                    {modelo.descricao && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {modelo.descricao}
                      </p>
                    )}
                    {modelo.contrato && (
                      <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
                        📋 {modelo.contrato.nome}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                    {modelo._count.itens} {modelo._count.itens === 1 ? 'item' : 'itens'}
                  </td>
                  <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                    {modelo._count.checklists}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      modelo.ativo
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {modelo.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => router.push(`/modelos-checklist/${modelo.id}`)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        📝 Gerenciar
                      </button>
                      <button
                        onClick={() => abrirModalEditar(modelo)}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => {
                          setModeloExcluindo(modelo);
                          setConfirmacaoNome('');
                          setErroExcluir('');
                        }}
                        className="text-sm text-red-500 dark:text-red-400 hover:underline"
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Criar/Editar */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modeloEditando ? 'Editar Modelo' : 'Novo Modelo de Checklist'}
              </h2>
              <button
                onClick={() => setModalAberto(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSalvar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Ex: Edital 007/2025 – Habilitação"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                  placeholder="Descrição opcional do modelo..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="ativo" className="text-sm text-gray-700 dark:text-gray-300">
                  Modelo ativo
                </label>
              </div>
              {erro && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{erro}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition text-sm font-medium"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Excluir */}
      {modeloExcluindo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                ⚠️ Excluir Modelo
              </h2>
              <button
                onClick={() => setModeloExcluindo(null)}
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
                  Todos os itens do modelo serão removidos. Checklists já gerados
                  precisam ser excluídos antes.
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Para confirmar, digite o nome do modelo:
                  <span className="font-semibold"> {modeloExcluindo.nome}</span>
                </p>
                <input
                  type="text"
                  value={confirmacaoNome}
                  onChange={(e) => setConfirmacaoNome(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  placeholder="Digite o nome exato"
                />
              </div>
              {erroExcluir && (
                <p className="text-red-500 text-sm">{erroExcluir}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setModeloExcluindo(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExcluir}
                  disabled={excluindo || confirmacaoNome !== modeloExcluindo.nome}
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