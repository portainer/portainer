import { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';

import { useLocalStorage } from '@/react/hooks/useLocalStorage';
import { AutomationTestingProps } from '@/types';
import { useDebounce } from '@/react/hooks/useDebounce';

import { Button } from '@@/buttons';

interface Props extends AutomationTestingProps {
  value: string;
  placeholder?: string;
  onChange(value: string): void;
  className?: string;
  children?: ReactNode;
}

export function SearchBar({
  value,
  placeholder = 'Search...',
  onChange,
  'data-cy': dataCy,
  className,
  children,
}: Props) {
  const [searchValue, setSearchValue] = useDebounce(value, onChange);

  function onClear() {
    setSearchValue('');
  }

  return (
    <div
      className={clsx('searchBar flex min-w-[90px] items-center', className)}
    >
      <Search className="searchIcon lucide shrink-0" />
      <input
        type="text"
        data-cy={dataCy}
        className="searchInput"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search input"
      />
      {children}
      <Button
        onClick={onClear}
        icon={X}
        color="none"
        disabled={!searchValue}
        data-cy={`${dataCy}-clear-button`}
      />
    </div>
  );
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
