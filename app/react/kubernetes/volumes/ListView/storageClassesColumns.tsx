import { createColumnHelper } from '@tanstack/react-table';
import { Star } from 'lucide-react';
import { slugify } from 'markdown-to-jsx';

import { formatDate } from '@/portainer/filters/filters';

import { Badge } from '@@/Badge';
import { Link } from '@@/Link';
import { Button } from '@@/buttons';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';
import { Icon } from '@@/Icon';

import { StorageClass } from './types';

const helper = createColumnHelper<StorageClass>();

export function createStorageClassesColumns(
  onSetDefault: (storageClass: StorageClass) => void
) {
  return [
    helper.accessor('name', {
      header: 'Name',
      cell: ({ row, getValue }) => {
        const name = getValue();
        return (
          <div className="flex items-center gap-2">
            <Link
              to="kubernetes.volumes.storageClass"
              params={{ name }}
              data-cy={`storage-class-name-link-${name}`}
            >
              {name}
            </Link>
            {row.original.isDefault && <Badge type="success">Default</Badge>}
          </div>
        );
      },
    }),
    helper.accessor('provisioner', {
      header: 'Provisioner',
    }),
    helper.accessor('reclaimPolicy', {
      header: 'Reclaim policy',
      cell: ({ getValue }) => getValue() ?? '-',
    }),
    helper.accessor('allowVolumeExpansion', {
      header: 'Volume expansion',
      cell: ({ getValue }) => (getValue() ? 'Allowed' : 'Disallowed'),
    }),
    helper.accessor((row) => formatDate(row.creationDate), {
      header: 'Created',
      id: 'created',
    }),
    helper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row: { original } }) => (
        <TooltipWithChildren
          message={
            original.isDefault ? 'Already the default' : 'Set as default'
          }
          position="top"
        >
          <Button
            color="light"
            className="!ml-0"
            disabled={original.isDefault}
            data-cy={`k8s-storage-class-set-default-${slugify(original.name)}`}
            onClick={() => onSetDefault(original)}
          >
            <Icon icon={Star} />
          </Button>
        </TooltipWithChildren>
      ),
    }),
  ];
}
