'use client';

import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface TipoDocumento {
  id: string;
  nome: string;
  categoria: string;
  orgaoEmissor: string | null;
  validadePadraoDias: number | null;
  limiteAtencaoDias: number | null;
  urlEmissao: string | null;
  observacoes: string | null;
}

const categoriaLabel: Record<string, string> = {
  FISCAL: 'Fiscal',
  TRABALHISTA: 'Trabalhista',
  TECNICA: 'Técnica',
  SANITARIA: 'Sanitária',
  JURIDICA: 'Jurídica',
  DECLARACAO: 'Declaração',
  OUTROS: 'Outros',
};

const categoriaColor: Record<string, string> = {
  FISCAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  TRABALHISTA: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  TECNICA: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  SANITARIA: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  JURIDICA: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  DECLARACAO: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  OUTROS: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const categorias = ['FISCAL', 'TRABALHISTA', 'TECNICA', 'SANITARIA', 'JURIDICA', 'DECLARACAO', 'OUTROS'];

export default function TiposDocumentoPage() {
  const [tipos, setTipos] = useState<TipoDocumento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busca, setBusca] = useState('');

  // Modal criar/editar
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoEditando, setTipoEditando] = useState<TipoDocumento | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    nome: '',
    categoria: 'OUTROS',
    orgaoEmissor: '',
    validadePadraoDias: '',
    limiteAtencaoDias: '',
    urlEmissao: '',
    observacoes: '',
  });

  // Modal excluir
  const [tipoExcluindo, setTipoExcluindo] = useState<TipoDocumento | null>(null);
  const [confirmacaoNome, setConfirmacaoNome] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState('');

  function carregarTipos() {
    setCarregando(true);
    const params = new URLSearchParams();
    if (filtroCategoria) params.append('categoria', filtroCategoria);
    api
      .get(`/tipos-documento?${params.toString()}`)
      .then((res) => setTipos(Array.isArray(res.data) ? res.data : []))
      .catch(() => setTipos([]))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregarTipos();
  }, [filtroCategoria]);

  const tiposFiltrados = tipos.filter((t) =>
    t.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (t.orgaoEmissor ?? '').toLowerCase().includes(busca.toLowerCase())
  );

  function abrirModalCriar() {
    setTipoEditando(null);
    setForm({
      nome: '',
      categoria: 'OUTROS',
      orgaoEmissor: '',
      validadePadraoDias: '',
      limiteAtencaoDias: '',
      urlEmissao: '',
      observacoes: '',
    });
    setErro('');
    setModalAberto(true);
  }

  function abrirModalEditar(tipo: TipoDocumento) {
    setTipoEditando(tipo);
    setForm({
      nome: tipo.nome,
      categoria: tipo.categoria,
      orgaoEmissor: tipo.orgaoEmissor ?? '',
      validadePadraoDias: tipo.validadePadraoDias?.toString() ?? '',
      limiteAtencaoDias: tipo.limiteAtencaoDias?.toString() ?? '',
      urlEmissao: tipo.urlEmissao ?? '',
      observacoes: tipo.observacoes ?? '',
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
        categoria: form.categoria,
        orgaoEmissor: form.orgaoEmissor || null,
        validadePadraoDias: form.validadePadraoDias ? parseInt(form.validadePadraoDias) : null,
        limiteAtencaoDias: form.limiteAtencaoDias ? parseInt(form.limiteAtencaoDias) : null,
        urlEmissao: form.urlEmissao || null,
        observacoes: form.observacoes || null,
      };
      if (tipoEditando) {
        await api.put(`/tipos-documento/${tipoEditando.id}`, dados);
      } else {
        await api.post('/tipos-documento', dados);
      }
      setModalAberto(false);
      carregarTipos();
    } catch {
      setErro('Erro ao salvar. Verifique os dados e tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir() {
    if (!tipoExcluindo) return;
    if (confirmacaoNome !== tipoExcluindo.nome) {
      setErroExcluir('O nome digitado não confere. Tente novamente.');
      return;
    }
    setExcluindo(true);
    setErroExcluir('');
    try {
      await api.delete(`/tipos-documento/${tipoExcluindo.id}`);
      setTipoExcluindo(null);
      carregarTipos();
    } catch {
      setErroExcluir('Erro ao excluir. Este tipo pode estar em uso por documentos cadastrados.');
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tipos de Documento</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Catálogo de tipos de documento com validade e categoria
          </p>
        </div>
        <button
          onClick={abrirModalCriar}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Novo Tipo
        </button>
      </div>

      {/* Busca e Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou órgão emissor..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
        />
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>{categoriaLabel[c]}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <span className="animate-spin">⏳</span> Carregando...
        </div>
      ) : tiposFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">🗂️</p>
          <p className="text-gray-500 dark:text-gray-400">Nenhum tipo de documento encontrado.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Nome</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Categoria</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Validade padrão</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Limiar atenção</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tiposFiltrados.map((tipo) => (
                <tr
                  key={tipo.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{tipo.nome}</p>
                    {tipo.orgaoEmissor && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tipo.orgaoEmissor}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${categoriaColor[tipo.categoria] ?? categoriaColor['OUTROS']}`}>
                      {categoriaLabel[tipo.categoria] ?? tipo.categoria}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                    {tipo.validadePadraoDias ? `${tipo.validadePadraoDias} dias` : '—'}
                  </td>
                  <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                    {tipo.limiteAtencaoDias ? `${tipo.limiteAtencaoDias} dias` : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => abrirModalEditar(tipo)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => {
                          setTipoExcluindo(tipo);
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {tipoEditando ? 'Editar Tipo de Documento' : 'Novo Tipo de Documento'}
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
                  placeholder="Ex: Certidão Conjunta PGFN/RFB"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  {categorias.map((c) => (
                    <option key={c} value={c}>{categoriaLabel[c]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Órgão Emissor
                </label>
                <input
                  type="text"
                  value={form.orgaoEmissor}
                  onChange={(e) => setForm({ ...form, orgaoEmissor: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Ex: Receita Federal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Validade padrão (dias)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.validadePadraoDias}
                    onChange={(e) => setForm({ ...form, validadePadraoDias: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="Ex: 90"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Limiar de atenção (dias)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.limiteAtencaoDias}
                    onChange={(e) => setForm({ ...form, limiteAtencaoDias: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="Ex: 30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL de Emissão
                </label>
                <input
                  type="url"
                  value={form.urlEmissao}
                  onChange={(e) => setForm({ ...form, urlEmissao: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="https://..."
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
      {tipoExcluindo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                ⚠️ Excluir Tipo de Documento
              </h2>
              <button
                onClick={() => setTipoExcluindo(null)}
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
                  Se este tipo estiver em uso por documentos cadastrados, a exclusão será bloqueada.
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Para confirmar, digite o nome exato:
                  <span className="font-semibold"> {tipoExcluindo.nome}</span>
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
                  onClick={() => setTipoExcluindo(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExcluir}
                  disabled={excluindo || confirmacaoNome !== tipoExcluindo.nome}
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