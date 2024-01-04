import { CellContext } from '@tanstack/react-table';

import { Badge } from '@@/Badge';

import type { IngressControllerClassMap } from '../../types';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('ClassName', {
  header: 'Ingress class',
  cell: NameCell,
  id: 'name',
});

function NameCell({
  row,
  getValue,
}: CellContext<IngressControllerClassMap, string>) {
  const className = getValue();

  return (
    <span className="flex flex-nowrap">
      {className}
      {row.original.New && <Badge className="ml-1">Newly detected</Badge>}
    </span>
  );
}
