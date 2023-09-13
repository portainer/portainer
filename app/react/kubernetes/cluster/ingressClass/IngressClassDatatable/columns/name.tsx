import { CellContext } from '@tanstack/react-table';

import { Badge } from '@@/Badge';

import type { IngressControllerClassMapRowData } from '../../types';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('ClassName', {
  header: 'Ingress class',
  cell: NameCell,
  id: 'name',
});

function NameCell({
  row,
  getValue,
}: CellContext<IngressControllerClassMapRowData, string>) {
  const className = getValue();

  return (
    <span className="flex flex-nowrap">
      {className}
      {row.original.New && <Badge className="ml-1">Newly detected</Badge>}
    </span>
  );
}
