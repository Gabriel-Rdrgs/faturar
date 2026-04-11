'use client';

import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
  criadoEm: string;
  unidade: { id: string; nome: string } | null;
}

interface Unidade {
  id: string;
  nome: string;
}

const papelLabel: Record<string, string> = {
  ADMIN_GLOBAL: 'Admin Global',
  GESTOR_GLOBAL: 'Gestor Global',
  GESTOR_UNIDADE: 'Gestor de Unidade',
  OPERACIONAL_UNIDADE: 'Operacional',
};

const papelCor: Record<string, string> = {
  ADMIN_GLOBAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  GESTOR_GLOBAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  GESTOR_UNIDADE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  OPERACIONAL_UNIDADE: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const papeis = ['ADMIN_GLOBAL', 'GESTOR_GLOBAL', 'GESTOR_UNIDADE', 'OPERACIONAL_UNIDADE'];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Modal criar/editar
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    nome: '',
    email: '',
    papel: 'OPERACIONAL_UNIDADE',
    unidadeId: '',
    ativo: true,
  });

  // Modal excluir
  const [usuarioExcluindo, setUsuarioExcluindo] = useState<Usuario | null>(null);
  const [confirmacaoNome, setConfirmacaoNome] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState('');

  function carregarUsuarios() {
    setCarregando(true);
    api
      .get('/usuarios')
      .then((res) => setUsuarios(Array.isArray(res.data) ? res.data : []))
      .catch(() => setUsuarios([]))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregarUsuarios();
    api.get('/unidades').then((res) => setUnidades(Array.isArray(res.data) ? res.data : []));
  }, []);

  function abrirModalCriar() {
    setUsuarioEditando(null);
    setForm({ nome: '', email: '', papel: 'OPERACIONAL_UNIDADE', unidadeId: '', ativo: true });
    setErro('');
    setModalAberto(true);
  }

  function abrirModalEditar(usuario: Usuario) {
    setUsuarioEditando(usuario);
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      unidadeId: usuario.unidade?.id ?? '',
      ativo: usuario.ativo,
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
        email: form.email,
        papel: form.papel,
        unidadeId: form.unidadeId || undefined,
        ativo: form.ativo,
      };
      if (usuarioEditando) {
        await api.put(`/usuarios/${usuarioEditando.id}`, dados);
      } else {
        await api.post('/usuarios', dados);
      }
      setModalAberto(false);
      carregarUsuarios();
    } 
    catch (error: any) {
        console.error('Erro ao criar usuário:', error);
        setErro(error?.response?.data?.message ?? 'Erro ao salvar. Verifique os dados e tente novamente.');
    } 
    finally {
            setSalvando(false);
    }
  }
  async function handleExcluir() {
    if (!usuarioExcluindo) return;
    if (confirmacaoNome !== usuarioExcluindo.nome) {
      setErroExcluir('O nome digitado não confere. Tente novamente.');
      return;
    }
    setExcluindo(true);
    setErroExcluir('');
    try {
      await api.delete(`/usuarios/${usuarioExcluindo.id}`);
      setUsuarioExcluindo(null);
      carregarUsuarios();
    } catch {
      setErroExcluir('Erro ao excluir. Tente novamente.');
    } finally {
      setExcluindo(false);
    }
  }

  const precisaUnidade = form.papel === 'GESTOR_UNIDADE' || form.papel === 'OPERACIONAL_UNIDADE';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Colaboradores e acessos ao sistema
          </p>
        </div>
        <button
          onClick={abrirModalCriar}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Novo Usuário
        </button>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <span className="animate-spin">⏳</span> Carregando...
        </div>
      ) : usuarios.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-gray-500 dark:text-gray-400">Nenhum usuário cadastrado ainda.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Nome</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Papel</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Unidade</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{usuario.nome}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{usuario.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${papelCor[usuario.papel] ?? papelCor['OPERACIONAL_UNIDADE']}`}>
                      {papelLabel[usuario.papel] ?? usuario.papel}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                    {usuario.unidade?.nome ?? <span className="text-gray-400">Global</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      usuario.ativo
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => abrirModalEditar(usuario)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => {
                          setUsuarioExcluindo(usuario);
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
                {usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}
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
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-mail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Papel <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.papel}
                  onChange={(e) => setForm({ ...form, papel: e.target.value, unidadeId: '' })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  {papeis.map((p) => (
                    <option key={p} value={p}>{papelLabel[p]}</option>
                  ))}
                </select>

                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs text-gray-500 dark:text-gray-400">
                  {form.papel === 'ADMIN_GLOBAL' && 'Acesso total ao sistema. Sem restrição de unidade.'}
                  {form.papel === 'GESTOR_GLOBAL' && 'Vê todas as unidades. Pode criar e editar usuários.'}
                  {form.papel === 'GESTOR_UNIDADE' && 'Gerencia documentos e dados da sua unidade.'}
                  {form.papel === 'OPERACIONAL_UNIDADE' && 'Acesso operacional à sua unidade. Pode anexar arquivos e atualizar documentos.'}
                </div>
              </div>

              {precisaUnidade && (
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
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="ativo" className="text-sm text-gray-700 dark:text-gray-300">
                  Usuário ativo
                </label>
              </div>

              {!usuarioEditando && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    A senha inicial será <strong>Faturar@2026</strong>. O usuário deverá alterá-la no primeiro acesso.
                  </p>
                </div>
              )}

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
      {usuarioExcluindo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                ⚠️ Excluir Usuário
              </h2>
              <button
                onClick={() => setUsuarioExcluindo(null)}
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
                  O usuário perderá todo o acesso ao sistema imediatamente.
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Para confirmar, digite o nome do usuário:
                  <span className="font-semibold"> {usuarioExcluindo.nome}</span>
                </p>
                <input
                  type="text"
                  value={confirmacaoNome}
                  onChange={(e) => setConfirmacaoNome(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  placeholder="Digite o nome exato"
                />
              </div>
              {erroExcluir && <p className="text-red-500 text-sm">{erroExcluir}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setUsuarioExcluindo(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExcluir}
                  disabled={excluindo || confirmacaoNome !== usuarioExcluindo.nome}
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