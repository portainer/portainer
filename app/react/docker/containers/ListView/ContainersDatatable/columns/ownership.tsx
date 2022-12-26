import { CellContext } from '@tanstack/react-table';
import clsx from 'clsx';

import { ownershipIcon } from '@/portainer/filters/filters';
import type { DockerContainer } from '@/react/docker/containers/types';
import { ResourceControlOwnership } from '@/react/portainer/access-control/types';

import { columnHelper } from './helper';

export const ownership = columnHelper.accessor(
  (row) =>
    row.ResourceControl?.Ownership || ResourceControlOwnership.ADMINISTRATORS,
  {
    header: 'Ownership',
    id: 'ownership',
    cell: OwnershipCell,
  }
);

function OwnershipCell({
  getValue,
}: CellContext<DockerContainer, ResourceControlOwnership>) {
  const value = getValue();

  return (
    <>
      <i
        className={clsx(ownershipIcon(value), 'space-right')}
        aria-hidden="true"
      />
      {value || ResourceControlOwnership.ADMINISTRATORS}
    </>
  );
}
