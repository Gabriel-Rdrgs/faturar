'use client';

import { useState } from 'react';
import { createClient } from '../lib/supabase';

interface Props {
  onUploadConcluido: (url: string) => void;
}

export default function UploadArquivo({ onUploadConcluido }: Props) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [nomeArquivo, setNomeArquivo] = useState('');

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setEnviando(true);
    setErro('');
    setNomeArquivo(arquivo.name);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setErro('Sessão expirada. Faça login novamente.');
        return;
      }

      const extensao = arquivo.name.split('.').pop();
      const nomeUnico = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extensao}`;
      const caminho = `uploads/${nomeUnico}`;

      const { error } = await supabase.storage
        .from('documentos')
        .upload(caminho, arquivo, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        setErro('Erro ao fazer upload. Tente novamente.');
        return;
      }

    const { data: urlData, error: urlError } = await supabase.storage
      .from('documentos')
      .createSignedUrl(caminho, 60 * 60);

    if (urlError || !urlData) {
      setErro('Erro ao gerar URL do arquivo.');
      return;
    }

    onUploadConcluido(caminho);
    } catch {
      setErro('Erro inesperado. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition bg-gray-50 dark:bg-gray-700">
        <div className="flex flex-col items-center justify-center gap-1">
          {enviando ? (
            <>
              <span className="animate-spin text-2xl">⏳</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enviando...</p>
            </>
          ) : nomeArquivo ? (
            <>
              <span className="text-2xl">✅</span>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{nomeArquivo}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Clique para trocar</p>
            </>
          ) : (
            <>
              <span className="text-2xl">📎</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Clique para selecionar o arquivo
              </p>
              <p className="text-xs text-gray-400">PDF, JPG, PNG até 10MB</p>
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleArquivo}
          disabled={enviando}
        />
      </label>

      {erro && (
        <p className="text-red-500 text-xs mt-1">{erro}</p>
      )}
    </div>
  );
}