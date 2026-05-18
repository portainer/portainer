import { ReactNode } from 'react';
import clsx from 'clsx';

import { AutomationTestingProps } from '@/types';

import { SearchBar } from '@@/datatables/SearchBar';

import { DropdownOption } from '../DropdownMenu/DropdownMenu';

import { SortByGroup, SortOption } from './SortByGroup';

export type { SortOption };

interface Props<TSortKey extends string> {
  sortDesc: boolean;
  value: { group: TSortKey; groupValue: string | null };
  onChange: (value: { group: TSortKey; groupValue: string | null }) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortOptions: SortOption<TSortKey>[];
  searchPlaceholder?: string;
  actionButton?: ReactNode;
  groupOptions?: Record<string, DropdownOption[]>;
  headerButtons?: ReactNode;
}

export function SortableListHeader<TSortKey extends string>({
  sortDesc,
  value,
  onChange,
  searchTerm,
  onSearchChange,
  sortOptions,
  searchPlaceholder = 'Filter...',
  actionButton,
  groupOptions,
  headerButtons,
  'data-cy': dataCy,
}: Props<TSortKey> & AutomationTestingProps) {
  return (
    <div
      className={clsx(
        'flex flex-wrap items-center justify-between gap-3 px-5 py-3',
        'bg-gray-2 th-highcontrast:bg-black th-dark:bg-gray-iron-10'
      )}
    >
      <SortByGroup
        value={value}
        sortDesc={sortDesc}
        onChange={onChange}
        sortOptions={sortOptions}
        groupOptions={groupOptions}
        dataCy={`${dataCy}-sort`}
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
