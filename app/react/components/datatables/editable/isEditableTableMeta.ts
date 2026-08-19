import { RowData } from '@tanstack/react-table';

interface EditableTableMeta<TData extends RowData> {
  getEditableRow: () => number;
  getEditableRowOriginalData: () => TData | undefined;
  editRow: (rowIndex: number, row: TData | undefined) => void;
  updateRow: (rowIndex: number, row: TData | undefined) => void;
  revertRow: (rowIndex: number) => void;
  acceptRow: (rowIndex: number) => void;
}

export function isEditableTableMeta<TData extends RowData>(
  meta?: unknown
): meta is EditableTableMeta<TData> {
  return (
    !!meta &&
    typeof meta === 'object' &&
    'getEditableRow' in meta &&
    'getEditableRowOriginalData' in meta &&
    'editRow' in meta &&
    'updateRow' in meta &&
    'revertRow' in meta &&
    'acceptRow' in meta
  );
}
