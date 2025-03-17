import { ColumnDef, Row, Table } from '@tanstack/react-table';

import { Checkbox } from '@@/form-components/Checkbox';

function allRowsSelected<T>(table: Table<T>) {
  const { rows } = table.getCoreRowModel();
  return rows.length > 0 && rows.every((row) => row.getIsSelected());
}

function someRowsSelected<T>(table: Table<T>) {
  return table.getCoreRowModel().rows.some((row) => row.getIsSelected());
}

function somePageRowsSelected<T>(table: Table<T>) {
  return table.getRowModel().rows.some((row) => row.getIsSelected());
}

export function createSelectColumn<T>(dataCy: string): ColumnDef<T> {
  let lastSelectedId = '';

  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        id="select-all"
        data-cy={`select-all-checkbox-${dataCy}`}
        checked={allRowsSelected(table)}
        indeterminate={!allRowsSelected(table) && someRowsSelected(table)}
        onChange={(e) => {
          // Select all rows if shift key is held down, otherwise only page rows
          if (e.nativeEvent instanceof MouseEvent && e.nativeEvent.shiftKey) {
            table.toggleAllRowsSelected();
            return;
          }
          table.toggleAllPageRowsSelected(!somePageRowsSelected(table));
        }}
        disabled={table.getRowModel().rows.every((row) => !row.getCanSelect())}
        onClick={(e) => {
          e.stopPropagation();
        }}
        aria-label="Select all rows"
        title="Select all rows. Hold shift key to select across all pages."
      />
    ),
    cell: ({ row, table }) => (
      <Checkbox
        id={`select-row-${row.id}`}
        data-cy={`select-row-checkbox_${row.id}`}
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
        aria-label="Select row"
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
