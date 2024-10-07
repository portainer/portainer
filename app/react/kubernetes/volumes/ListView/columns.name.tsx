import { CellContext } from '@tanstack/react-table';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Link } from '@@/Link';
import { SystemBadge } from '@@/Badge/SystemBadge';
import { ExternalBadge } from '@@/Badge/ExternalBadge';
import { UnusedBadge } from '@@/Badge/UnusedBadge';

import { useNamespacesQuery } from '../../namespaces/queries/useNamespacesQuery';
import { isVolumeExternal, isVolumeUsed } from '../utils';

import { VolumeViewModel } from './types';
import { helper } from './columns.helper';

export const name = helper.accessor('PersistentVolumeClaim.Name', {
  header: 'Name',
  id: 'Name',
  cell: NameCell,
});

export function NameCell({
  row: { original: item },
}: CellContext<VolumeViewModel, string>) {
  const envId = useEnvironmentId();
  const namespaceListQuery = useNamespacesQuery(envId);
  const isSystem = namespaceListQuery.data?.some(
    (namespace) =>
      namespace.Name === item.ResourcePool.Namespace.Name && namespace.IsSystem
  );
  return (
    <div className="flex gap-x-1">
      <Link
        to="kubernetes.volumes.volume"
        params={{
          namespace: item.ResourcePool.Namespace.Name,
          name: item.PersistentVolumeClaim.Name,
        }}
        data-cy={`volume-link-${item.PersistentVolumeClaim.Name}`}
      >
        {item.PersistentVolumeClaim.Name}
      </Link>
      {isSystem ? (
        <SystemBadge />
      ) : (
        <>
          {isVolumeExternal(item) && <ExternalBadge />}
          {!isVolumeUsed(item) && <UnusedBadge />}
        </>
      )}
    </div>
  );
}
