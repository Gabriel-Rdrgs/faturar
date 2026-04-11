'use client';

import { useEffect, useState } from 'react';
import api from '../../lib/api';

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
}

interface Unidade {
  id: string;
  nome: string;
}

const tipoLabel: Record<string, string> = {
  EDITAL: 'Edital',
  CREDENCIAMENTO: 'Credenciamento',
  CONTRATO: 'Contrato',
  CONVENIO: 'Convênio',
  LOCACAO: 'Locação',
};

const statusConfig: Record<string, { label: string; cor: string }> = {
  EM_HABILITACAO: { label: 'Em Habilitação', cor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  ATIVO: { label: 'Ativo', cor: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  SUSPENSO: { label: 'Suspenso', cor: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  ENCERRADO: { label: 'Encerrado', cor: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
};

const tipos = ['EDITAL', 'CREDENCIAMENTO', 'CONTRATO', 'CONVENIO', 'LOCACAO'];
const statuses = ['EM_HABILITACAO', 'ATIVO', 'SUSPENSO', 'ENCERRADO'];

function formatarData(data: string | null): string {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR');
}

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Modal criar/editar
  const [modalAberto, setModalAberto] = useState(false);
  const [contratoEditando, setContratoEditando] = useState<Contrato | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    nome: '',
    tipo: 'CONTRATO',
    status: 'EM_HABILITACAO',
    unidadeId: '',
    orgaoContratante: '',
    dataInicio: '',
    dataFim: '',
    observacoes: '',
  });

  // Modal excluir
  const [contratoExcluindo, setContratoExcluindo] = useState<Contrato | null>(null);
  const [confirmacaoNome, setConfirmacaoNome] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState('');

  function carregarContratos() {
    setCarregando(true);
    api
      .get('/contratos')
      .then((res) => setContratos(Array.isArray(res.data) ? res.data : []))
      .catch(() => setContratos([]))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregarContratos();
    api.get('/unidades').then((res) => setUnidades(Array.isArray(res.data) ? res.data : []));
  }, []);

  function abrirModalCriar() {
    setContratoEditando(null);
    setForm({
      nome: '',
      tipo: 'CONTRATO',
      status: 'EM_HABILITACAO',
      unidadeId: '',
      orgaoContratante: '',
      dataInicio: '',
      dataFim: '',
      observacoes: '',
    });
    setErro('');
    setModalAberto(true);
  }

  function abrirModalEditar(contrato: Contrato) {
    setContratoEditando(contrato);
    setForm({
      nome: contrato.nome,
      tipo: contrato.tipo,
      status: contrato.status,
      unidadeId: contrato.unidade.id,
      orgaoContratante: contrato.orgaoContratante ?? '',
      dataInicio: contrato.dataInicio ? contrato.dataInicio.split('T')[0] : '',
      dataFim: contrato.dataFim ? contrato.dataFim.split('T')[0] : '',
      observacoes: contrato.observacoes ?? '',
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
        tipo: form.tipo,
        status: form.status,
        unidadeId: form.unidadeId,
        orgaoContratante: form.orgaoContratante || null,
        dataInicio: form.dataInicio || null,
        dataFim: form.dataFim || null,
        observacoes: form.observacoes || null,
      };
      if (contratoEditando) {
        await api.put(`/contratos/${contratoEditando.id}`, dados);
      } else {
        await api.post('/contratos', dados);
      }
      setModalAberto(false);
      carregarContratos();
    } catch {
      setErro('Erro ao salvar. Verifique os dados e tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir() {
    if (!contratoExcluindo) return;
    if (confirmacaoNome !== contratoExcluindo.nome) {
      setErroExcluir('O nome digitado não confere. Tente novamente.');
      return;
    }
    setExcluindo(true);
    setErroExcluir('');
    try {
      await api.delete(`/contratos/${contratoExcluindo.id}`);
      setContratoExcluindo(null);
      carregarContratos();
    } catch {
      setErroExcluir('Erro ao excluir. Este contrato pode ter documentos vinculados.');
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contratos</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Editais, credenciamentos e vínculos institucionais
          </p>
        </div>
        <button
          onClick={abrirModalCriar}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Novo Contrato
        </button>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <span className="animate-spin">⏳</span> Carregando...
        </div>
      ) : contratos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 dark:text-gray-400">Nenhum contrato cadastrado ainda.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Nome</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Unidade</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Tipo</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Início</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Fim</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((contrato) => {
                const sc = statusConfig[contrato.status] ?? statusConfig['ENCERRADO'];
                return (
                  <tr
                    key={contrato.id}
                    onClick={() => window.location.href = `/contratos/${contrato.id}`}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                    >
                    <td className="px-5 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">{contrato.nome}</p>
                        {contrato.orgaoContratante && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{contrato.orgaoContratante}</p>
                        )}
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{contrato.unidade.nome}</td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{tipoLabel[contrato.tipo] ?? contrato.tipo}</td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{formatarData(contrato.dataInicio)}</td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{formatarData(contrato.dataFim)}</td>
                    <td className="px-5 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${sc.cor}`}>
                        {sc.label}
                        </span>
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => {
                            e.stopPropagation();
                            abrirModalEditar(contrato);
                            }}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            ✏️ Editar
                        </button>
                        <button
                            onClick={(e) => {
                            e.stopPropagation();
                            setContratoExcluindo(contrato);
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Criar/Editar */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {contratoEditando ? 'Editar Contrato' : 'Novo Contrato'}
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">✕</button>
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
                  placeholder="Ex: Edital 007/2025 – Fundo Municipal de Saúde"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    {tipos.map((t) => (
                      <option key={t} value={t}>{tipoLabel[t]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>{statusConfig[s].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unidade <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.unidadeId}
                  onChange={(e) => setForm({ ...form, unidadeId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">Selecione uma unidade</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Órgão Contratante
                </label>
                <input
                  type="text"
                  value={form.orgaoContratante}
                  onChange={(e) => setForm({ ...form, orgaoContratante: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Ex: Fundo Municipal de Saúde"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={form.dataInicio}
                    onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data de Fim
                  </label>
                  <input
                    type="date"
                    value={form.dataFim}
                    onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
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
      {contratoExcluindo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                ⚠️ Excluir Contrato
              </h2>
              <button
                onClick={() => setContratoExcluindo(null)}
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
                  Documentos vinculados a este contrato perderão o vínculo. O contrato não poderá ser excluído se houver documentos ativos.
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Para confirmar, digite o nome do contrato:
                  <span className="font-semibold"> {contratoExcluindo.nome}</span>
                </p>
                <input
                  type="text"
                  value={confirmacaoNome}
                  onChange={(e) => setConfirmacaoNome(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  placeholder="Digite o nome exato do contrato"
                />
              </div>
              {erroExcluir && <p className="text-red-500 text-sm">{erroExcluir}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setContratoExcluindo(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExcluir}
                  disabled={excluindo || confirmacaoNome !== contratoExcluindo.nome}
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