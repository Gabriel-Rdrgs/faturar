'use client';

import ReactSelect from 'react-select';

interface Opcao {
  value: string;
  label: string;
}

interface Props {
  opcoes: Opcao[];
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SelectBusca({
  opcoes,
  valor,
  onChange,
  placeholder = 'Selecione...',
  disabled = false,
}: Props) {
  const selecionado = opcoes.find((o) => o.value === valor) ?? null;

  return (
    <ReactSelect
      options={opcoes}
      value={selecionado}
      onChange={(opcao) => onChange(opcao?.value ?? '')}
      placeholder={placeholder}
      isDisabled={disabled}
      isSearchable
      noOptionsMessage={() => 'Nenhuma opção encontrada'}
      styles={{
        control: (base, state) => ({
          ...base,
          backgroundColor: 'var(--select-bg, white)',
          borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
          boxShadow: state.isFocused ? '0 0 0 2px rgba(59,130,246,0.3)' : 'none',
          borderRadius: '0.5rem',
          padding: '2px 4px',
          fontSize: '0.875rem',
          '&:hover': { borderColor: '#3b82f6' },
        }),
        menu: (base) => ({
          ...base,
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          zIndex: 9999,
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected
            ? '#3b82f6'
            : state.isFocused
            ? '#eff6ff'
            : 'white',
          color: state.isSelected ? 'white' : '#111827',
        }),
        singleValue: (base) => ({
          ...base,
          color: '#111827',
        }),
        input: (base) => ({
          ...base,
          color: '#111827',
        }),
      }}
    />
  );
}