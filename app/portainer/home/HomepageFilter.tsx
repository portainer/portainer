import { components, OptionProps } from 'react-select';

import { useLocalStorage } from '@/portainer/hooks/useLocalStorage';
import { Select } from '@/portainer/components/form-components/ReactSelect';
import { Filter } from '@/portainer/home/types';
import {
  EnvironmentType,
  EnvironmentStatus,
} from '@/portainer/environments/types';

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

export function useHomePageStatusTypeState(
  key: string
): [
  EnvironmentStatus[] | undefined,
  (value: EnvironmentStatus[] | undefined) => void
] {
  const filterKey = keyBuilder(key);
  const [value, setValue] = useLocalStorage(filterKey, '[]', sessionStorage);

  const v = JSON.parse(value);
  // eslint-disable-next-line func-style
  const setValueParsed = (value: EnvironmentStatus[] | undefined) => {
    setValue(JSON.stringify(value));
  };

  return [v, setValueParsed];

  function keyBuilder(key: string) {
    return `datatable_home_filter_${key}`;
  }
}

export function useHomePageNumberTypeState(
  key: string,
  defaultValue: number[]
): [number[] | undefined, (value: number[] | undefined) => void] {
  const filterKey = keyBuilder(key);
  const [value, setValue] = useLocalStorage(
    filterKey,
    JSON.stringify(defaultValue),
    sessionStorage
  );

  const v = JSON.parse(value);
  // eslint-disable-next-line func-style
  const setValueParsed = (value: number[] | undefined) => {
    setValue(JSON.stringify(value));
  };

  return [v, setValueParsed];

  function keyBuilder(key: string) {
    return `datatable_home_filter_${key}`;
  }
}

export function useHomePageFilterState(
  key: string
): [
  EnvironmentType[] | EnvironmentStatus[] | undefined,
  (value: EnvironmentType[] | EnvironmentStatus[] | undefined) => void
] {
  const filterKey = keyBuilder(key);
  const [value, setValue] = useLocalStorage(filterKey, '[]', sessionStorage);

  const v = JSON.parse(value);
  // eslint-disable-next-line func-style
  const setValueParsed = (
    value: EnvironmentType[] | EnvironmentStatus[] | undefined
  ) => {
    setValue(JSON.stringify(value));
  };

  return [v, setValueParsed];

  function keyBuilder(key: string) {
    return `datatable_home_filter_${key}`;
  }
}

export function useHomePageFilterBoolState(
  key: string
): [boolean, (value: boolean) => void] {
  const filterKey = keyBuilder(key);
  const [value, setValue] = useLocalStorage(filterKey, 'false', sessionStorage);

  const v = JSON.parse(value);
  // eslint-disable-next-line func-style
  const setValueParsed = (value: boolean) => {
    setValue(JSON.stringify(value));
  };

  return [v, setValueParsed];

  function keyBuilder(key: string) {
    return `datatable_home_filter_${key}`;
  }
}

export function useHomePageFilterTypeState(
  key: string
): [Filter[], (value: Filter[]) => void] {
  const filterKey = keyBuilder(key);
  const [value, setValue] = useLocalStorage(filterKey, '[]', sessionStorage);

  const v = JSON.parse(value);
  // eslint-disable-next-line func-style
  const setValueParsed = (value: Filter[]) => {
    setValue(JSON.stringify(value));
  };

  return [v, setValueParsed];

  function keyBuilder(key: string) {
    return `datatable_home_filter_type_${key}`;
  }
}

export function useHomePageSingleFilterTypeState(
  key: string
): [Filter | undefined, (value: Filter | undefined) => void] {
  const filterKey = keyBuilder(key);
  const [value, setValue] = useLocalStorage(filterKey, '', sessionStorage);

  const v = value && JSON.parse(value);
  // eslint-disable-next-line func-style
  const setValueParsed = (value: Filter | undefined) => {
    setValue(JSON.stringify(value));
  };

  return [v, setValueParsed];

  function keyBuilder(key: string) {
    return `datatable_home_filter_type_${key}`;
  }
}
