import { Column } from 'react-table';
import clsx from 'clsx';

import { ownershipIcon } from '@/portainer/filters/filters';
import { ResourceControlOwnership } from '@/portainer/models/resourceControl/resourceControlOwnership';
import type { DockerContainer } from '@/docker/containers/types';

export const ownership: Column<DockerContainer> = {
  Header: 'Ownership',
  id: 'ownership',
  accessor: (row) => row.ResourceControl?.Ownership,
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
      {value || ResourceControlOwnership.ADMINISTRATORS}
    </>
  );
}
