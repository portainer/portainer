import { components, OptionProps } from 'react-select';

import { useLocalStorage } from '@/react/hooks/useLocalStorage';

import {
  type Option as OptionType,
  PortainerSelect,
} from '@@/form-components/PortainerSelect';

interface Props<TValue = number> {
  filterOptions?: OptionType<TValue>[];
  onChange: (value: TValue[]) => void;
  placeHolder: string;
  value: TValue[];
}

function Option<TValue = number>(props: OptionProps<OptionType<TValue>, true>) {
  const { isSelected, label } = props;
  return (
    <div>
      <components.Option
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      >
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => null}
            data-cy={`homepage-filter-option-${label}`}
          />
          <label className="whitespace-nowrap">{label}</label>
        </div>
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
    <PortainerSelect<TValue>
      placeholder={placeHolder}
      options={filterOptions}
      value={value}
      isMulti
      components={{ Option }}
      onChange={(option) => onChange([...option])}
      bindToBody
      data-cy="homepage-filter"
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
