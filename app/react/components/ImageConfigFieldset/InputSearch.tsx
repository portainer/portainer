import { useMemo } from 'react';

import { AutomationTestingProps } from '@/types';

import { AutocompleteSelect } from '@@/form-components/AutocompleteSelect';
import { Option } from '@@/form-components/PortainerSelect';

export function InputSearch({
  value,
  onChange,
  options,
  placeholder,
  inputId,
  'data-cy': dataCy,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option<string>[];
  placeholder?: string;
  inputId: string;
} & AutomationTestingProps) {
  const searchResults = useMemo(() => {
    if (!value) {
      return [];
    }
    return options.filter((option) =>
      option.value.toLowerCase().includes(value.toLowerCase())
    );
  }, [options, value]);

  return (
    <AutocompleteSelect
      searchResults={searchResults}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      inputId={inputId}
      data-cy={dataCy}
    />
  );
}
