'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';

interface TipoDocumento {
  id: string;
  nome: string;
  categoria: string;
}

interface ItemModelo {
  id: string;
  nomeItem: string;
  descricao: string | null;
  bloco: string | null;
  obrigatorio: boolean;
  ordem: number;
  tipoDocumento: { id: string; nome: string; categoria: string } | null;
}

interface ModeloChecklist {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  contrato: { id: string; nome: string } | null;
  itens: ItemModelo[];
  _count: { checklists: number };
}

const statusItemConfig: Record<string, { label: string; cor: string }> = {
  PENDENTE: { label: 'Pendente', cor: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  ENTREGUE: { label: 'Entregue', cor: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  COM_RESSALVA: { label: 'Com ressalva', cor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  NAO_APLICAVEL: { label: 'Não aplicável', cor: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
};

export default function ModeloChecklistDetalhePage() {
  const { id } = useParams();
  const router = useRouter();
  const [modelo, setModelo] = useState<ModeloChecklist | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);

  // Modal item
  const [modalItemAberto, setModalItemAberto] = useState(false);
  const [itemEditando, setItemEditando] = useState<ItemModelo | null>(null);
  const [salvandoItem, setSalvandoItem] = useState(false);
  const [erroItem, setErroItem] = useState('');
  const [formItem, setFormItem] = useState({
    nomeItem: '',
    descricao: '',
    bloco: '',
    obrigatorio: true,
    ordem: 0,
    tipoDocumentoId: '',
  });

  // Excluir item
  const [excluindoItem, setExcluindoItem] = useState<string | null>(null);

  function carregarModelo() {
    setCarregando(true);
    api
      .get(`/modelos-checklist/${id}`)
      .then((res) => setModelo(res.data))
      .catch(() => router.push('/modelos-checklist'))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    if (!id) return;
    carregarModelo();
    api
      .get('/tipos-documento')
      .then((res) => setTiposDocumento(Array.isArray(res.data) ? res.data : []));
  }, [id]);

  function abrirModalNovoItem() {
    setItemEditando(null);
    setFormItem({
      nomeItem: '',
      descricao: '',
      bloco: '',
      obrigatorio: true,
      ordem: (modelo?.itens.length ?? 0) + 1,
      tipoDocumentoId: '',
    });
    setErroItem('');
    setModalItemAberto(true);
  }

  function abrirModalEditarItem(item: ItemModelo) {
    setItemEditando(item);
    setFormItem({
      nomeItem: item.nomeItem,
      descricao: item.descricao ?? '',
      bloco: item.bloco ?? '',
      obrigatorio: item.obrigatorio,
      ordem: item.ordem,
      tipoDocumentoId: item.tipoDocumento?.id ?? '',
    });
    setErroItem('');
    setModalItemAberto(true);
  }

  async function handleSalvarItem(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoItem(true);
    setErroItem('');
    try {
      const dados = {
        modeloId: id,
        nomeItem: formItem.nomeItem,
        descricao: formItem.descricao || null,
        bloco: formItem.bloco || null,
        obrigatorio: formItem.obrigatorio,
        ordem: formItem.ordem,
        tipoDocumentoId: formItem.tipoDocumentoId || null,
      };

      if (itemEditando) {
        await api.put(`/itens-modelo-checklist/${itemEditando.id}`, dados);
      } else {
        await api.post('/itens-modelo-checklist', dados);
      }

      setModalItemAberto(false);
      carregarModelo();
    } catch (error: any) {
      setErroItem(error?.response?.data?.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setSalvandoItem(false);
    }
  }

  async function handleExcluirItem(itemId: string) {
    setExcluindoItem(itemId);
    try {
      await api.delete(`/itens-modelo-checklist/${itemId}`);
      carregarModelo();
    } catch {
      alert('Erro ao excluir item. Tente novamente.');
    } finally {
      setExcluindoItem(null);
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <span className="animate-spin">⏳</span> Carregando...
      </div>
    );
  }

  if (!modelo) return null;

  // Agrupa itens por bloco
  const blocos = modelo.itens.reduce<Record<string, ItemModelo[]>>((acc, item) => {
    const bloco = item.bloco ?? 'Sem bloco';
    if (!acc[bloco]) acc[bloco] = [];
    acc[bloco].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.push('/modelos-checklist')}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6 flex items-center gap-1"
      >
        ← Voltar para Modelos
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{modelo.nome}</h1>
          {modelo.descricao && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{modelo.descricao}</p>
          )}
          {modelo.contrato && (
            <p className="text-blue-500 dark:text-blue-400 text-sm mt-1">
              📋 {modelo.contrato.nome}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
            modelo.ativo
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            {modelo.ativo ? 'Ativo' : 'Inativo'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {modelo._count.checklists} checklist(s) gerado(s)
          </span>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{modelo.itens.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total de itens</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {modelo.itens.filter((i) => i.obrigatorio).length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Obrigatórios</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {modelo.itens.filter((i) => i.tipoDocumento).length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Com tipo vinculado</p>
        </div>
      </div>

      {/* Itens */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Itens do Modelo
          </h2>
          <button
            onClick={abrirModalNovoItem}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
          >
            + Adicionar Item
          </button>
        </div>

        {modelo.itens.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 dark:text-gray-400 mb-1">
              Nenhum item cadastrado ainda.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Adicione os documentos exigidos por este edital ou processo.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {Object.entries(blocos).map(([bloco, itens]) => (
              <div key={bloco}>
                <div className="px-5 py-2 bg-gray-50 dark:bg-gray-900">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {bloco}
                  </p>
                </div>
                {itens.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.nomeItem}
                        </p>
                        {!item.obrigatorio && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                            opcional
                          </span>
                        )}
                      </div>
                      {item.descricao && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {item.descricao}
                        </p>
                      )}
                      {item.tipoDocumento ? (
                        <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
                          🔗 {item.tipoDocumento.nome}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          Sem tipo vinculado — preenchimento manual
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        #{item.ordem}
                      </span>
                      <button
                        onClick={() => abrirModalEditarItem(item)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleExcluirItem(item.id)}
                        disabled={excluindoItem === item.id}
                        className="text-sm text-red-500 dark:text-red-400 hover:underline disabled:opacity-50"
                      >
                        {excluindoItem === item.id ? '...' : '🗑️'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Item */}
      {modalItemAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {itemEditando ? 'Editar Item' : 'Adicionar Item'}
              </h2>
              <button
                onClick={() => setModalItemAberto(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSalvarItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do item <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formItem.nomeItem}
                  onChange={(e) => setFormItem({ ...formItem, nomeItem: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Ex: Certidão Negativa de Débitos Trabalhistas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bloco / Agrupamento
                </label>
                <input
                  type="text"
                  value={formItem.bloco}
                  onChange={(e) => setFormItem({ ...formItem, bloco: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Ex: Regularidade Fiscal, Qualificação Técnica"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Documento vinculado
                </label>
                <select
                  value={formItem.tipoDocumentoId}
                  onChange={(e) => setFormItem({ ...formItem, tipoDocumentoId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">Sem vínculo (preenchimento manual)</option>
                  {tiposDocumento.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} — {t.categoria}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Se vinculado, o sistema cruzará automaticamente com o DocPrazo.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formItem.descricao}
                  onChange={(e) => setFormItem({ ...formItem, descricao: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                  placeholder="Observações sobre este item..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ordem
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formItem.ordem}
                    onChange={(e) => setFormItem({ ...formItem, ordem: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div className="flex items-end pb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formItem.obrigatorio}
                      onChange={(e) => setFormItem({ ...formItem, obrigatorio: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Obrigatório</span>
                  </label>
                </div>
              </div>

              {erroItem && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{erroItem}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalItemAberto(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoItem}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition text-sm font-medium"
                >
                  {salvandoItem ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}