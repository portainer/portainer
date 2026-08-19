import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    filter?: Filter<TData, TValue>;
    width?: number | 'auto' | string;
    minWidth?: string;
  }
}
