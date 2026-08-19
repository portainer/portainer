import { createColumnHelper } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

import { Button } from '@@/buttons';
import {
  NEW_ROW_ID,
  UNSET_EDITABLE_ROW,
} from '@@/datatables/editable/EditableDatatable';
import { isEditableTableMeta } from '@@/datatables/editable/isEditableTableMeta';

function defaultIsNewRow(row: unknown): boolean {
  if (
    !row ||
    typeof row !== 'object' ||
    !('Id' in row) ||
    typeof row.Id !== 'number'
  ) {
    // set custom isNewRow function if object does not use `Id`
    return false;
  }
  return isIdForNewRow(row.Id);
}

export function isIdForNewRow(id: number) {
  return id <= NEW_ROW_ID;
}

export function actionsColumn<T>(
  onRemove: (item: T) => void,
  isNewRow: (row: T) => boolean = defaultIsNewRow
) {
  const columnHelper = createColumnHelper<T>();

  return columnHelper.accessor(() => '', {
    header: 'Actions',
    id: 'actions',
    enableSorting: false,
    cell: ({ row: { original, index }, table }) => {
      if (!isEditableTableMeta(table.options.meta)) {
        throw new Error(
          'actionsColumn() should be used within the EditableDatatable component'
        );
      }

      const {
        editRow,
        updateRow,
        getEditableRow,
        getEditableRowOriginalData,
        revertRow,
        acceptRow,
      } = table.options.meta;
      const editableRowIndex = getEditableRow();

      return index === editableRowIndex || isNewRow(original) ? (
        <EditActionsCell
          acceptRow={() => {
            if (isNewRow(original)) {
              acceptRow(index);
            } else {
              editRow(UNSET_EDITABLE_ROW, undefined);
            }
          }}
          revertRow={() => {
            if (isNewRow(original)) {
              revertRow(index);
            } else {
              updateRow(index, getEditableRowOriginalData());
              editRow(UNSET_EDITABLE_ROW, undefined);
            }
          }}
        />
      ) : (
        <ActionsCell<T>
          onRemove={onRemove}
          editableRow={editableRowIndex}
          editRow={editRow}
          row={original}
          rowIndex={index}
        />
      );
    },
  });
}

function ActionsCell<T>({
  onRemove,
  editRow,
  editableRow,
  row,
  rowIndex,
}: {
  onRemove: (item: T) => void;
  editRow: (index: number, original: T | undefined) => void;
  editableRow: number;
  row: T;
  rowIndex: number;
}) {
  return (
    <div className="flex justify-center gap-x-2">
      <Button
        color="light"
        size="small"
        onClick={() => {
          editRow(rowIndex, row);
        }}
        disabled={editableRow !== -1}
        data-cy="edit-access-button"
      >
        Edit
      </Button>
      <Button
        color="dangerlight"
        size="small"
        icon={Trash2}
        onClick={() => onRemove(row)}
        data-cy="remove-access-button"
      >
        Remove
      </Button>
    </div>
  );
}

function EditActionsCell({
  acceptRow,
  revertRow,
}: {
  acceptRow: () => void;
  revertRow: () => void;
}) {
  return (
    <div className="flex justify-center gap-x-2">
      <Button
        color="light"
        size="small"
        onClick={() => acceptRow()}
        data-cy="edit-access-button"
      >
        Accept
      </Button>
      <Button
        color="dangerlight"
        size="small"
        onClick={() => revertRow()}
        data-cy="remove-access-button"
      >
        Revert
      </Button>
    </div>
  );
}
