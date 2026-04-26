import { ReactNode } from 'react';
import clsx from 'clsx';

import { AutomationTestingProps } from '@/types';

import { SearchBar } from '@@/datatables/SearchBar';

import { DropdownOption } from '../DropdownMenu/DropdownMenu';

import { SortByGroup, SortOption } from './SortByGroup';

export type { SortOption };

interface Props<TSortKey extends string> {
  sortBy: TSortKey;
  onSortChange: (key: TSortKey) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortOptions: SortOption<TSortKey>[];
  searchPlaceholder?: string;
  actionButton?: ReactNode;
  groupFilter: string | null;
  groupOptions?: Record<string, DropdownOption[]>;
  onGroupFilterChange: (value: string | null) => void;
  headerButtons?: ReactNode;
}

export function GroupSortTableHeader<TSortKey extends string>({
  sortBy,
  onSortChange,
  searchTerm,
  onSearchChange,
  sortOptions,
  searchPlaceholder = 'Filter...',
  actionButton,
  groupFilter,
  groupOptions,
  onGroupFilterChange,
  headerButtons,
  'data-cy': dataCy,
}: Props<TSortKey> & AutomationTestingProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-3 px-5 py-3',
        'bg-gray-2 th-highcontrast:bg-black th-dark:bg-gray-iron-10',
        'border-0 border-b border-solid border-gray-5 th-dark:border-gray-9'
      )}
    >
      <SortByGroup
        sortBy={sortBy}
        onSortChange={onSortChange}
        sortOptions={sortOptions}
        groupFilter={groupFilter}
        groupOptions={groupOptions}
        onGroupFilterChange={onGroupFilterChange}
        dataCy={dataCy}
      />
      <div className="ml-auto flex items-center gap-2">
        {headerButtons}
        <SearchBar
          value={searchTerm}
          placeholder={searchPlaceholder}
          onChange={onSearchChange}
          data-cy={`${dataCy}-search`}
          className={clsx(
            'rounded-md border border-solid border-gray-4',
            'bg-white py-2 pl-9 pr-3 text-sm text-gray-10 placeholder-gray-6',
            'focus:border-blue-6 focus:outline-none',
            'th-dark:border-gray-7 th-dark:bg-gray-iron-10 th-dark:text-white th-dark:placeholder-gray-7',
            'th-highcontrast:border-white th-highcontrast:bg-black th-highcontrast:text-white th-highcontrast:placeholder-gray-4 th-highcontrast:focus:border-blue-8'
          )}
        />
        {actionButton}
      </div>
    </div>
  );
}
