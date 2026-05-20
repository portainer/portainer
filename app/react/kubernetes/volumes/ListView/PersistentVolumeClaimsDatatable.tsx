import { Database } from 'lucide-react';
import { useState } from 'react';

import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { usePersistentVolumeClaims } from '@/react/kubernetes/volumes/queries/usePersistentVolumeClaims';
import { useDeletePersistentVolumeClaims } from '@/react/kubernetes/volumes/queries/useDeletePersistentVolumeClaims';
import { ResizeClaimEditForm } from '@/react/kubernetes/volumes/ListView/ResizeClaimEditForm';
import { isSystemNamespace } from '@/react/kubernetes/namespaces/queries/useIsSystemNamespace';
import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';

import { refreshableSettings } from '@@/datatables/types';
import { Datatable, TableSettingsMenu } from '@@/datatables';
import { useTableStateWithStorage } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';
import { Modal } from '@@/modals';

import { systemResourcesSettings } from '../../datatables/SystemResourcesSettings';
import { CreateFromManifestButton } from '../../components/CreateFromManifestButton';
import {
  DefaultDatatableSettings,
  TableSettings,
} from '../../datatables/DefaultDatatableSettings';
import { SystemResourceDescription } from '../../datatables/SystemResourceDescription';

import { createPersistentVolumeClaimsColumns } from './persistentVolumeClaimsColumns';
import { PersistentVolumeClaim } from './types';

export function PersistentVolumeClaimsDatatable() {
  const [editResizeClaim, setEditResizeClaim] =
    useState<PersistentVolumeClaim | null>(null);
  const tableState = useTableStateWithStorage<TableSettings>(
    'kube-volumes-pvc',
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
  const namespacesQuery = useNamespacesQuery(envId);
  const namespaces = namespacesQuery.data ?? [];
  const deleteClaimsMutation = useDeletePersistentVolumeClaims(envId);
  const claimsQuery = usePersistentVolumeClaims(envId, {
    refetchInterval: tableState.autoRefreshRate * 1000,
    select: filterVolumeClaims,
  });
  const claims = claimsQuery.data ?? [];
  const columns = createPersistentVolumeClaimsColumns((claim) =>
    setEditResizeClaim(claim)
  );

  return (
    <>
      <Datatable<PersistentVolumeClaim>
        data-cy="k8s-persistentvolumeclaims-datatable"
        isLoading={claimsQuery.isLoading}
        dataset={claims}
        columns={columns}
        settingsManager={tableState}
        title="Volume claims"
        titleIcon={Database}
        disableSelect={!hasWriteAuth}
        isRowSelectable={({ original: claim }) => claim.phase !== 'Bound'}
        renderTableActions={(selectedItems) => (
          <Authorized authorizations="K8sVolumesW">
            <DeleteButton
              confirmMessage="Do you want to remove the selected volume(s)?"
              onConfirmed={() => deleteClaimsMutation.mutate(selectedItems)}
              disabled={selectedItems.length === 0}
              isLoading={deleteClaimsMutation.isLoading}
              data-cy="k8s-persistentvolumeclaims-delete-button"
            />
            <CreateFromManifestButton data-cy="k8s-persistentvolumeclaims-deploy-button" />
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

      {editResizeClaim && (
        <Modal onDismiss={() => setEditResizeClaim(null)} size="md">
          <ResizeClaimEditForm
            claim={editResizeClaim}
            onDismiss={() => setEditResizeClaim(null)}
          />
        </Modal>
      )}
    </>
  );

  function filterVolumeClaims(
    claims: PersistentVolumeClaim[]
  ): PersistentVolumeClaim[] {
    return claims.filter(
      (claim) =>
        tableState.showSystemResources ||
        !isSystemNamespace(claim.namespace, namespaces)
    );
  }
}
