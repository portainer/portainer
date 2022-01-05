import { CellProps, Column, TableInstance } from 'react-table';

import { Environment } from "@/portainer/environments/types";

export const name: Column<Environment> = {
  Header: 'Name',
  accessor: (row) => row.Name,
  id: 'name',
  Cell: NameCell,
  disableFilters: true,
  Filter: () => null,
  canHide: true,
  sortType: 'string',
};

export function NameCell({
  value: name,
}: CellProps<TableInstance>) {

  return <span>{name}</span>;
}
