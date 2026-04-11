'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../lib/api';

interface Documento {
  id: string;
  status: string;
  diasRestantes: number | null;
  dataVencimento: string | null;
  tipoDocumento: { nome: string };
  unidade: { nome: string };
}

interface ResumoUnidade {
  nome: string;
  total: number;
  validos: number;
  atencao: number;
  vencidos: number;
  semData: number;
}

function formatarData(data: string | null): string {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR');
}

export default function Home() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api
      .get('/documentos')
      .then((res) => setDocumentos(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDocumentos([]))
      .finally(() => setCarregando(false));
  }, []);

  const total = documentos.length;
  const validos = documentos.filter((d) => d.status === 'VALIDO').length;
  const atencao = documentos.filter((d) => d.status === 'ATENCAO').length;
  const vencidos = documentos.filter((d) => d.status === 'VENCIDO').length;
  const semData = documentos.filter((d) => d.status === 'SEM_DATA').length;

  const criticos = documentos
    .filter((d) => d.status === 'VENCIDO' || d.status === 'ATENCAO')
    .sort((a, b) => (a.diasRestantes ?? 0) - (b.diasRestantes ?? 0))
    .slice(0, 8);

  const resumoPorUnidade: ResumoUnidade[] = Object.values(
    documentos.reduce((acc, doc) => {
      const nome = doc.unidade.nome;
      if (!acc[nome]) {
        acc[nome] = { nome, total: 0, validos: 0, atencao: 0, vencidos: 0, semData: 0 };
      }
      acc[nome].total++;
      if (doc.status === 'VALIDO') acc[nome].validos++;
      if (doc.status === 'ATENCAO') acc[nome].atencao++;
      if (doc.status === 'VENCIDO') acc[nome].vencidos++;
      if (doc.status === 'SEM_DATA') acc[nome].semData++;
      return acc;
    }, {} as Record<string, ResumoUnidade>)
  );

  const modulos = [
    { titulo: 'Unidades', descricao: 'Fleming, Provida, Solar, Logos, Faturar', href: '/unidades', icon: '🏢', cor: 'border-blue-500' },
    { titulo: 'Documentos com Prazo', descricao: 'Certidões, licenças e vencimentos', href: '/documentos', icon: '📄', cor: 'border-green-500' },
    { titulo: 'Contratos', descricao: 'Editais, convênios e vínculos', href: '/contratos', icon: '📋', cor: 'border-purple-500' },
    { titulo: 'Tipos de Documento', descricao: 'Catálogo de tipos e validades', href: '/tipos-documento', icon: '🗂️', cor: 'border-orange-500' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Visão geral do sistema — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {carregando ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <span className="animate-spin">⏳</span> Carregando...
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">documentos cadastrados</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-800 p-5">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">✅ Válidos</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{validos}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">em dia</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-yellow-200 dark:border-yellow-800 p-5">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">⚠️ Atenção</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{atencao}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vencendo em breve</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-5">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">❌ Críticos</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{vencidos + semData}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vencidos ou sem data</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Documentos críticos */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Documentos Críticos:
                </h2>
                <Link href="/documentos" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  Ver todos →
                </Link>
              </div>

              {criticos.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum documento crítico. Tudo em dia!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {criticos.map((doc) => (
                    <Link key={doc.id} href={`/documentos/${doc.id}`}>
                      <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {doc.tipoDocumento.nome}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{doc.unidade.nome}</p>
                        </div>
                        <div className="text-right ml-4">
                          {doc.status === 'VENCIDO' ? (
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                              ❌ Vencido
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                              ⚠️ {doc.diasRestantes} dias
                            </span>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">{formatarData(doc.dataVencimento)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Resumo por unidade */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Por Unidade
                </h2>
              </div>
              {resumoPorUnidade.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum dado disponível.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {resumoPorUnidade.map((u) => (
                    <div key={u.nome} className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{u.nome}</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {u.total} total
                        </span>
                        {u.validos > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            ✅ {u.validos}
                          </span>
                        )}
                        {u.atencao > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                            ⚠️ {u.atencao}
                          </span>
                        )}
                        {u.vencidos > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                            ❌ {u.vencidos}
                          </span>
                        )}
                        {u.semData > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            ⏳ {u.semData}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Módulos */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Módulos do Sistema
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {modulos.map((modulo) => (
                <Link key={modulo.href} href={modulo.href}>
                  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 ${modulo.cor} p-5 hover:shadow-md transition cursor-pointer`}>
                    <div className="text-2xl mb-2">{modulo.icon}</div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{modulo.titulo}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{modulo.descricao}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}