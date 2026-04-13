'use client';

import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
  cnpj: string | null;
  ativo: boolean;
  observacoes: string | null;
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

  // Modal criar/editar
  const [modalAberto, setModalAberto] = useState(false);
  const [unidadeEditando, setUnidadeEditando] = useState<Unidade | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    nome: '',
    tipo: 'EMPRESA',
    cnpj: '',
    observacoes: '',
    ativo: true,
  });

  // Modal excluir
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [unidadeExcluindo, setUnidadeExcluindo] = useState<Unidade | null>(null);
  const [confirmacaoNome, setConfirmacaoNome] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState('');

  function carregarUnidades() {
    setCarregando(true);
    api
      .get('/unidades')
      .then((res) => {
        const dados = Array.isArray(res.data) ? res.data : [];
        setUnidades(dados);
      })
      .catch(() => setUnidades([]))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregarUnidades();
  }, []);

  function abrirModalCriar() {
    setUnidadeEditando(null);
    setForm({ nome: '', tipo: 'EMPRESA', cnpj: '', observacoes: '', ativo: true });
    setErro('');
    setModalAberto(true);
  }

  function abrirModalEditar(unidade: Unidade) {
    setUnidadeEditando(unidade);
    setForm({
      nome: unidade.nome,
      tipo: unidade.tipo,
      cnpj: unidade.cnpj ?? '',
      observacoes: unidade.observacoes ?? '',
      ativo: unidade.ativo,
    });
    setErro('');
    setModalAberto(true);
  }

  function abrirModalExcluir(unidade: Unidade) {
    setUnidadeExcluindo(unidade);
    setConfirmacaoNome('');
    setErroExcluir('');
    setModalExcluirAberto(true);
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');

    try {
      const dados = {
        ...form,
        cnpj: form.cnpj || null,
        observacoes: form.observacoes || null,
      };

      if (unidadeEditando) {
        await api.put(`/unidades/${unidadeEditando.id}`, dados);
      } else {
        await api.post('/unidades', dados);
      }

      setModalAberto(false);
      carregarUnidades();
    } catch {
      setErro('Erro ao salvar. Verifique os dados e tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

async function handleExcluir() {
  if (!unidadeExcluindo) return;

  if (confirmacaoNome !== unidadeExcluindo.nome) {
    setErroExcluir('O nome digitado não confere. Tente novamente.');
    return;
  }

  setExcluindo(true);
  setErroExcluir('');

  try {
    await api.delete(`/unidades/${unidadeExcluindo.id}`);
    setModalExcluirAberto(false);
    carregarUnidades();
  } catch (error: any) {
    setErroExcluir(
      error?.response?.data?.message ?? 'Erro ao excluir. Tente novamente.',
    );
  } finally {
    setExcluindo(false);
  }
}

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unidades</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Empresas e entidades gerenciadas pelo sistema
          </p>
        </div>
        <button
          onClick={abrirModalCriar}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Nova Unidade
        </button>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <span className="animate-spin">⏳</span> Carregando...
        </div>
      ) : unidades.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">🏢</p>
          <p className="text-gray-500 dark:text-gray-400">Nenhuma unidade cadastrada ainda.</p>
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
                  <div className="text-3xl">{tipoIcon[unidade.tipo] ?? '🏢'}</div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">{unidade.nome}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tipoLabel[unidade.tipo] ?? unidade.tipo}
                      {unidade.cnpj ? ` · ${unidade.cnpj}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  unidade.ativo
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {unidade.ativo ? 'Ativa' : 'Inativa'}
                </span>
              </div>

              {/* Ações */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => abrirModalEditar(unidade)}
                  className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => abrirModalExcluir(unidade)}
                  className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition"
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar/Editar */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {unidadeEditando ? 'Editar Unidade' : 'Nova Unidade'}
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
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Ex: Laboratório Fleming"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo *
                </label>
                <select
                  required
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="EMPRESA">Empresa</option>
                  <option value="CLINICA">Clínica</option>
                  <option value="LABORATORIO">Laboratório</option>
                  <option value="PREDIO">Prédio</option>
                  <option value="FACULDADE">Faculdade</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="00.000.000/0001-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                  placeholder="Informações adicionais..."
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
                  Unidade ativa
                </label>
              </div>

              {erro && <p className="text-red-500 text-sm">{erro}</p>}

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
      {modalExcluirAberto && unidadeExcluindo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                ⚠️ Excluir Unidade
              </h2>
              <button
                onClick={() => setModalExcluirAberto(false)}
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
                  Todos os dados vinculados a esta unidade podem ser afetados.
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Para confirmar, digite o nome da unidade:
                  <span className="font-semibold"> {unidadeExcluindo.nome}</span>
                </p>
                <input
                  type="text"
                  value={confirmacaoNome}
                  onChange={(e) => setConfirmacaoNome(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  placeholder="Digite o nome exato da unidade"
                />
              </div>

              {erroExcluir && (
                <p className="text-red-500 text-sm">{erroExcluir}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalExcluirAberto(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExcluir}
                  disabled={excluindo || confirmacaoNome !== unidadeExcluindo.nome}
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