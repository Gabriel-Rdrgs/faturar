'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import SelectBusca from '@/components/SelectBusca';

// ——— Tipos ———

interface TipoDocumento {
  id: string;
  nome: string;
  categoria: string;
  validadePadraoDias?: number | null;
  orgaoEmissor?: string | null;
}

interface Documento {
  id: string;
  status: 'SEM_DATA' | 'VALIDO' | 'ATENCAO' | 'VENCIDO';
  dataVencimento: string | null;
  dataEmissao: string | null;
  diasRestantes: number | null;
  observacoes: string | null;
  tipoDocumento: TipoDocumento;
  arquivos: { id: string }[];
}

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
}

interface Contrato {
  id: string;
  nome: string;
}

// ——— Helpers ———

const STATUS_LABEL: Record<string, string> = {
  SEM_DATA: 'Sem data',
  VALIDO: 'Válido',
  ATENCAO: 'A vencer',
  VENCIDO: 'Vencido',
};

const STATUS_STYLE: Record<string, string> = {
  SEM_DATA: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  VALIDO: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ATENCAO: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  VENCIDO: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_ORDEM: Record<string, number> = {
  VENCIDO: 0,
  ATENCAO: 1,
  SEM_DATA: 2,
  VALIDO: 3,
};

const CATEGORIA_LABEL: Record<string, string> = {
  FISCAL: 'Fiscal',
  TRABALHISTA: 'Trabalhista',
  TECNICA: 'Técnica',
  SANITARIA: 'Sanitária',
  JURIDICA: 'Jurídica',
  DECLARACAO: 'Declaração',
  OUTROS: 'Outros',
};

function formatarData(data: string | null) {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR');
}

function ordenarDocumentos(docs: Documento[]) {
  return [...docs].sort((a, b) => {
    const ordemA = STATUS_ORDEM[a.status] ?? 99;
    const ordemB = STATUS_ORDEM[b.status] ?? 99;
    if (ordemA !== ordemB) return ordemA - ordemB;
    if (a.dataVencimento && b.dataVencimento) {
      return new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime();
    }
    if (a.dataVencimento) return -1;
    if (b.dataVencimento) return 1;
    return 0;
  });
}

// ——— Componente ———

export default function DocumentosUnidadePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  // Modal criar
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroCriar, setErroCriar] = useState('');
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [form, setForm] = useState({
    tipoDocumentoId: '',
    contratoId: '',
    dataEmissao: '',
    validadeDias: '',
    observacoes: '',
  });

  // Modal editar
  const [docEditando, setDocEditando] = useState<Documento | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');
  const [formEdicao, setFormEdicao] = useState({
    dataEmissao: '',
    validadeDias: '',
    observacoes: '',
  });

  // Modal excluir
  const [docExcluindo, setDocExcluindo] = useState<Documento | null>(null);
  const [confirmacaoNome, setConfirmacaoNome] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState('');

  useEffect(() => {
    carregarDados();
  }, [id]);

  async function carregarDados() {
    try {
      setCarregando(true);
      const [{ data: unidadeData }, { data: docsData }] = await Promise.all([
        api.get<Unidade>(`/unidades/${id}`),
        api.get<Documento[]>(`/documentos?unidadeId=${id}`),
      ]);
      setUnidade(unidadeData);
      setDocumentos(docsData);
    } catch {
      setErro('Erro ao carregar documentos.');
    } finally {
      setCarregando(false);
    }
  }

  async function abrirModalCriar() {
    setErroCriar('');
    setForm({ tipoDocumentoId: '', contratoId: '', dataEmissao: '', validadeDias: '', observacoes: '' });
    const [resTipos, resContratos] = await Promise.all([
      api.get<TipoDocumento[]>('/tipos-documento'),
      api.get<Contrato[]>(`/contratos?unidadeId=${id}`),
    ]);
    setTiposDocumento(Array.isArray(resTipos.data) ? resTipos.data : []);
    setContratos(Array.isArray(resContratos.data) ? resContratos.data : []);
    setModalCriarAberto(true);
  }

  function handleTipoDocumentoChange(tipoDocumentoId: string) {
    const tipo = tiposDocumento.find((t) => t.id === tipoDocumentoId);
    setForm((f) => ({
      ...f,
      tipoDocumentoId,
      validadeDias: tipo?.validadePadraoDias?.toString() ?? '',
    }));
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErroCriar('');
    try {
      await api.post('/documentos', {
        unidadeId: id,
        tipoDocumentoId: form.tipoDocumentoId,
        contratoId: form.contratoId || null,
        dataEmissao: form.dataEmissao || null,
        validadeDias: form.validadeDias ? parseInt(form.validadeDias) : null,
        observacoes: form.observacoes || null,
      });
      setModalCriarAberto(false);
      carregarDados();
    } catch {
      setErroCriar('Erro ao salvar. Verifique os dados e tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  function abrirModalEditar(doc: Documento, e: React.MouseEvent) {
    e.stopPropagation();
    setDocEditando(doc);
    setFormEdicao({
      dataEmissao: doc.dataEmissao ? doc.dataEmissao.split('T')[0] : '',
      validadeDias: '',
      observacoes: doc.observacoes ?? '',
    });
    setErroEdicao('');
  }

  async function handleSalvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!docEditando) return;
    setSalvandoEdicao(true);
    setErroEdicao('');
    try {
      await api.put(`/documentos/${docEditando.id}`, {
        dataEmissao: formEdicao.dataEmissao || null,
        validadeDias: formEdicao.validadeDias ? parseInt(formEdicao.validadeDias) : null,
        observacoes: formEdicao.observacoes || null,
      });
      setDocEditando(null);
      carregarDados();
    } catch {
      setErroEdicao('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function handleExcluir() {
    if (!docExcluindo) return;
    if (confirmacaoNome !== docExcluindo.tipoDocumento.nome) {
      setErroExcluir('O nome digitado não confere.');
      return;
    }
    setExcluindo(true);
    setErroExcluir('');
    try {
      await api.delete(`/documentos/${docExcluindo.id}`);
      setDocExcluindo(null);
      carregarDados();
    } catch {
      setErroExcluir('Erro ao excluir. Tente novamente.');
    } finally {
      setExcluindo(false);
    }
  }

  // Tipos únicos para filtro
  const tiposUnicos = useMemo(() => {
    const mapa = new Map<string, string>();
    documentos.forEach((d) => mapa.set(d.tipoDocumento.id, d.tipoDocumento.nome));
    return Array.from(mapa.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [documentos]);

  // Documentos filtrados
  const documentosFiltrados = useMemo(() => {
    let resultado = [...documentos];
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      resultado = resultado.filter((d) =>
        d.tipoDocumento.nome.toLowerCase().includes(termo),
      );
    }
    if (filtroStatus) resultado = resultado.filter((d) => d.status === filtroStatus);
    if (filtroTipo) resultado = resultado.filter((d) => d.tipoDocumento.id === filtroTipo);
    if (filtroDataInicio) {
      const inicio = new Date(filtroDataInicio);
      resultado = resultado.filter(
        (d) => d.dataVencimento && new Date(d.dataVencimento) >= inicio,
      );
    }
    if (filtroDataFim) {
      const fim = new Date(filtroDataFim);
      fim.setHours(23, 59, 59);
      resultado = resultado.filter(
        (d) => d.dataVencimento && new Date(d.dataVencimento) <= fim,
      );
    }
    return ordenarDocumentos(resultado);
  }, [documentos, busca, filtroStatus, filtroTipo, filtroDataInicio, filtroDataFim]);

  function limparFiltros() {
    setBusca('');
    setFiltroStatus('');
    setFiltroTipo('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
  }

  const temFiltroAtivo = busca || filtroStatus || filtroTipo || filtroDataInicio || filtroDataFim;

  if (carregando) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Carregando documentos...</p>
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
    <div className="p-6">

      {/* Cabeçalho */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/documentos')}
          className="text-sm text-blue-500 hover:underline mb-2 flex items-center gap-1"
        >
          ← Voltar para unidades
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {unidade?.nome}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {documentosFiltrados.length} documento(s) exibido(s)
          {temFiltroAtivo && ' com filtros aplicados'}
          {' · '}
          {documentos.length} total
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="mb-3">
          <input
            type="text"
            placeholder="Buscar por nome do documento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="VALIDO">Válido</option>
            <option value="ATENCAO">A vencer</option>
            <option value="VENCIDO">Vencido</option>
            <option value="SEM_DATA">Sem data</option>
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os tipos</option>
            {tiposUnicos.map(([tipoId, tipoNome]) => (
              <option key={tipoId} value={tipoId}>{tipoNome}</option>
            ))}
          </select>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">Vencimento de</label>
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">Vencimento até</label>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {temFiltroAtivo && (
          <div className="mt-3">
            <button
              onClick={limparFiltros}
              className="text-xs text-red-500 hover:underline"
            >
              ✕ Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* Botão novo documento */}
      <div className="flex justify-end mb-3">
        <button
          onClick={abrirModalCriar}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Novo documento
        </button>
      </div>

      {/* Tabela */}
      {documentosFiltrados.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {temFiltroAtivo
            ? 'Nenhum documento encontrado com os filtros aplicados.'
            : 'Nenhum documento cadastrado para esta unidade.'}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Documento</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Vencimento</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Arquivo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {documentosFiltrados.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => router.push(`/documentos/${doc.id}`)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {doc.tipoDocumento.nome}
                    {doc.tipoDocumento.orgaoEmissor && (
                      <p className="text-xs text-gray-400 font-normal mt-0.5">
                        {doc.tipoDocumento.orgaoEmissor}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {CATEGORIA_LABEL[doc.tipoDocumento.categoria] ?? doc.tipoDocumento.categoria}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[doc.status]}`}>
                      {STATUS_LABEL[doc.status]}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {formatarData(doc.dataVencimento)}
                    {doc.diasRestantes !== null && doc.diasRestantes <= 30 && doc.diasRestantes > 0 && (
                      <p className="text-xs text-yellow-600 font-medium mt-0.5">
                        {doc.diasRestantes} dias restantes
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {(doc.arquivos ?? []).length > 0 ? (
                      <span className="text-green-600 text-xs font-medium">✓ Enviado</span>
                    ) : (
                      <span className="text-orange-500 text-xs font-medium">⚠ Sem arquivo</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={(e) => abrirModalEditar(doc, e)}
                        className="text-blue-500 hover:underline text-xs font-medium"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocExcluindo(doc);
                          setConfirmacaoNome('');
                          setErroExcluir('');
                        }}
                        className="text-red-500 hover:underline text-xs font-medium"
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

      {/* ——— Modal Criar ——— */}
      {modalCriarAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Novo Documento</h2>
                <p className="text-xs text-gray-400 mt-0.5">{unidade?.nome}</p>
              </div>
              <button onClick={() => setModalCriarAberto(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
            </div>
            <form onSubmit={handleSalvar} className="p-6 space-y-5">

              {contratos.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contrato / Vínculo
                  </label>
                  <SelectBusca
                    opcoes={[
                      { value: '', label: 'Nenhum (documento geral da unidade)' },
                      ...contratos.map((c) => ({ value: c.id, label: c.nome })),
                    ]}
                    valor={form.contratoId}
                    onChange={(val) => setForm({ ...form, contratoId: val })}
                    placeholder="Selecionar contrato..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Documento <span className="text-red-500">*</span>
                </label>
                <SelectBusca
                  opcoes={tiposDocumento.map((t) => ({ value: t.id, label: t.nome }))}
                  valor={form.tipoDocumentoId}
                  onChange={handleTipoDocumentoChange}
                  placeholder="Buscar tipo de documento..."
                />
                {form.tipoDocumentoId && (() => {
                  const tipo = tiposDocumento.find((t) => t.id === form.tipoDocumentoId);
                  if (!tipo) return null;
                  return (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs space-y-1">
                      <p className="text-blue-700 dark:text-blue-300">
                        <span className="font-medium">Categoria:</span> {CATEGORIA_LABEL[tipo.categoria] ?? tipo.categoria}
                      </p>
                      {tipo.validadePadraoDias && (
                        <p className="text-blue-700 dark:text-blue-300">
                          <span className="font-medium">Validade padrão:</span> {tipo.validadePadraoDias} dias
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Emissão
                </label>
                <input
                  type="date"
                  value={form.dataEmissao}
                  onChange={(e) => setForm({ ...form, dataEmissao: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Validade (dias)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.validadeDias}
                  onChange={(e) => setForm({ ...form, validadeDias: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 90"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Pré-preenchido com o padrão do tipo selecionado. Ajuste se necessário.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Informações adicionais..."
                />
              </div>

              {erroCriar && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{erroCriar}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCriarAberto(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando || !form.tipoDocumentoId}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
                >
                  {salvando ? 'Salvando...' : 'Salvar Documento'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ——— Modal Editar ——— */}
      {docEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editar Documento</h2>
              <button onClick={() => setDocEditando(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
            </div>
            <form onSubmit={handleSalvarEdicao} className="p-6 space-y-4">

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {docEditando.tipoDocumento.nome}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{unidade?.nome}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Emissão
                </label>
                <input
                  type="date"
                  value={formEdicao.dataEmissao}
                  onChange={(e) => setFormEdicao({ ...formEdicao, dataEmissao: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Validade (dias)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formEdicao.validadeDias}
                  onChange={(e) => setFormEdicao({ ...formEdicao, validadeDias: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 90"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  value={formEdicao.observacoes}
                  onChange={(e) => setFormEdicao({ ...formEdicao, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Informações adicionais..."
                />
              </div>

              {erroEdicao && (
                <p className="text-red-500 text-sm">{erroEdicao}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDocEditando(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEdicao}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
                >
                  {salvandoEdicao ? 'Salvando...' : 'Salvar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ——— Modal Excluir ——— */}
      {docExcluindo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                ⚠️ Excluir Documento
              </h2>
              <button onClick={() => setDocExcluindo(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
            </div>
            <div className="p-6 space-y-4">

              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  Esta ação é irreversível.
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Todos os arquivos e histórico vinculados a este documento serão excluídos.
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Para confirmar, digite o nome do documento:
                  <span className="font-semibold"> {docExcluindo.tipoDocumento.nome}</span>
                </p>
                <input
                  type="text"
                  value={confirmacaoNome}
                  onChange={(e) => setConfirmacaoNome(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Digite o nome exato do documento"
                />
              </div>

              {erroExcluir && (
                <p className="text-red-500 text-sm">{erroExcluir}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDocExcluindo(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExcluir}
                  disabled={excluindo || confirmacaoNome !== docExcluindo.tipoDocumento.nome}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium"
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