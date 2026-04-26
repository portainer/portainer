import '@@/datatables/datatable.css';

import { ReactNode } from 'react';

import { AutomationTestingProps } from '@/types';

import {
  SortOption,
  GroupSortTableHeader,
} from '../GroupSortTable/GroupSortTableHeader';
import { DropdownOption } from '../DropdownMenu/DropdownMenu';

import { SortableGroup } from './SortableListGroup';
import { SortableListBody } from './SortableListBody';
import { SortableListCard } from './SortableListCard';
import { SortableListPager } from './SortableListPager';
import { SortableListState } from './sortable-list.store';

export type { SortableGroup };
export type { SortableListState };
export type { SortOption };

interface Props<T> extends AutomationTestingProps {
  tableState: SortableListState;
  sortOptions: SortOption[];
  groupOptions?: Record<string, DropdownOption[]>;
  groups: SortableGroup<T>[];
  totalCount: number;
  renderItem: (item: T, index: number) => ReactNode;
  renderColumnHeaders?: (groupKey: string, items: T[]) => ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  showGroupHeaders?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
  actionButton?: ReactNode;
  isLoading?: boolean;
}

export function SortableList<T>({
  tableState,
  sortOptions,
  groupOptions,
  groups,
  totalCount,
  renderItem,
  renderColumnHeaders,
  getItemKey,
  showGroupHeaders = true,
  emptyMessage = 'No items found',
  searchPlaceholder,
  actionButton,
  isLoading = false,
  'data-cy': dataCy,
}: Props<T>) {
  const activeSortKey = tableState.sortBy?.id ?? sortOptions[0]?.key ?? '';

  return (
    <SortableListCard>
      <GroupSortTableHeader
        sortBy={activeSortKey}
        onSortChange={(key) => {
          tableState.setSortBy(key, false);
        }}
        searchTerm={tableState.search}
        onSearchChange={(value) => {
          tableState.setSearch(value);
        }}
        groupFilter={tableState.groupFilter}
        onGroupFilterChange={(value) => {
          tableState.setGroupFilter(value);
        }}
        groupOptions={groupOptions}
        sortOptions={sortOptions}
        searchPlaceholder={searchPlaceholder}
        actionButton={actionButton}
        data-cy={`${dataCy}-header`}
      />

      <div className="overflow-y-auto">
        <SortableListBody
          isLoading={isLoading}
          groups={groups}
          showGroupHeaders={
            showGroupHeaders && (groupOptions?.[activeSortKey]?.length ?? 0) > 0
          }
          renderItem={renderItem}
          renderColumnHeaders={renderColumnHeaders}
          getItemKey={getItemKey}
          emptyMessage={emptyMessage}
        />
      </div>

      <SortableListPager
        page={tableState.page}
        pageSize={tableState.pageSize}
        totalCount={totalCount}
        onPageChange={tableState.setPage}
        onPageSizeChange={tableState.setPageSize}
      />
    </SortableListCard>
  );
}
