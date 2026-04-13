'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import UploadArquivo from '../../../components/UploadArquivo';
import { gerarUrlAssinada } from '../../../lib/storage';
import { createClient } from '../../../lib/supabase';

interface Arquivo {
  id: string;
  versao: number;
  arquivoUrl: string;
  motivoUpload: string | null;
  observacoes: string | null;
  ativo: boolean;
  criadoEm: string;
}

interface DocumentoVinculo {
  id: string;
  contratoId: string;
  emissaoMaximaDias: number | null;
  satisfaz: boolean;
  observacoes: string | null;
  contrato: {
    id: string;
    nome: string;
    tipo: string;
    status: string;
  };
}

interface Contrato {
  id: string;
  nome: string;
  tipo: string;
  status: string;
}

interface Documento {
  id: string;
  status: string;
  dataEmissao: string | null;
  dataVencimento: string | null;
  diasRestantes: number | null;
  validadeDias: number | null;
  observacoes: string | null;
  criadoEm: string;
  tipoDocumento: {
    nome: string;
    categoria: string;
    orgaoEmissor: string | null;
    urlEmissao: string | null;
    validadePadraoDias: number | null;
  };
  unidade: { id: string; nome: string };
  contratos: DocumentoVinculo[];
  arquivos: Arquivo[];
}

const statusConfig: Record<string, { label: string; cor: string; icone: string }> = {
  VALIDO: { label: 'Válido', cor: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icone: '✅' },
  ATENCAO: { label: 'Atenção', cor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', icone: '⚠️' },
  VENCIDO: { label: 'Vencido', cor: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icone: '❌' },
  SEM_DATA: { label: 'Sem data', cor: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', icone: '⏳' },
};

const tipoContratoLabel: Record<string, string> = {
  EDITAL: 'Edital',
  CREDENCIAMENTO: 'Credenciamento',
  CONTRATO: 'Contrato',
  CONVENIO: 'Convênio',
  LOCACAO: 'Locação',
};

function formatarData(data: string | null): string {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR');
}

function formatarDataHora(data: string): string {
  return new Date(data).toLocaleString('pt-BR');
}

export default function DocumentoDetalhePage() {
  const { id } = useParams();
  const router = useRouter();
  const [documento, setDocumento] = useState<Documento | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Modal anexo
  const [modalAnexoAberto, setModalAnexoAberto] = useState(false);
  const [salvandoAnexo, setSalvandoAnexo] = useState(false);
  const [erroAnexo, setErroAnexo] = useState('');
  const [formAnexo, setFormAnexo] = useState({
    arquivoUrl: '',
    dataEmissao: '',
    validadeDias: '',
    motivoUpload: '',
    observacoes: '',
  });

  // Modal excluir arquivo
  const [arquivoExcluindo, setArquivoExcluindo] = useState<Arquivo | null>(null);
  const [excluindoArquivo, setExcluindoArquivo] = useState(false);
  const [erroExcluirArquivo, setErroExcluirArquivo] = useState('');

  // Modal vincular contrato
  const [modalVinculoAberto, setModalVinculoAberto] = useState(false);
  const [contratosDisponiveis, setContratosDisponiveis] = useState<Contrato[]>([]);
  const [salvandoVinculo, setSalvandoVinculo] = useState(false);
  const [erroVinculo, setErroVinculo] = useState('');
  const [formVinculo, setFormVinculo] = useState({
    contratoId: '',
    emissaoMaximaDias: '',
    observacoes: '',
  });

  // Desvinculando
  const [desvinculando, setDesvinculando] = useState<string | null>(null);

  function carregarDocumento() {
    setCarregando(true);
    api
      .get(`/documentos/${id}`)
      .then((res) => setDocumento(res.data))
      .catch(() => router.push('/documentos'))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    if (id) carregarDocumento();
  }, [id]);

  function abrirModalAnexo() {
    setFormAnexo({
      arquivoUrl: '',
      dataEmissao: '',
      validadeDias: documento?.tipoDocumento.validadePadraoDias?.toString() ?? '',
      motivoUpload: '',
      observacoes: '',
    });
    setErroAnexo('');
    setModalAnexoAberto(true);
  }

  async function abrirModalVinculo() {
    setFormVinculo({ contratoId: '', emissaoMaximaDias: '', observacoes: '' });
    setErroVinculo('');

    // Carrega contratos e filtra os que já estão vinculados
    const res = await api.get('/contratos');
    const todos: Contrato[] = Array.isArray(res.data) ? res.data : [];
    const jaVinculados = documento?.contratos.map((v) => v.contratoId) ?? [];
    setContratosDisponiveis(todos.filter((c) => !jaVinculados.includes(c.id)));

    setModalVinculoAberto(true);
  }

  async function handleSalvarAnexo(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoAnexo(true);
    setErroAnexo('');
    try {
      await api.post(`/documentos/${id}/arquivos`, {
        arquivoUrl: formAnexo.arquivoUrl,
        dataEmissao: formAnexo.dataEmissao,
        validadeDias: formAnexo.validadeDias ? parseInt(formAnexo.validadeDias) : null,
        motivoUpload: formAnexo.motivoUpload || null,
        observacoes: formAnexo.observacoes || null,
      });
      setModalAnexoAberto(false);
      carregarDocumento();
    } catch {
      setErroAnexo('Erro ao salvar. Verifique os dados e tente novamente.');
    } finally {
      setSalvandoAnexo(false);
    }
  }

  async function handleSalvarVinculo(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoVinculo(true);
    setErroVinculo('');
    try {
      await api.post(`/documentos/${id}/contratos`, {
        contratoId: formVinculo.contratoId,
        emissaoMaximaDias: formVinculo.emissaoMaximaDias
          ? parseInt(formVinculo.emissaoMaximaDias)
          : undefined,
        observacoes: formVinculo.observacoes || undefined,
      });
      setModalVinculoAberto(false);
      carregarDocumento();
    } catch (error: any) {
      setErroVinculo(
        error?.response?.data?.message ?? 'Erro ao vincular. Tente novamente.',
      );
    } finally {
      setSalvandoVinculo(false);
    }
  }

  async function handleDesvincular(contratoId: string) {
    setDesvinculando(contratoId);
    try {
      await api.delete(`/documentos/${id}/contratos/${contratoId}`);
      carregarDocumento();
    } catch {
      alert('Erro ao desvincular. Tente novamente.');
    } finally {
      setDesvinculando(null);
    }
  }

  async function handleExcluirArquivo() {
    if (!arquivoExcluindo) return;
    setExcluindoArquivo(true);
    setErroExcluirArquivo('');
    try {
      const supabase = createClient();
      await supabase.storage.from('documentos').remove([arquivoExcluindo.arquivoUrl]);
      await api.delete(`/documentos/${id}/arquivos/${arquivoExcluindo.id}`);
      setArquivoExcluindo(null);
      carregarDocumento();
    } catch {
      setErroExcluirArquivo('Erro ao excluir. Tente novamente.');
    } finally {
      setExcluindoArquivo(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <span className="animate-spin">⏳</span> Carregando...
      </div>
    );
  }

  if (!documento) return null;

  const config = statusConfig[documento.status] ?? statusConfig['SEM_DATA'];
  const arquivoAtual = documento.arquivos.find((a) => a.ativo);

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.push('/documentos')}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6 flex items-center gap-1"
      >
        ← Voltar para Documentos
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {documento.tipoDocumento.nome}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {documento.unidade.nome}
            {documento.contratos.length > 0
              ? ` · ${documento.contratos.length} contrato(s) vinculado(s)`
              : ''}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${config.cor}`}>
          {config.icone} {config.label}
        </span>
      </div>

      {/* Dados + Arquivo atual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Dados do Documento
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Categoria</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {documento.tipoDocumento.categoria}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Órgão Emissor</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {documento.tipoDocumento.orgaoEmissor ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Data de Emissão</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {formatarData(documento.dataEmissao)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Validade</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {documento.validadeDias ? `${documento.validadeDias} dias` : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Data de Vencimento</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {formatarData(documento.dataVencimento)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Dias Restantes</dt>
              <dd className={`text-sm font-medium ${
                documento.diasRestantes !== null && documento.diasRestantes <= 30
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {documento.diasRestantes !== null ? `${documento.diasRestantes} dias` : '—'}
              </dd>
            </div>
            {documento.observacoes && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <dt className="text-sm text-gray-500 dark:text-gray-400 mb-1">Observações</dt>
                <dd className="text-sm text-gray-700 dark:text-gray-300">{documento.observacoes}</dd>
              </div>
            )}
          </dl>
                    {documento.tipoDocumento.urlEmissao && (
            <a
              href={documento.tipoDocumento.urlEmissao}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              🌐 Emitir online
            </a>
          )}
        </div>

        {/* Arquivo atual */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Arquivo Atual
          </h2>
          {arquivoAtual ? (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Versão {arquivoAtual.versao}</p>
              <button
                onClick={async () => {
                  try {
                    const url = await gerarUrlAssinada(arquivoAtual.arquivoUrl);
                    window.open(url, '_blank');
                  } catch {
                    alert('Erro ao abrir arquivo. Tente novamente.');
                  }
                }}
                className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                📎 Abrir arquivo
              </button>
              <button
                onClick={() => {
                  setArquivoExcluindo(arquivoAtual);
                  setErroExcluirArquivo('');
                }}
                className="block text-sm text-red-500 dark:text-red-400 hover:underline"
              >
                🗑️ Excluir
              </button>
              <p className="text-xs text-gray-400">{formatarDataHora(arquivoAtual.criadoEm)}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhum arquivo anexado ainda.
            </p>
          )}
          <button
            onClick={abrirModalAnexo}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            📎 Anexar novo arquivo
          </button>
        </div>
      </div>

      {/* Contratos Vinculados */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Contratos Vinculados
          </h2>
          <button
            onClick={abrirModalVinculo}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
          >
            + Vincular a Contrato
          </button>
        </div>

        {documento.contratos.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Este documento ainda não está vinculado a nenhum contrato.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {documento.contratos.map((vinculo) => (
              <div key={vinculo.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {vinculo.contrato.nome}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {tipoContratoLabel[vinculo.contrato.tipo] ?? vinculo.contrato.tipo}
                  </p>
                  {vinculo.emissaoMaximaDias && (
                    <p className="text-xs text-orange-500 dark:text-orange-400 mt-0.5">
                      Emissão máx: {vinculo.emissaoMaximaDias} dias
                    </p>
                  )}
                  {vinculo.observacoes && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">
                      {vinculo.observacoes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {vinculo.emissaoMaximaDias ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      vinculo.satisfaz
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {vinculo.satisfaz ? '✅ Satisfaz' : '🚫 Não satisfaz'}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Sem restrição
                    </span>
                  )}
                  <button
                    onClick={() => handleDesvincular(vinculo.contratoId)}
                    disabled={desvinculando === vinculo.contratoId}
                    className="text-xs text-red-500 dark:text-red-400 hover:underline disabled:opacity-50"
                  >
                    {desvinculando === vinculo.contratoId ? 'Removendo...' : 'Desvincular'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico de Anexos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Histórico de Anexos
        </h2>
        {documento.arquivos.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum anexo registrado.</p>
        ) : (
          <div className="space-y-3">
            {[...documento.arquivos]
              .sort((a, b) => b.versao - a.versao)
              .map((arquivo) => (
                <div
                  key={arquivo.id}
                  className={`flex items-start justify-between p-4 rounded-lg border ${
                    arquivo.ativo
                      ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Versão {arquivo.versao}
                      </span>
                      {arquivo.ativo && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-medium">
                          Atual
                        </span>
                      )}
                    </div>
                    {arquivo.motivoUpload && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{arquivo.motivoUpload}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatarDataHora(arquivo.criadoEm)}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <button
                      onClick={async () => {
                        try {
                          const url = await gerarUrlAssinada(arquivo.arquivoUrl);
                          window.open(url, '_blank');
                        } catch {
                          alert('Erro ao abrir arquivo. Tente novamente.');
                        }
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      📎 Abrir
                    </button>
                    <button
                      onClick={() => {
                        setArquivoExcluindo(arquivo);
                        setErroExcluirArquivo('');
                      }}
                      className="text-sm text-red-500 dark:text-red-400 hover:underline"
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modal Vincular Contrato */}
      {modalVinculoAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Vincular a Contrato
              </h2>
              <button
                onClick={() => setModalVinculoAberto(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSalvarVinculo} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contrato <span className="text-red-500">*</span>
                </label>
                {contratosDisponiveis.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    Todos os contratos já estão vinculados a este documento.
                  </p>
                ) : (
                  <select
                    required
                    value={formVinculo.contratoId}
                    onChange={(e) => setFormVinculo({ ...formVinculo, contratoId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="">Selecione um contrato</option>
                    {contratosDisponiveis.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Emissão máxima exigida (dias)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formVinculo.emissaoMaximaDias}
                  onChange={(e) => setFormVinculo({ ...formVinculo, emissaoMaximaDias: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Ex: 90 (deixe vazio se não houver restrição)"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Se preenchido, o sistema verificará se o documento foi emitido dentro deste prazo.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  value={formVinculo.observacoes}
                  onChange={(e) => setFormVinculo({ ...formVinculo, observacoes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                  placeholder="Informações adicionais sobre este vínculo..."
                />
              </div>

              {erroVinculo && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{erroVinculo}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                                <button
                  type="button"
                  onClick={() => setModalVinculoAberto(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoVinculo || contratosDisponiveis.length === 0}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition text-sm font-medium"
                >
                  {salvandoVinculo ? 'Vinculando...' : 'Vincular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Anexar Arquivo */}
      {modalAnexoAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Anexar Novo Arquivo
              </h2>
              <button
                onClick={() => setModalAnexoAberto(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSalvarAnexo} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Arquivo <span className="text-red-500">*</span>
                </label>
                <UploadArquivo
                  onUploadConcluido={(url) => setFormAnexo({ ...formAnexo, arquivoUrl: url })}
                />
                {formAnexo.arquivoUrl && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✅ Arquivo enviado com sucesso
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Emissão <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formAnexo.dataEmissao}
                  onChange={(e) => setFormAnexo({ ...formAnexo, dataEmissao: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Validade (dias) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formAnexo.validadeDias}
                  onChange={(e) => setFormAnexo({ ...formAnexo, validadeDias: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Ex: 90"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo do Upload
                </label>
                <input
                  type="text"
                  value={formAnexo.motivoUpload}
                  onChange={(e) => setFormAnexo({ ...formAnexo, motivoUpload: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Ex: Renovação anual obrigatória"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  value={formAnexo.observacoes}
                  onChange={(e) => setFormAnexo({ ...formAnexo, observacoes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                  placeholder="Informações adicionais..."
                />
              </div>
              {erroAnexo && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{erroAnexo}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAnexoAberto(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoAnexo || !formAnexo.arquivoUrl}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition text-sm font-medium"
                >
                  {salvandoAnexo ? 'Salvando...' : 'Anexar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Excluir Arquivo */}
      {arquivoExcluindo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                ⚠️ Excluir Arquivo
              </h2>
              <button
                onClick={() => setArquivoExcluindo(null)}
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
                  O arquivo da <strong>Versão {arquivoExcluindo.versao}</strong> será
                  permanentemente removido do sistema e do armazenamento.
                </p>
              </div>
              {arquivoExcluindo.ativo && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    ⚠️ Este é o arquivo <strong>atual</strong>. Ao excluí-lo, a versão
                    anterior será restaurada automaticamente.
                  </p>
                </div>
              )}
              {erroExcluirArquivo && (
                <p className="text-red-500 text-sm">{erroExcluirArquivo}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setArquivoExcluindo(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExcluirArquivo}
                  disabled={excluindoArquivo}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition text-sm font-medium"
                >
                  {excluindoArquivo ? 'Excluindo...' : 'Confirmar Exclusão'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}