import { CellContext } from '@tanstack/react-table';

import { isoDate, truncate } from '@/portainer/filters/filters';
import { useIsSystemNamespace } from '@/react/kubernetes/namespaces/queries/useIsSystemNamespace';

import { Link } from '@@/Link';
import { SystemBadge } from '@@/Badge/SystemBadge';

import { Application } from './types';
import { helper } from './columns.helper';

export const stackName = helper.accessor('StackName', {
  header: 'Stack',
  cell: ({ getValue }) => getValue() || '-',
});

export const namespace = helper.accessor('ResourcePool', {
  header: 'Namespace',
  cell: NamespaceCell,
});

function NamespaceCell({ row, getValue }: CellContext<Application, string>) {
  const value = getValue();
  const isSystem = useIsSystemNamespace(value);
  return (
    <div className="flex gap-2">
      <Link
        to="kubernetes.resourcePools.resourcePool"
        params={{ id: value }}
        data-cy={`app-namespace-link-${row.original.Name}`}
      >
        {value}
      </Link>
      {isSystem && <SystemBadge />}
    </div>
  );
}

export const image = helper.accessor('Image', {
  header: 'Image',
  cell: ({ row: { original: item } }) => (
    <>
      {truncate(item.Image, 64)}
      {item.Containers && item.Containers?.length > 1 && (
        <>+ {item.Containers.length - 1}</>
      )}
    </>
  ),
});

export const appType = helper.accessor('ApplicationType', {
  header: 'Application Type',
});

export const published = helper.accessor('Services', {
  header: 'Published',
  cell: ({ row: { original: item } }) =>
    item.Services?.length === 0 ? 'No' : 'Yes',
  enableSorting: false,
});

export const created = helper.accessor('CreationDate', {
  header: 'Created',
  cell({ row: { original: item } }) {
    return (
      <>
        {isoDate(item.CreationDate)}{' '}
        {item.ApplicationOwner ? ` by ${item.ApplicationOwner}` : ''}
      </>
    );
  },
});
