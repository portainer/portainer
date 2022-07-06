import { CellProps, Column } from 'react-table';

import { ContainerGroup } from '@/react/azure/types';

import { Link } from '@@/Link';

export const name: Column<ContainerGroup> = {
  Header: 'Name',
  accessor: (container) => container.name,
  id: 'name',
  Cell: NameCell,
  disableFilters: true,
  Filter: () => null,
  canHide: true,
  sortType: 'string',
};

export function NameCell({
  value: name,
  row: { original: container },
}: CellProps<ContainerGroup, string>) {
  return (
    <Link
      to="azure.containerinstances.container"
      params={{ id: container.id }}
      className="hover:underline"
    >
      {name}
    </Link>
  );
}
