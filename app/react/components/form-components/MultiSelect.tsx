/* 

 .component(
    'porMultiSelect',
    r2a(MultiSelect, [
      'dataCy',
      'inputId',
      'name',
      'value',
      'onChange',
      'options',
      'placeholder',
    ])
  )
*/

import { Select } from '@@/form-components/ReactSelect';

interface Option<T = string> {
  value: T;
  label: string;
}

interface Props<T = string> {
  name?: string;
  value: Option<T>[];
  onChange(value: readonly Option<T>[]): void;
  options: Option<T>[];
  dataCy?: string;
  inputId?: string;
  placeholder?: string;
}

export function MultiSelect<T = string>({
  name,
  value,
  onChange,
  options,
  dataCy,
  inputId,
  placeholder,
}: Props<T>) {
  return (
    <Select
      name={name}
      isMulti
      getOptionLabel={(option) => option.label}
      getOptionValue={(option) => String(option.value)}
      options={options}
      value={value}
      closeMenuOnSelect={false}
      onChange={onChange}
      data-cy={dataCy}
      inputId={inputId}
      placeholder={placeholder}
    />
  );
}
