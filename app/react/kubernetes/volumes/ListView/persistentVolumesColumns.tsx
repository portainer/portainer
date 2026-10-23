import { createColumnHelper } from '@tanstack/react-table';
import { Edit } from 'lucide-react';
import { slugify } from 'markdown-to-jsx';

import { formatDate } from '@/portainer/filters/filters';

import { StatusBadge, StatusBadgeType } from '@@/StatusBadge';
import { Link } from '@@/Link';
import { Button } from '@@/buttons';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';
import { Icon } from '@@/Icon';

import { PersistentVolume, PersistentVolumeStatus } from './types';

const helper = createColumnHelper<PersistentVolume>();

export function createPersistentVolumesColumns(
  onEditReclaimPolicy: (volume: PersistentVolume) => void
) {
  return [
    helper.accessor('name', {
      header: 'Name',
      cell: ({ getValue }) => {
        const name = getValue();
        return (
          <Link
            to="kubernetes.volumes.persistentVolume"
            params={{ name }}
            data-cy={`persistent-volume-name-link-${name}`}
          >
            {name}
          </Link>
        );
      },
    }),
    helper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue();
        return <StatusBadge color={statusColor(status)}>{status}</StatusBadge>;
      },
    }),
    helper.accessor((row) => row.capacity?.storage, {
      header: 'Capacity',
      id: 'capacity',
    }),
    helper.accessor((row) => row.humanReadableAccessModes.join(', '), {
      header: 'Access modes',
      id: 'accessModes',
    }),
    helper.accessor('persistentVolumeReclaimPolicy', {
      header: 'Reclaim policy',
    }),
    helper.accessor('storageClassName', {
      header: 'Storage class',
    }),
    helper.accessor('claimRef', {
      header: 'Claim',
      id: 'claim',
      cell: ({ row: { original } }) =>
        original.claimRef ? (
          <Link
            to="kubernetes.volumes.volume"
            params={{
              namespace: original.claimRef.namespace,
              name: original.claimRef.name,
            }}
            data-cy={`volume-link-${original.claimRef.name}`}
          >
            {original.claimRef.namespace}/{original.claimRef.name}
          </Link>
        ) : (
          ''
        ),
    }),
    helper.accessor((row) => formatDate(row.creationDate), {
      header: 'Created',
      id: 'created',
    }),
    helper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row: { original } }) => {
        return (
          <TooltipWithChildren message="Edit reclaim policy" position="top">
            <Button
              color="light"
              className="!ml-0"
              data-cy={`kubernetes-pv-reclaim-edit-${slugify(original.name)}`}
              onClick={() => onEditReclaimPolicy(original)}
            >
              <Icon icon={Edit} />
            </Button>
          </TooltipWithChildren>
        );
      },
    }),
  ];
}

function statusColor(status: PersistentVolumeStatus): StatusBadgeType {
  switch (status) {
    case 'Bound':
    case 'Available':
      return 'successLite';
    case 'Released':
      return 'warningLite';
    case 'Failed':
      return 'dangerLite';
    default:
      return 'mutedLite';
  }
}
