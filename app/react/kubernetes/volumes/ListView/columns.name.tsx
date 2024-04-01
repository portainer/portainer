import { CellContext } from '@tanstack/react-table';

import KubernetesVolumeHelper from '@/kubernetes/helpers/volumeHelper';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Link } from '@@/Link';
import { SystemBadge } from '@@/Badge/SystemBadge';
import { ExternalBadge } from '@@/Badge/ExternalBadge';
import { UnusedBadge } from '@@/Badge/UnusedBadge';

import { useNamespacesQuery } from '../../namespaces/queries/useNamespacesQuery';

import { VolumeViewModel } from './types';
import { helper } from './columns.helper';

export const name = helper.accessor('PersistentVolumeClaim.Name', {
  header: 'Name',
  cell: NameCell,
});

export function NameCell({
  row: { original: item },
}: CellContext<VolumeViewModel, string>) {
  const envId = useEnvironmentId();
  const namespaceListQuery = useNamespacesQuery(envId);
  const isSystem =
    namespaceListQuery.data?.[item.ResourcePool.Namespace.Name].IsSystem;
  return (
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
      {isSystem ? (
        <SystemBadge />
      ) : (
        <>
          {KubernetesVolumeHelper.isExternalVolume(item) && <ExternalBadge />}
          {!KubernetesVolumeHelper.isUsed(item) && <UnusedBadge />}
        </>
      )}
    </>
  );
}
