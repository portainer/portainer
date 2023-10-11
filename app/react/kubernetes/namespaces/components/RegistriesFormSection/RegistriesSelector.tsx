import { MultiValue } from 'react-select';

import { Registry } from '@/react/portainer/registries/types';

import { Select } from '@@/form-components/ReactSelect';

interface Props {
  value: MultiValue<Registry>;
  onChange(value: MultiValue<Registry>): void;
  options: Registry[];
  inputId?: string;
}

export function RegistriesSelector({
  value,
  onChange,
  options,
  inputId,
}: Props) {
  return (
    <Select
      isMulti
      getOptionLabel={(option) => option.Name}
      getOptionValue={(option) => String(option.Id)}
      options={options}
      value={value}
      closeMenuOnSelect={false}
      onChange={onChange}
      inputId={inputId}
      data-cy="namespaceCreate-registrySelect"
      placeholder="Select one or more registries"
    />
  );
}
