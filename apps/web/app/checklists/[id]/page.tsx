'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';

interface ItemChecklist {
  id: string;
  status: string;
  observacao: string | null;
  dataEntrega: string | null;
  documentoId: string | null;
  itemModelo: {
    id: string;
    nomeItem: string;
    descricao: string | null;
    bloco: string | null;
    obrigatorio: boolean;
    ordem: number;
    tipoDocumento: { id: string; nome: string; categoria: string } | null;
  };
  documento: {
    id: string;
    status: string;
    dataVencimento: string | null;
    diasRestantes: number | null;
    tipoDocumento: { nome: string };
  } | null;
}

interface ChecklistUnidade {
  id: string;
  status: string;
  observacoes: string | null;
  criadoEm: string;
  modelo: { id: string; nome: string; descricao: string | null };
  unidade: { id: string; nome: string };
  itens: ItemChecklist[];
  total: number;
  obrigatorios: number;
  entregues: number;
  progresso: number;
}

const statusItemConfig: Record<string, { label: string; cor: string; icone: string }> = {
  PENDENTE: {
    label: 'Pendente',
    cor: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    icone: '⏳',
  },
  ENTREGUE: {
    label: 'Entregue',
    cor: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    icone: '✅',
  },
  COM_RESSALVA: {
    label: 'Com ressalva',
    cor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    icone: '⚠️',
  },
  NAO_APLICAVEL: {
    label: 'Não aplicável',
    cor: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    icone: '➖',
  },
};

const statusGeralConfig: Record<string, { label: string; cor: string }> = {
  EM_ANDAMENTO: {
    label: 'Em andamento',
    cor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  },
  COMPLETO: {
    label: 'Completo',
    cor: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  REPROVADO: {
    label: 'Reprovado',
    cor: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
};

function formatarData(data: string | null): string {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR');
}

export default function ChecklistDetalhePage() {
  const { id } = useParams();
  const router = useRouter();
  const [checklist, setChecklist] = useState<ChecklistUnidade | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [recalculando, setRecalculando] = useState(false);

  // Modal editar item
  const [itemEditando, setItemEditando] = useState<ItemChecklist | null>(null);
  const [salvandoItem, setSalvandoItem] = useState(false);
  const [erroItem, setErroItem] = useState('');
  const [formItem, setFormItem] = useState({
    status: '',
    observacao: '',
  });

  function carregarChecklist() {
    setCarregando(true);
    api
      .get(`/checklists-unidade/${id}`)
      .then((res) => setChecklist(res.data))
      .catch(() => router.push('/checklists'))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    if (id) carregarChecklist();
  }, [id]);

  async function handleRecalcular() {
    setRecalculando(true);
    try {
      const res = await api.post(`/checklists-unidade/${id}/recalcular`);
      setChecklist(res.data);
    } catch {
      alert('Erro ao recalcular. Tente novamente.');
    } finally {
      setRecalculando(false);
    }
  }

  function abrirModalEditarItem(item: ItemChecklist) {
    setItemEditando(item);
    setFormItem({
      status: item.status,
      observacao: item.observacao ?? '',
    });
    setErroItem('');
  }

  async function handleSalvarItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemEditando) return;
    setSalvandoItem(true);
    setErroItem('');
    try {
      await api.patch(`/itens-checklist/${itemEditando.id}`, {
        status: formItem.status,
        observacao: formItem.observacao || null,
      });
      setItemEditando(null);
      carregarChecklist();
    } catch (error: any) {
      setErroItem(error?.response?.data?.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setSalvandoItem(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <span className="animate-spin">⏳</span> Carregando...
      </div>
    );
  }

  if (!checklist) return null;

  const sg = statusGeralConfig[checklist.status] ?? statusGeralConfig['EM_ANDAMENTO'];

  // Agrupa itens por bloco
  const blocos = checklist.itens.reduce<Record<string, ItemChecklist[]>>((acc, item) => {
    const bloco = item.itemModelo.bloco ?? 'Sem bloco';
    if (!acc[bloco]) acc[bloco] = [];
    acc[bloco].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.push('/checklists')}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6 flex items-center gap-1"
      >
        ← Voltar para Checklists
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {checklist.modelo.nome}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {checklist.unidade.nome}
          </p>
          {checklist.modelo.descricao && (
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              {checklist.modelo.descricao}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${sg.cor}`}>
            {sg.label}
          </span>
          <button
            onClick={handleRecalcular}
            disabled={recalculando}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition disabled:opacity-50"
          >
            {recalculando ? '⏳ Recalculando...' : '🔄 Recalcular'}
          </button>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progresso — {checklist.entregues}/{checklist.obrigatorios} itens obrigatórios entregues
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {checklist.progresso}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              checklist.progresso === 100
                ? 'bg-green-500'
                : checklist.progresso >= 50
                ? 'bg-blue-500'
                : 'bg-yellow-500'
            }`}
            style={{ width: `${checklist.progresso}%` }}
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span>Total: {checklist.total} itens</span>
          <span>Obrigatórios: {checklist.obrigatorios}</span>
          <span className="text-green-600 dark:text-green-400">
            Entregues: {checklist.entregues}
          </span>
          <span className="text-yellow-600 dark:text-yellow-400">
            Pendentes: {checklist.obrigatorios - checklist.entregues}
          </span>
        </div>
      </div>

      {/* Itens agrupados por bloco */}
      <div className="space-y-4">
        {Object.entries(blocos).map(([bloco, itens]) => {
          const obrigatoriosBloco = itens.filter((i) => i.itemModelo.obrigatorio);
          const entreguesBloco = obrigatoriosBloco.filter((i) => i.status === 'ENTREGUE');

          return (
            <div
              key={bloco}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {bloco}
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {entreguesBloco.length}/{obrigatoriosBloco.length} obrigatórios entregues
                </span>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {itens.map((item) => {
                  const sc = statusItemConfig[item.status] ?? statusItemConfig['PENDENTE'];
                  return (
                    <div key={item.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.itemModelo.nomeItem}
                            </p>
                            {!item.itemModelo.obrigatorio && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                opcional
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.cor}`}>
                              {sc.icone} {sc.label}
                            </span>
                          </div>

                          {item.itemModelo.descricao && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {item.itemModelo.descricao}
                            </p>
                          )}

                          {/* Documento vinculado no DocPrazo */}
                          {item.documento ? (
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                onClick={() => router.push(`/documentos/${item.documento!.id}`)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                📄 {item.documento.tipoDocumento.nome}
                              </button>
                              {item.documento.dataVencimento && (
                                <span className={`text-xs ${
                                  (item.documento.diasRestantes ?? 0) < 0
                                    ? 'text-red-500'
                                    : (item.documento.diasRestantes ?? 0) <= 30
                                    ? 'text-yellow-500'
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  Vence: {formatarData(item.documento.dataVencimento)}
                                  {item.documento.diasRestantes !== null && (
                                    <> ({item.documento.diasRestantes} dias)</>
                                  )}
                                </span>
                              )}
                            </div>
                          ) : item.itemModelo.tipoDocumento ? (
                            <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                              ⚠️ Documento não encontrado no DocPrazo para esta unidade
                            </p>
                          ) : null}

                          {item.observacao && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                              💬 {item.observacao}
                            </p>
                          )}
                        </div>

                                                <button
                          onClick={() => abrirModalEditarItem(item)}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition shrink-0"
                        >
                          ✏️ Editar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Editar Item */}
      {itemEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Editar Item
              </h2>
              <button
                onClick={() => setItemEditando(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSalvarItem} className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {itemEditando.itemModelo.nomeItem}
                </p>
                {itemEditando.itemModelo.descricao && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {itemEditando.itemModelo.descricao}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formItem.status}
                  onChange={(e) => setFormItem({ ...formItem, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="PENDENTE">⏳ Pendente</option>
                  <option value="ENTREGUE">✅ Entregue</option>
                  <option value="COM_RESSALVA">⚠️ Com ressalva</option>
                  <option value="NAO_APLICAVEL">➖ Não aplicável</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observação
                </label>
                <textarea
                  value={formItem.observacao}
                  onChange={(e) => setFormItem({ ...formItem, observacao: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                  placeholder="Informações adicionais sobre este item..."
                />
              </div>

              {itemEditando.itemModelo.tipoDocumento && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Este item está vinculado ao tipo de documento{' '}
                    <strong>{itemEditando.itemModelo.tipoDocumento.nome}</strong>.
                    O status é atualizado automaticamente quando o documento é
                    renovado no DocPrazo.
                  </p>
                </div>
              )}

              {erroItem && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{erroItem}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setItemEditando(null)}
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