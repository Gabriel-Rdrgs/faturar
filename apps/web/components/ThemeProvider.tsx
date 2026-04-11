'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Tema = 'claro' | 'escuro';

const TemaContext = createContext<{
  tema: Tema;
  alternarTema: () => void;
}>({
  tema: 'claro',
  alternarTema: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>('claro');

  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema') as Tema | null;
    if (temaSalvo) {
      setTema(temaSalvo);
      document.documentElement.classList.toggle('dark', temaSalvo === 'escuro');
    }
  }, []);

  const alternarTema = () => {
    const novoTema = tema === 'claro' ? 'escuro' : 'claro';
    setTema(novoTema);
    localStorage.setItem('tema', novoTema);
    document.documentElement.classList.toggle('dark', novoTema === 'escuro');
  };

  return (
    <TemaContext.Provider value={{ tema, alternarTema }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  return useContext(TemaContext);
}