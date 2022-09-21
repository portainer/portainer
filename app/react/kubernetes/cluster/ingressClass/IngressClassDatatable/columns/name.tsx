import { CellProps, Column } from 'react-table';

import { Badge } from '@@/Badge';

import type { IngressControllerClassMap } from '../../types';

export const name: Column<IngressControllerClassMap> = {
  Header: 'Ingress class',
  accessor: 'ClassName',
  Cell: NameCell,
  id: 'name',
  disableFilters: true,
  canHide: true,
  Filter: () => null,
  sortType: 'string',
};

function NameCell({ row }: CellProps<IngressControllerClassMap>) {
  return (
    <span className="flex flex-nowrap">
      {row.original.ClassName}
      {row.original.New && <Badge className="ml-1">Newly detected</Badge>}
    </span>
  );
}
