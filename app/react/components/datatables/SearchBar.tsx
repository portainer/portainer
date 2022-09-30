import { Search } from 'react-feather';
import { useEffect, useMemo, useState } from 'react';
import _ from 'lodash';

import { useLocalStorage } from '@/portainer/hooks/useLocalStorage';
import { AutomationTestingProps } from '@/types';

interface Props extends AutomationTestingProps {
  value: string;
  placeholder?: string;
  onChange(value: string): void;
}

export function SearchBar({
  value,
  placeholder = 'Search...',
  onChange,
  'data-cy': dataCy,
}: Props) {
  const [searchValue, setSearchValue] = useDebounce(value, onChange);

  return (
    <div className="searchBar items-center flex min-w-[90px]">
      <Search className="searchIcon feather shrink-0" />
      <input
        type="text"
        className="searchInput"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder={placeholder}
        data-cy={dataCy}
      />
    </div>
  );
}

function useDebounce(defaultValue: string, onChange: (value: string) => void) {
  const [searchValue, setSearchValue] = useState(defaultValue);

  useEffect(() => {
    setSearchValue(defaultValue);
  }, [defaultValue]);

  const onChangeDebounces = useMemo(
    () => _.debounce(onChange, 300),
    [onChange]
  );

  return [searchValue, handleChange] as const;

  function handleChange(value: string) {
    setSearchValue(value);
    onChangeDebounces(value);
  }
}

export function useSearchBarState(
  key: string
): [string, (value: string) => void] {
  const filterKey = keyBuilder(key);
  const [value, setValue] = useLocalStorage(filterKey, '', sessionStorage);

  return [value, setValue];

  function keyBuilder(key: string) {
    return `datatable_text_filter_${key}`;
  }
}
