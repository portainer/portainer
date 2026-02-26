import clsx from 'clsx';
import { useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { truncate } from 'lodash';

import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { isSortType } from '@/react/portainer/environments/queries/useEnvironmentList';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Datatable } from '@@/datatables';
import { useTableStateWithoutStorage } from '@@/datatables/useTableState';
import { withControlledSelected } from '@@/datatables/extend-options/withControlledSelected';
import { TableRow } from '@@/datatables/TableRow';
import { Sheet, SheetContent, SheetClose, SheetHeader } from '@@/Sheet';
import { Button, LoadingButton } from '@@/buttons';

import { EnvironmentTableData } from './types';

const columnHelper = createColumnHelper<EnvironmentTableData>();

const columns = [
  columnHelper.accessor('Name', {
    header: 'Name',
    id: 'Name',
    cell: ({ getValue }) => (
      <span title={getValue()}>{truncate(getValue(), { length: 64 })}</span>
    ),
  }),
];

interface Props {
  open: boolean;
  onClose(): void;
  /** IDs already in the group — excluded from the available list */
  excludeIds: EnvironmentId[];
  /** Called with the full env objects so callers can display names or extract IDs.
   *  Returns true if the add was committed, false if the user cancelled. */
  onAdd:
    | ((envs: EnvironmentTableData[]) => Promise<boolean>)
    | ((envs: EnvironmentTableData[]) => void);
  /** Loading state from the parent — disables buttons and shows spinner */
  isLoading?: boolean;
}

export function AddEnvironmentsDrawer({
  open,
  onClose,
  excludeIds,
  onAdd,
  isLoading,
}: Props) {
  const tableState = useTableStateWithoutStorage('Name');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedEnvs, setSelectedEnvs] = useState<EnvironmentTableData[]>([]);
  const [page, setPage] = useState(0);

  const {
    environments,
    totalCount,
    isLoading: isEnvsLoading,
  } = useEnvironmentList({
    pageLimit: tableState.pageSize,
    page: page + 1,
    search: tableState.search,
    sort: isSortType(tableState.sortBy?.id) ? tableState.sortBy.id : 'Name',
    order: tableState.sortBy?.desc ? 'desc' : 'asc',
    groupIds: [1],
    excludeIds,
  });

  function handleSelectionChange(ids: string[]) {
    setSelectedIds(ids);
    const currentDataMap = new Map(
      (environments ?? []).map((env) => [String(env.Id), env])
    );
    setSelectedEnvs((prev) => {
      const prevMap = new Map(prev.map((e) => [String(e.Id), e]));
      // Keep already-tracked envs that remain selected
      const kept = prev.filter((e) => ids.includes(String(e.Id)));
      // Add newly selected envs from the current page
      const added = ids
        .filter((id) => !prevMap.has(id) && currentDataMap.has(id))
        .map((id) => currentDataMap.get(id)!);
      return [...kept, ...added];
    });
  }

  async function handleAdd() {
    const committed = await onAdd(selectedEnvs);
    // Close only if the add was committed or there was no confirmation needed
    if (committed || committed === undefined) {
      resetSelection();
      onClose();
    }
  }

  function resetSelection() {
    setSelectedIds([]);
    setSelectedEnvs([]);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetSelection();
          onClose();
        }
      }}
    >
      <SheetContent className="flex flex-col !p-0">
        <div className="flex-1 p-4 overflow-auto">
          <SheetHeader title="Add environments" />
          <Datatable<EnvironmentTableData>
            title="Available environments"
            columns={columns}
            dataset={environments ?? []}
            settingsManager={tableState}
            isLoading={isEnvsLoading}
            isServerSidePagination
            page={page}
            onPageChange={setPage}
            totalCount={totalCount}
            getRowId={(row) => String(row.Id)}
            renderRow={(row) => (
              <TableRow<EnvironmentTableData>
                cells={row.getVisibleCells()}
                onClick={() => row.toggleSelected()}
                className={clsx({ active: row.getIsSelected() })}
                aria-selected={row.getIsSelected()}
              />
            )}
            extendTableOptions={withControlledSelected(
              handleSelectionChange,
              selectedIds
            )}
            data-cy="add-environments-drawer-table"
          />
        </div>
        {/* Don't use StickyFooter here. StickyFooter has classes for the menu to the left that we don't want here */}
        <div
          className={clsx(
            'bottom-0 left-0 right-0 w-full z-50 h-16 sticky justify-end gap-4',
            'flex items-center px-6',
            'bg-[var(--bg-widget-color)] border-t border-[var(--border-widget-color)]',
            'shadow-[0_-2px_5px_rgba(0,0,0,0.1)]'
          )}
        >
          <SheetClose asChild>
            <Button
              color="default"
              disabled={isLoading}
              data-cy="add-environments-cancel-button"
              size="medium"
            >
              Cancel
            </Button>
          </SheetClose>
          <LoadingButton
            onClick={handleAdd}
            disabled={selectedIds.length === 0 || isLoading}
            isLoading={!!isLoading}
            loadingText="Adding..."
            data-cy="add-environments-confirm-button"
            size="medium"
          >
            Confirm
          </LoadingButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
