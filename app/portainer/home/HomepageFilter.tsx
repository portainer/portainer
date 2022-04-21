import { components, OptionProps } from 'react-select';

import { useLocalStorage } from '@/portainer/hooks/useLocalStorage';
import { Select } from '@/portainer/components/form-components/ReactSelect';
import { Filter } from '@/portainer/home/types';

interface Props {
  filterOptions: Filter[];
  onChange: (filterOptions: Filter[]) => void;
  placeHolder: string;
  value: Filter[];
}

function Option(props: OptionProps<Filter, true>) {
  const { isSelected, label } = props;
  return (
    <div>
      <components.Option
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      >
        <input type="checkbox" checked={isSelected} onChange={() => null} />{' '}
        <label>{label}</label>
      </components.Option>
    </div>
  );
}

export function HomepageFilter({
  filterOptions,
  onChange,
  placeHolder,
  value,
}: Props) {
  return (
    <Select
      placeholder={placeHolder}
      options={filterOptions}
      value={value}
      isMulti
      components={{ Option }}
      onChange={(option) => onChange(option as Filter[])}
    />
  );
}

export function useHomePageFilter<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const filterKey = keyBuilder(key);
  const [storageValue, setStorageValue] = useLocalStorage(
    filterKey,
    JSON.stringify(defaultValue),
    sessionStorage
  );
  const value = jsonParse(storageValue, defaultValue);
  return [value, setValue];

  function setValue(value?: T) {
    setStorageValue(JSON.stringify(value));
  }
}

function keyBuilder(key: string) {
  return `datatable_home_filter_type_${key}`;
}

function jsonParse<T>(value: string, defaultValue: T): T {
  try {
    return JSON.parse(value);
  } catch (e) {
    return defaultValue;
  }
}
