import { CellProps, Column, TableInstance } from 'react-table';

import { Checkbox } from '@/portainer/components/form-components/Checkbox';

function SelectionHeader<
  D extends Record<string, unknown> = Record<string, unknown>
>({ getToggleAllRowsSelectedProps }: TableInstance<D>) {
  const {
    checked,
    className,
    indeterminate,
    onChange,
    role,
    style,
    title,
  } = getToggleAllRowsSelectedProps();
  return (
    <Checkbox
      checked={checked}
      className={className}
      indeterminate={indeterminate}
      onChange={onChange}
      role={role}
      style={style}
      title={title}
      id="select_all"
    />
  );
}

function SelectionCell<
  D extends Record<string, unknown> = Record<string, unknown>
>({ row }: CellProps<D>) {
  const {
    checked,
    className,
    indeterminate,
    onChange,
    role,
    style,
    title,
  } = row.getToggleRowSelectedProps();

  return (
    <Checkbox
      id={`selection_${row.id}`}
      checked={checked}
      className={className}
      indeterminate={indeterminate}
      onChange={onChange}
      role={role}
      style={style}
      title={title}
    />
  );
}

export function buildSelectionColumn<
  D extends Record<string, unknown> = Record<string, unknown>
>(): Column<D> {
  return {
    id: 'selection',
    Header: SelectionHeader,
    Cell: SelectionCell,
    className: 'selection',
    disableFilters: true,
    disableSortBy: true,
    disableGlobalFilter: true,
  };
}
