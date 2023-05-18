import { CellContext, ColumnDef } from '@tanstack/react-table';

import { ownershipIcon } from '@/portainer/filters/filters';
import { ResourceControlOwnership } from '@/react/portainer/access-control/types';

import { Icon } from '@@/Icon';

export interface IResource {
  ResourceControl?: {
    Ownership: ResourceControlOwnership;
  };
}

export function createOwnershipColumn<D extends IResource>(): ColumnDef<
  D,
  ResourceControlOwnership
> {
  return {
    accessorFn: (row) =>
      row.ResourceControl?.Ownership || ResourceControlOwnership.ADMINISTRATORS,
    header: 'Ownership',
    id: 'ownership',
    cell: OwnershipCell,
  };

  function OwnershipCell({
    getValue,
  }: CellContext<D, ResourceControlOwnership>) {
    const value = getValue();

    return (
      <span className="flex items-center gap-2">
        <Icon icon={ownershipIcon(value)} className="space-right" />
        {value}
      </span>
    );
  }
}
