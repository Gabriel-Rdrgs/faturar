'use client';

import { useEffect, useState } from 'react';
import api from '../../lib/api';
import SelectBusca from '../../components/SelectBusca';

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

interface Unidade {
  id: string;
  nome: string;
}

interface TipoDocumento {
  id: string;
  nome: string;
  categoria: string;
  validadePadraoDias: number | null;
}

interface Contrato {
  id: string;
  nome: string;
}

const statusConfig: Record<string, { label: string; cor: string; icone: string }> = {
  VALIDO: { label: 'Válido', cor: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icone: '✅' },
  ATENCAO: { label: 'Atenção', cor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', icone: '⚠️' },
  VENCIDO: { label: 'Vencido', cor: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icone: '❌' },
  SEM_DATA: { label: 'Sem data', cor: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', icone: '⏳' },
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

  // Modal novo documento
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [form, setForm] = useState({
    unidadeId: '',
    tipoDocumentoId: '',
    contratoId: '',
    dataEmissao: '',
    validadeDias: '',
    observacoes: '',
  });

  // Modal editar
  const [documentoEditando, setDocumentoEditando] = useState<Documento | null>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');
  const [formEdicao, setFormEdicao] = useState({
    dataEmissao: '',
    validadeDias: '',
    observacoes: '',
  });

  // Modal excluir
  const [documentoExcluindo, setDocumentoExcluindo] = useState<Documento | null>(null);
  const [confirmacaoNome, setConfirmacaoNome] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState('');

  function carregarDocumentos() {
    setCarregando(true);
    const params = new URLSearchParams();
    if (filtroStatus) params.append('status', filtroStatus);
    api
      .get(`/documentos?${params.toString()}`)
      .then((res) => setDocumentos(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDocumentos([]))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregarDocumentos();
  }, [filtroStatus]);

  async function abrirModal() {
    setErro('');
    setForm({ unidadeId: '', tipoDocumentoId: '', contratoId: '', dataEmissao: '', validadeDias: '', observacoes: '' });
    const [resUnidades, resTipos] = await Promise.all([
      api.get('/unidades'),
      api.get('/tipos-documento'),
    ]);
    setUnidades(Array.isArray(resUnidades.data) ? resUnidades.data : []);
    setTiposDocumento(Array.isArray(resTipos.data) ? resTipos.data : []);
    setContratos([]);
    setModalAberto(true);
  }

  async function handleUnidadeChange(unidadeId: string) {
    setForm((f) => ({ ...f, unidadeId, contratoId: '' }));
    if (unidadeId) {
      const res = await api.get(`/contratos?unidadeId=${unidadeId}`);
      setContratos(Array.isArray(res.data) ? res.data : []);
    } else {
      setContratos([]);
    }
  }

  function handleTipoDocumentoChange(tipoDocumentoId: string) {
    const tipo = tiposDocumento.find((t) => t.id === tipoDocumentoId);
    setForm((f) => ({ ...f, tipoDocumentoId, validadeDias: tipo?.validadePadraoDias?.toString() ?? '' }));
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      await api.post('/documentos', {
        unidadeId: form.unidadeId,
        tipoDocumentoId: form.tipoDocumentoId,
        contratoId: form.contratoId || null,
        dataEmissao: form.dataEmissao || null,
        validadeDias: form.validadeDias ? parseInt(form.validadeDias) : null,
        observacoes: form.observacoes || null,
      });
      setModalAberto(false);
      carregarDocumentos();
    } catch {
      setErro('Erro ao salvar. Verifique os dados e tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  function abrirModalEditar(doc: Documento, e: React.MouseEvent) {
    e.stopPropagation();
    setDocumentoEditando(doc);
    setFormEdicao({
      dataEmissao: doc.dataEmissao ? doc.dataEmissao.split('T')[0] : '',
      validadeDias: '',
      observacoes: doc.observacoes ?? '',
    });
    setErroEdicao('');
    setModalEditarAberto(true);
  }

  async function handleSalvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!documentoEditando) return;
    setSalvandoEdicao(true);
    setErroEdicao('');
    try {
      await api.put(`/documentos/${documentoEditando.id}`, {
        dataEmissao: formEdicao.dataEmissao || null,
        validadeDias: formEdicao.validadeDias ? parseInt(formEdicao.validadeDias) : null,
        observacoes: formEdicao.observacoes || null,
      });
      setModalEditarAberto(false);
      carregarDocumentos();
    } catch {
      setErroEdicao('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function handleExcluir() {
    if (!documentoExcluindo) return;
    if (confirmacaoNome !== documentoExcluindo.tipoDocumento.nome) {
      setErroExcluir('O nome digitado não confere. Tente novamente.');
      return;
    }
    setExcluindo(true);
    setErroExcluir('');
    try {
      await api.delete(`/documentos/${documentoExcluindo.id}`);
      setDocumentoExcluindo(null);
      carregarDocumentos();
    } catch {
      setErroExcluir('Erro ao excluir. Tente novamente.');
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documentos com Prazo</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Certidões, licenças e documentos com controle de vencimento
          </p>
        </div>
        <button
          onClick={abrirModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Novo Documento
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'VALIDO', 'ATENCAO', 'VENCIDO', 'SEM_DATA'].map((status) => (
          <button
            key={status}
            onClick={() => setFiltroStatus(status)}
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

      {/* Tabela */}
      {carregando ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <span className="animate-spin">⏳</span> Carregando...
        </div>
      ) : documentos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-gray-500 dark:text-gray-400">Nenhum documento encontrado.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Documento</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Unidade</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Categoria</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Emissão</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Vencimento</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Dias restantes</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((doc) => {
                const config = statusConfig[doc.status] ?? statusConfig['SEM_DATA'];
                return (
                  <tr
                    key={doc.id}
                    onClick={() => window.location.href = `/documentos/${doc.id}`}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{doc.tipoDocumento.nome}</p>
                      {doc.tipoDocumento.orgaoEmissor && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{doc.tipoDocumento.orgaoEmissor}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{doc.unidade.nome}</td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                      {categoriaLabel[doc.tipoDocumento.categoria] ?? doc.tipoDocumento.categoria}
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{formatarData(doc.dataEmissao)}</td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{formatarData(doc.dataVencimento)}</td>
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
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => abrirModalEditar(doc, e)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDocumentoExcluindo(doc);
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

      {/* Modal Novo Documento */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Novo Documento</h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">✕</button>
            </div>
            <form onSubmit={handleSalvar} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unidade <span className="text-red-500">*</span>
                </label>
                <SelectBusca opcoes={unidades.map((u) => ({ value: u.id, label: u.nome }))} valor={form.unidadeId} onChange={handleUnidadeChange} placeholder="Buscar unidade..." />
              </div>
              {contratos.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contrato / Vínculo</label>
                  <SelectBusca opcoes={[{ value: '', label: 'Nenhum (documento geral da unidade)' }, ...contratos.map((c) => ({ value: c.id, label: c.nome }))]} valor={form.contratoId} onChange={(val) => setForm({ ...form, contratoId: val })} placeholder="Selecionar contrato..." />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Documento <span className="text-red-500">*</span>
                </label>
                <SelectBusca opcoes={tiposDocumento.map((t) => ({ value: t.id, label: t.nome }))} valor={form.tipoDocumentoId} onChange={handleTipoDocumentoChange} placeholder="Buscar tipo de documento..." />
                {form.tipoDocumentoId && (() => {
                  const tipo = tiposDocumento.find((t) => t.id === form.tipoDocumentoId);
                  if (!tipo) return null;
                  return (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs space-y-1">
                      <p className="text-blue-700 dark:text-blue-300"><span className="font-medium">Categoria:</span> {tipo.categoria}</p>
                      {tipo.validadePadraoDias && <p className="text-blue-700 dark:text-blue-300"><span className="font-medium">Validade padrão:</span> {tipo.validadePadraoDias} dias</p>}
                    </div>
                  );
                })()}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Emissão</label>
                <input type="date" value={form.dataEmissao} onChange={(e) => setForm({ ...form, dataEmissao: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Validade (dias)</label>
                <input type="number" min={1} value={form.validadeDias} onChange={(e) => setForm({ ...form, validadeDias: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Ex: 90" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pré-preenchido com o padrão do tipo selecionado. Ajuste se necessário.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none" placeholder="Informações adicionais..." />
              </div>
              {erro && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"><p className="text-red-600 dark:text-red-400 text-sm">{erro}</p></div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium">Cancelar</button>
                <button type="submit" disabled={salvando || !form.unidadeId || !form.tipoDocumentoId} className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition text-sm font-medium">{salvando ? 'Salvando...' : 'Salvar Documento'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Documento */}
      {modalEditarAberto && documentoEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editar Documento</h2>
              <button onClick={() => setModalEditarAberto(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">✕</button>
            </div>
            <form onSubmit={handleSalvarEdicao} className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{documentoEditando.tipoDocumento.nome}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{documentoEditando.unidade.nome}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Emissão</label>
                <input type="date" value={formEdicao.dataEmissao} onChange={(e) => setFormEdicao({ ...formEdicao, dataEmissao: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Validade (dias)</label>
                <input type="number" min={1} value={formEdicao.validadeDias} onChange={(e) => setFormEdicao({ ...formEdicao, validadeDias: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Ex: 90" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                <textarea value={formEdicao.observacoes} onChange={(e) => setFormEdicao({ ...formEdicao, observacoes: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none" placeholder="Informações adicionais..." />
              </div>
              {erroEdicao && <p className="text-red-500 text-sm">{erroEdicao}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalEditarAberto(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium">Cancelar</button>
                <button type="submit" disabled={salvandoEdicao} className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition text-sm font-medium">{salvandoEdicao ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Excluir Documento */}
      {documentoExcluindo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">⚠️ Excluir Documento</h2>
              <button onClick={() => setDocumentoExcluindo(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">Esta ação é irreversível.</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Todos os arquivos e histórico vinculados a este documento serão excluídos.
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Para confirmar, digite o nome do documento:
                  <span className="font-semibold"> {documentoExcluindo.tipoDocumento.nome}</span>
                </p>
                <input
                  type="text"
                  value={confirmacaoNome}
                  onChange={(e) => setConfirmacaoNome(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  placeholder="Digite o nome exato do documento"
                />
              </div>
              {erroExcluir && <p className="text-red-500 text-sm">{erroExcluir}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDocumentoExcluindo(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExcluir}
                  disabled={excluindo || confirmacaoNome !== documentoExcluindo.tipoDocumento.nome}
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