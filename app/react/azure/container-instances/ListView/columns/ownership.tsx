import { Column } from 'react-table';
import clsx from 'clsx';

import { ownershipIcon } from '@/portainer/filters/filters';
import { ResourceControlOwnership } from '@/react/portainer/access-control/types';
import { ContainerGroup } from '@/react/azure/types';
import { determineOwnership } from '@/react/portainer/access-control/models/ResourceControlViewModel';

export const ownership: Column<ContainerGroup> = {
  Header: 'Ownership',
  id: 'ownership',
  accessor: (row) =>
    row.Portainer && row.Portainer.ResourceControl
      ? determineOwnership(row.Portainer.ResourceControl)
      : ResourceControlOwnership.ADMINISTRATORS,
  Cell: OwnershipCell,
  disableFilters: true,
  canHide: true,
  sortType: 'string',
  Filter: () => null,
};

interface Props {
  value: 'public' | 'private' | 'restricted' | 'administrators';
}

function OwnershipCell({ value }: Props) {
  return (
    <>
      <i
        className={clsx(ownershipIcon(value), 'space-right')}
        aria-hidden="true"
      />
      {value}
    </>
  );
}
