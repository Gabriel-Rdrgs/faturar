import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sistema Faturar
        </h1>
        <p className="text-gray-500 mb-8">
          Gestão administrativa e operacional
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/unidades">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition cursor-pointer border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Unidades</h2>
              <p className="text-gray-500 text-sm mt-1">
                Fleming, Provida, Solar, Logos, Faturar
              </p>
            </div>
          </Link>

          <Link href="/documentos">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition cursor-pointer border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Documentos com Prazo</h2>
              <p className="text-gray-500 text-sm mt-1">
                Certidões, licenças e controle de vencimentos
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}