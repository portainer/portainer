import { Database } from 'lucide-react';

import { useAuthorizations } from '@/react/hooks/useUser';
import KubernetesVolumeHelper from '@/kubernetes/helpers/volumeHelper';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { refreshableSettings } from '@@/datatables/types';
import { Datatable, TableSettingsMenu } from '@@/datatables';
import { useTableStateWithStorage } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { systemResourcesSettings } from '../../datatables/SystemResourcesSettings';
import { CreateFromManifestButton } from '../../components/CreateFromManifestButton';
import {
  DefaultDatatableSettings,
  TableSettings,
} from '../../datatables/DefaultDatatableSettings';
import { SystemResourceDescription } from '../../datatables/SystemResourceDescription';
import { useNamespacesQuery } from '../../namespaces/queries/useNamespacesQuery';
import { useAllVolumesQuery } from '../useVolumesQuery';
import { isSystemNamespace } from '../../namespaces/queries/useIsSystemNamespace';

import { VolumeViewModel } from './types';
import { columns } from './columns';

export function VolumesDatatable({
  onRemove,
}: {
  onRemove(items: Array<VolumeViewModel>): void;
}) {
  const tableState = useTableStateWithStorage<TableSettings>(
    'kube-volumes',
    'Name',
    (set) => ({
      ...systemResourcesSettings(set),
      ...refreshableSettings(set),
    })
  );

  const hasWriteAuth = useAuthorizations('K8sVolumesW', undefined, true);

  const envId = useEnvironmentId();
  const namespaceListQuery = useNamespacesQuery(envId);
  const namespaces = namespaceListQuery.data ?? [];
  const volumesQuery = useAllVolumesQuery(envId, {
    refetchInterval: tableState.autoRefreshRate * 1000,
  });
  const volumes = volumesQuery.data ?? [];

  const filteredVolumes = tableState.showSystemResources
    ? volumes
    : volumes.filter(
        (volume) =>
          !isSystemNamespace(volume.ResourcePool.Namespace.Name, namespaces)
      );

  return (
    <Datatable
      noWidget
      data-cy="k8s-volumes-datatable"
      isLoading={volumesQuery.isLoading || namespaceListQuery.isLoading}
      dataset={filteredVolumes}
      columns={columns}
      settingsManager={tableState}
      title="Volumes"
      titleIcon={Database}
      isRowSelectable={({ original: volume }) =>
        hasWriteAuth &&
        !(
          isSystemNamespace(volume.ResourcePool.Namespace.Name, namespaces) &&
          !KubernetesVolumeHelper.isUsed(volume)
        )
      }
      renderTableActions={(selectedItems) => (
        <>
          <DeleteButton
            confirmMessage="Do you want to remove the selected volume(s)?"
            onConfirmed={() => onRemove(selectedItems)}
            disabled={selectedItems.length === 0}
            data-cy="k8s-volumes-delete-button"
          />
          <CreateFromManifestButton data-cy="k8s-volumes-deploy-button" />
        </>
      )}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <DefaultDatatableSettings settings={tableState} />
        </TableSettingsMenu>
      )}
      description={
        <SystemResourceDescription
          showSystemResources={tableState.showSystemResources}
        />
      }
    />
  );
}
