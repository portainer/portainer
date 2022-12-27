import '@tanstack/react-table';

declare module '@tanstack/table-core' {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    filter?: Filter<TData, TValue>;
    width?: number | 'auto' | string;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    isEdit(rowId): boolean;
    setIsEdit(rowId, isEdit: boolean): void;
    onRename: (oldName: string, newName: string) => void;
    onBrowse: (name: string) => void;
    onDownload: (fileName: string) => void;
    onDelete: (fileName: string) => void;
  }
}
