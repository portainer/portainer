import { components, OptionProps } from 'react-select';

import { useLocalStorage } from '@/portainer/hooks/useLocalStorage';
import { Filter } from '@/portainer/home/types';

import { Select } from '@@/form-components/ReactSelect';

interface Props<TValue = number> {
  filterOptions?: Filter<TValue>[];
  onChange: (filterOptions: Filter<TValue>[]) => void;
  placeHolder: string;
  value: Filter<TValue>[];
}

function Option<TValue = number>(props: OptionProps<Filter<TValue>, true>) {
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

export function HomepageFilter<TValue = number>({
  filterOptions = [],
  onChange,
  placeHolder,
  value,
}: Props<TValue>) {
  return (
    <Select
      closeMenuOnSelect={false}
      placeholder={placeHolder}
      options={filterOptions}
      value={value}
      isMulti
      components={{ Option }}
      onChange={(option) => onChange([...option])}
    />
  );
}

export function useHomePageFilter<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const filterKey = keyBuilder(key);
  return useLocalStorage(filterKey, defaultValue, sessionStorage);
}

function keyBuilder(key: string) {
  return `datatable_home_filter_type_${key}`;
}
