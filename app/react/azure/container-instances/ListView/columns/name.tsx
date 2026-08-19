import { CellContext } from '@tanstack/react-table';

import { ContainerGroup } from '@/react/azure/types';

import { Link } from '@@/Link';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('name', {
  header: 'Name',
  cell: NameCell,
});

export function NameCell({
  getValue,
  row: { original: container },
}: CellContext<ContainerGroup, string>) {
  const name = getValue();
  return (
    <Link
      to="azure.containerinstances.container"
      params={{ id: container.id }}
      className="hover:underline"
      data-cy={`aci-container-${container.id}`}
    >
      {name}
    </Link>
  );
}
