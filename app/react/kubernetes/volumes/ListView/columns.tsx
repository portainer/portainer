import { isoDate } from '@/portainer/filters/filters';

import { Link } from '@@/Link';

import { name } from './columns.name';
import { helper } from './columns.helper';

export const columns = [
  name,
  helper.accessor('ResourcePool.Namespace.Name', {
    header: 'Namespace',
    cell: ({ getValue }) => {
      const namespace = getValue();

      return (
        <Link
          to="kubernetes.resourcePools.resourcePool"
          params={{ id: namespace }}
          data-cy={`volume-namespace-link-${namespace}`}
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
            data-cy={`volume-application-link-${item.Applications[0].Name}`}
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
