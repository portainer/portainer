import { Database } from 'lucide-react';
import { useState } from 'react';

import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { usePersistentVolumes } from '@/react/kubernetes/volumes/queries/usePersistentVolumes';
import { useDeletePersistentVolumes } from '@/react/kubernetes/volumes/queries/useDeletePersistentVolumes';
import { ReclaimPolicyEditForm } from '@/react/kubernetes/volumes/ListView/ReclaimPolicyEditForm';
import { CreateFromManifestButton } from '@/react/kubernetes/components/CreateFromManifestButton';

import { refreshableSettings } from '@@/datatables/types';
import { Datatable, TableSettingsMenu } from '@@/datatables';
import { useTableStateWithStorage } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';
import { Modal } from '@@/modals';

import { systemResourcesSettings } from '../../datatables/SystemResourcesSettings';
import { isPersistentVolumeUsed } from '../utils';
import {
  DefaultDatatableSettings,
  TableSettings,
} from '../../datatables/DefaultDatatableSettings';
import { SystemResourceDescription } from '../../datatables/SystemResourceDescription';

import { createPersistentVolumesColumns } from './persistentVolumesColumns';
import { PersistentVolume } from './types';

export function PersistentVolumesDatatable() {
  const [editReclaimPolicyVolume, setEditReclaimPolicyVolume] =
    useState<PersistentVolume | null>(null);
  const tableState = useTableStateWithStorage<TableSettings>(
    'kube-volumes-pv',
    'name',
    (set) => ({
      ...systemResourcesSettings(set),
      ...refreshableSettings(set),
    })
  );

  const { authorized: hasWriteAuth } = useAuthorizations(
    'K8sVolumesW',
    undefined,
    false
  );

  const envId = useEnvironmentId();
  const deleteVolumesMutation = useDeletePersistentVolumes(envId);
  const volumesQuery = usePersistentVolumes(envId, {
    refetchInterval: tableState.autoRefreshRateMS,
  });
  const volumes = volumesQuery.data ?? [];
  const columns = createPersistentVolumesColumns((volume) =>
    setEditReclaimPolicyVolume(volume)
  );

  return (
    <>
      <Datatable<PersistentVolume>
        data-cy="k8s-persistentvolumes-datatable"
        isLoading={volumesQuery.isLoading}
        dataset={volumes}
        columns={columns}
        settingsManager={tableState}
        title="Volumes"
        titleIcon={Database}
        getRowId={(row) => `${row.name}`}
        disableSelect={!hasWriteAuth}
        isRowSelectable={({ original: volume }) =>
          !isPersistentVolumeUsed(volume)
        }
        renderTableActions={(selectedItems) => (
          <Authorized authorizations="K8sVolumesW">
            <DeleteButton
              confirmMessage="Do you want to remove the selected volume(s)?"
              onConfirmed={() => deleteVolumesMutation.mutate(selectedItems)}
              disabled={selectedItems.length === 0}
              isLoading={deleteVolumesMutation.isLoading}
              data-cy="k8s-persistentvolumes-delete-button"
            />
            <CreateFromManifestButton data-cy="k8s-persistentvolumes-deploy-button" />
          </Authorized>
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

      <div>
        {editReclaimPolicyVolume && (
          <Modal
            onDismiss={() => setEditReclaimPolicyVolume(null)}
            aria-label="kubernetes-reclaim-modal"
            size="lg"
          >
            <ReclaimPolicyEditForm
              volume={editReclaimPolicyVolume}
              onDismiss={() => setEditReclaimPolicyVolume(null)}
            />
          </Modal>
        )}
      </div>
    </>
  );
}
