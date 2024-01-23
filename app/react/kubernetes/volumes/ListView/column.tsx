import { createColumnHelper } from '@tanstack/react-table';

import KubernetesVolumeHelper from '@/kubernetes/helpers/volumeHelper';
import { isoDate } from '@/portainer/filters/filters';

import { Link } from '@@/Link';
import { Badge } from '@@/Badge';

import { VolumeViewModel } from './types';
import { isSystemVolume } from './isSystemVolume';

const helper = createColumnHelper<VolumeViewModel>();

export const columns = [
  helper.accessor('PersistentVolumeClaim.Name', {
    header: 'Name',
    cell: ({ row: { original: item } }) => (
      <>
        <Link
          to="kubernetes.volumes.volume"
          params={{
            namespace: item.ResourcePool.Namespace.Name,
            name: item.PersistentVolumeClaim.Name,
          }}
        >
          {item.PersistentVolumeClaim.Name}
        </Link>
        {isSystemVolume(item) ? (
          <Badge type="info">system</Badge>
        ) : (
          <>
            {KubernetesVolumeHelper.isExternalVolume(item) && (
              <Badge type="success">external</Badge>
            )}
            {!KubernetesVolumeHelper.isUsed(item) && (
              <Badge type="warn">unused</Badge>
            )}
          </>
        )}
      </>
    ),
  }),
  helper.accessor('ResourcePool.Namespace.Name', {
    header: 'Namespace',
    cell: ({ getValue }) => {
      const namespace = getValue();

      return (
        <Link
          to="kubernetes.resourcePools.resourcePool"
          params={{ id: namespace }}
        >
          {namespace}
        </Link>
      );
    },
  }),
  helper.accessor((item) => item.Applications[0]?.Name, {
    header: 'Used by',
    cell: ({ row: { original: item } }) => {
      if (!item.Applications.length) {
        return '-';
      }

      return (
        <>
          <Link
            to="kubernetes.applications.application"
            params={{
              name: item.Applications[0].Name,
              namespace: item.ResourcePool.Namespace.Name,
            }}
          >
            {item.Applications[0].Name}
          </Link>
          {item.Applications.length > 1 && (
            <> + {item.Applications.length - 1}</>
          )}
        </>
      );
    },
  }),
  helper.accessor('PersistentVolumeClaim.storageClass.Name', {
    header: 'Storage',
  }),
  helper.accessor('PersistentVolumeClaim.Storage', {
    header: 'Size',
  }),
  helper.accessor('PersistentVolumeClaim.CreationDate', {
    header: 'Created',
    cell: ({ row: { original: item } }) => (
      <>
        {isoDate(item.PersistentVolumeClaim.CreationDate)}
        {item.PersistentVolumeClaim.ApplicationOwner
          ? ` by ${item.PersistentVolumeClaim.ApplicationOwner}`
          : ''}
      </>
    ),
  }),
];
