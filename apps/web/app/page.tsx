import Link from 'next/link';

const modulos = [
  {
    titulo: 'Unidades',
    descricao: 'Fleming, Provida, Solar, Logos, Faturar',
    href: '/unidades',
    icon: '🏢',
    cor: 'border-blue-500',
  },
  {
    titulo: 'Documentos com Prazo',
    descricao: 'Certidões, licenças e controle de vencimentos',
    href: '/documentos',
    icon: '📄',
    cor: 'border-green-500',
  },
  {
    titulo: 'Contratos',
    descricao: 'Editais, convênios e vínculos institucionais',
    href: '/contratos',
    icon: '📋',
    cor: 'border-purple-500',
  },
  {
    titulo: 'Alertas',
    descricao: 'Vencimentos próximos e pendências',
    href: '/alertas',
    icon: '🔔',
    cor: 'border-yellow-500',
  },
];

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bem-vindo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Sistema de gestão administrativa e operacional da Faturar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {modulos.map((modulo) => (
          <Link key={modulo.href} href={modulo.href}>
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 ${modulo.cor} p-6 hover:shadow-md transition cursor-pointer h-full`}>
              <div className="text-3xl mb-3">{modulo.icon}</div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modulo.titulo}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {modulo.descricao}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}