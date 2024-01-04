import clsx from 'clsx';
import { CellContext } from '@tanstack/react-table';

import { ResourceControlOwnership } from '@/react/portainer/access-control/types';
import { ContainerGroup } from '@/react/azure/types';
import { determineOwnership } from '@/react/portainer/access-control/models/ResourceControlViewModel';
import { ownershipIcon } from '@/react/docker/components/datatable/createOwnershipColumn';

import { columnHelper } from './helper';

export const ownership = columnHelper.accessor(
  (row) =>
    row.Portainer && row.Portainer.ResourceControl
      ? determineOwnership(row.Portainer.ResourceControl)
      : ResourceControlOwnership.ADMINISTRATORS,
  {
    header: 'Ownership',
    cell: OwnershipCell,
    id: 'ownership',
  }
);

function OwnershipCell({
  getValue,
}: CellContext<ContainerGroup, ResourceControlOwnership>) {
  const value = getValue();

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
