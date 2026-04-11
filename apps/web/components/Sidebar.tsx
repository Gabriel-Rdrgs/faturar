'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTema } from './ThemeProvider';
import { createClient } from '../lib/supabase';

const menu = [
    {
      grupo: 'Geral',
      itens: [
        { label: 'Início', href: '/', icon: '🏠' },
        { label: 'Unidades', href: '/unidades', icon: '🏢' },
        { label: 'Usuários', href: '/usuarios', icon: '👥' },
      ],
    },
  {
    grupo: 'Documental',
    itens: [
      { label: 'Documentos', href: '/documentos', icon: '📄' },
      { label: 'Tipos de Documento', href: '/tipos-documento', icon: '🗂️' },
      { label: 'Contratos', href: '/contratos', icon: '📋' },
    ],
  },
  {
    grupo: 'Alertas',
    itens: [
      { label: 'Alertas', href: '/alertas', icon: '🔔' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { tema, alternarTema } = useTema();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="w-64 bg-gray-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-white text-xl font-bold tracking-tight">Faturar</h1>
        <p className="text-gray-400 text-xs mt-1">Sistema de Gestão</p>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        {menu.map((grupo) => (
          <div key={grupo.grupo}>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              {grupo.grupo}
            </p>
            <ul className="space-y-1">
              {grupo.itens.map((item) => {
                const ativo = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                        ativo
                          ? 'bg-blue-600 text-white font-medium'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700 space-y-2">
        <button
          onClick={alternarTema}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition"
        >
          {tema === 'claro' ? '🌙 Modo Escuro' : '☀️ Modo Claro'}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-900 hover:text-red-200 transition"
        >
          🚪 Sair
        </button>
        <p className="text-gray-500 text-xs text-center pt-1">
          v0.1.0 · Sistema Faturar
        </p>
      </div>
    </aside>
  );
}