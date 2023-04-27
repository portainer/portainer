import { AutomationTestingProps } from '@/types';

import { Option } from '@@/form-components/PortainerSelect';
import { Select } from '@@/form-components/ReactSelect';

export function InputSearch({
  value,
  onChange,
  options,
  placeholder,
  'data-cy': dataCy,
  inputId,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option<string>[];
  placeholder?: string;
  inputId?: string;
} & AutomationTestingProps) {
  const selectValue = options.find((option) => option.value === value) || {
    value: '',
    label: value,
  };

  return (
    <Select
      options={options}
      value={selectValue}
      onChange={(option) => option && onChange(option.value)}
      placeholder={placeholder}
      data-cy={dataCy}
      inputId={inputId}
      onInputChange={(value, actionMeta) => {
        if (
          actionMeta.action !== 'input-change' &&
          actionMeta.action !== 'set-value'
        ) {
          return;
        }

        onChange(value);
      }}
      openMenuOnClick={false}
      openMenuOnFocus={false}
      components={{ DropdownIndicator: () => null }}
      onBlur={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    />
  );
}
