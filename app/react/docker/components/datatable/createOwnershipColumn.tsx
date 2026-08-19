import { CellContext, ColumnDef } from '@tanstack/react-table';
import { Eye, EyeOff, Users } from 'lucide-react';

import { ResourceControlOwnership } from '@/react/portainer/access-control/types';

import { Icon } from '@@/Icon';

export interface IResource {
  ResourceControl?: {
    Ownership: ResourceControlOwnership;
  };
}

export function createOwnershipColumn<D extends IResource>(
  enableHiding = true
): ColumnDef<D, ResourceControlOwnership> {
  return {
    accessorFn: (row) =>
      row.ResourceControl?.Ownership || ResourceControlOwnership.ADMINISTRATORS,
    header: 'Ownership',
    id: 'ownership',
    cell: OwnershipCell,
    enableHiding,
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

export function ownershipIcon(ownership: ResourceControlOwnership) {
  switch (ownership) {
    case ResourceControlOwnership.PRIVATE:
      return EyeOff;
    case ResourceControlOwnership.ADMINISTRATORS:
      return EyeOff;
    case ResourceControlOwnership.RESTRICTED:
      return Users;
    default:
      return Eye;
  }
}
