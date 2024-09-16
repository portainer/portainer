import { Database } from 'lucide-react';

import { useAuthorizations } from '@/react/hooks/useUser';
import KubernetesVolumeHelper from '@/kubernetes/helpers/volumeHelper';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { refreshableSettings } from '@@/datatables/types';
import { Datatable, TableSettingsMenu } from '@@/datatables';
import { useTableStateWithStorage } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';
import { useRepeater } from '@@/datatables/useRepeater';

import { systemResourcesSettings } from '../../datatables/SystemResourcesSettings';
import { CreateFromManifestButton } from '../../components/CreateFromManifestButton';
import {
  DefaultDatatableSettings,
  TableSettings,
} from '../../datatables/DefaultDatatableSettings';
import { SystemResourceDescription } from '../../datatables/SystemResourceDescription';
import { useNamespacesQuery } from '../../namespaces/queries/useNamespacesQuery';
import { useAllVolumesQuery } from '../useVolumesQuery';

import { VolumeViewModel } from './types';
import { columns } from './columns';

export function VolumesDatatable({
  onRemove,
  onRefresh,
}: {
  onRemove(items: Array<VolumeViewModel>): void;
  onRefresh(): void;
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

  useRepeater(tableState.autoRefreshRate, onRefresh);

  const envId = useEnvironmentId();
  const namespaceListQuery = useNamespacesQuery(envId);

  const volumesQuery = useAllVolumesQuery(envId);
  const volumes = Object.values(volumesQuery.data ?? []);

  const filteredVolumes = tableState.showSystemResources
    ? volumes
    : volumes.filter((item) => !isSystem(item));

  return (
    <Datatable
      noWidget
      data-cy="k8s-volumes-datatable"
      isLoading={volumesQuery.isLoading}
      dataset={filteredVolumes}
      columns={columns}
      settingsManager={tableState}
      title="Volumes"
      titleIcon={Database}
      isRowSelectable={({ original: item }) =>
        hasWriteAuth &&
        !(isSystem(item) && !KubernetesVolumeHelper.isUsed(item))
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

  function isSystem(item: VolumeViewModel) {
    return namespaceListQuery.data?.some(
      (namespace) =>
        namespace.Name === item.ResourcePool.Namespace.Name &&
        namespace.IsSystem
    );
  }
}
