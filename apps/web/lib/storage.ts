import { createClient } from './supabase';

export async function gerarUrlAssinada(caminho: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('documentos')
    .createSignedUrl(caminho, 60 * 60);

  if (error || !data) throw new Error('Erro ao gerar URL');
  return data.signedUrl;
}