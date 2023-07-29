import { ColumnDef, Row } from '@tanstack/react-table';

import { Checkbox } from '@@/form-components/Checkbox';

export function createSelectColumn<T>(): ColumnDef<T> {
  let lastSelectedId = '';

  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        id="select-all"
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
        disabled={table.getRowModel().rows.every((row) => !row.getCanSelect())}
        onClick={(e) => {
          e.stopPropagation();
        }}
      />
    ),
    cell: ({ row, table }) => (
      <Checkbox
        id={`select-row-${row.id}`}
        checked={row.getIsSelected()}
        indeterminate={row.getIsSomeSelected()}
        onChange={row.getToggleSelectedHandler()}
        disabled={!row.getCanSelect()}
        onClick={(e) => {
          e.stopPropagation();

          if (e.shiftKey) {
            const { rows, rowsById } = table.getRowModel();
            const rowsToToggle = getRowRange(rows, row.id, lastSelectedId);
            const isLastSelected = rowsById[lastSelectedId].getIsSelected();
            rowsToToggle.forEach((row) => row.toggleSelected(isLastSelected));
          }

          lastSelectedId = row.id;
        }}
      />
    ),
    enableHiding: false,
    meta: {
      width: 50,
    },
  };
}

function getRowRange<T>(rows: Array<Row<T>>, idA: string, idB: string) {
  const range: Array<Row<T>> = [];
  let foundStart = false;
  let foundEnd = false;
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.id === idA || row.id === idB) {
      if (foundStart) {
        foundEnd = true;
      }
      if (!foundStart) {
        foundStart = true;
      }
    }

    if (foundStart) {
      range.push(row);
    }

    if (foundEnd) {
      break;
    }
  }

  return range;
}
