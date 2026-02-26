import { createColumnHelper } from '@tanstack/react-table';
import { truncate } from 'lodash';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import clsx from 'clsx';

import { AutomationTestingProps } from '@/types';

import { useTableStateWithoutStorage } from '@@/datatables/useTableState';
import { Datatable } from '@@/datatables';
import { withControlledSelected } from '@@/datatables/extend-options/withControlledSelected';
import { TableRow } from '@@/datatables/TableRow';
import { DeleteButton } from '@@/buttons/DeleteButton';
import { Button } from '@@/buttons';

import { EnvironmentTableData } from './types';

const columnHelper = createColumnHelper<EnvironmentTableData>();

interface Props extends AutomationTestingProps {
  title: string;
  environments: Array<EnvironmentTableData>;
  onRemove(selected: EnvironmentTableData[]): void;
  onOpenAddDrawer(): void;
  isRemoving?: boolean;
  isLoading?: boolean;
  /** When false, Remove fires immediately without a confirmation dialog (e.g. create mode) */
  confirmRemove?: boolean;
  /** When true, don't show the add/remove buttons and hide the checkbox */
  readOnly?: boolean;
}

export function AssociatedEnvironmentsTable({
  title,
  environments,
  onRemove,
  onOpenAddDrawer,
  isRemoving,
  isLoading,
  confirmRemove = true,
  readOnly = false,
  'data-cy': dataCy,
}: Props) {
  const tableState = useTableStateWithoutStorage('Name');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const columns = useMemo(() => buildColumns(), []);

  return (
    // avoid padding issues with the widget
    <div className="-mx-[15px]">
      <Datatable<EnvironmentTableData>
        disableSelect={readOnly}
        isLoading={isLoading}
        title={title}
        columns={columns}
        settingsManager={tableState}
        dataset={environments}
        getRowId={(row) => String(row.Id)}
        renderRow={(row) => (
          <TableRow<EnvironmentTableData>
            cells={row.getVisibleCells()}
            onClick={() => row.toggleSelected()}
            className={clsx({ active: row.getIsSelected() })}
            aria-selected={row.getIsSelected()}
          />
        )}
        extendTableOptions={withControlledSelected(setSelectedIds, selectedIds)}
        renderTableActions={(selectedItems) =>
          readOnly ? null : (
            <>
              {confirmRemove ? (
                <DeleteButton
                  disabled={selectedItems.length === 0}
                  isLoading={isRemoving}
                  confirmMessage="Are you sure you want to remove the selected environment(s) from this group?"
                  onConfirmed={() => handleRemove(selectedItems)}
                  data-cy="remove-environments-button"
                  type="button"
                />
              ) : (
                <DeleteButton
                  disabled={selectedItems.length === 0}
                  onClick={() => {
                    handleRemove(selectedItems);
                  }}
                  data-cy="remove-environments-button"
                  type="button"
                />
              )}
              <Button
                icon={Plus}
                onClick={onOpenAddDrawer}
                data-cy="add-environments-button"
              >
                Add
              </Button>
            </>
          )
        }
        data-cy={dataCy || 'environment-table'}
      />
    </div>
  );

  function handleRemove(selectedItems: EnvironmentTableData[]) {
    onRemove(selectedItems);
    setSelectedIds([]);
  }
}

function buildColumns() {
  return [
    columnHelper.accessor('Name', {
      header: 'Name',
      id: 'Name',
      cell: ({ getValue }) => (
        <span title={getValue()}>{truncate(getValue(), { length: 64 })}</span>
      ),
    }),
  ];
}
