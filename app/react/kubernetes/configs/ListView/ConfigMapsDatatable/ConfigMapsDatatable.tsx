import { useMemo } from 'react';
import { FileCode, Plus, Trash2 } from 'lucide-react';
import { ConfigMap } from 'kubernetes-types/core/v1';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import {
  Authorized,
  useAuthorizations,
  useCurrentUser,
} from '@/react/hooks/useUser';
import { useNamespaces } from '@/react/kubernetes/namespaces/queries';
import { DefaultDatatableSettings } from '@/react/kubernetes/datatables/DefaultDatatableSettings';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { isSystemNamespace } from '@/react/kubernetes/namespaces/utils';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { useApplicationsForCluster } from '@/react/kubernetes/applications/application.queries';
import { Application } from '@/react/kubernetes/applications/types';
import { pluralize } from '@/portainer/helpers/strings';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { confirmDelete } from '@@/modals/confirm';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';
import { useTableState } from '@@/datatables/useTableState';

import {
  useConfigMapsForCluster,
  useMutationDeleteConfigMaps,
} from '../../configmap.service';
import { IndexOptional } from '../../types';

import { getIsConfigMapInUse } from './utils';
import { ConfigMapRowData } from './types';
import { columns } from './columns';

const storageKey = 'k8sConfigMapsDatatable';
const settingsStore = createStore(storageKey);

export function ConfigMapsDatatable() {
  const tableState = useTableState(settingsStore, storageKey);
  const readOnly = !useAuthorizations(['K8sConfigMapsW']);
  const { isAdmin } = useCurrentUser();

  const environmentId = useEnvironmentId();
  const { data: namespaces, ...namespacesQuery } = useNamespaces(
    environmentId,
    {
      autoRefreshRate: tableState.autoRefreshRate * 1000,
    }
  );
  const namespaceNames = Object.keys(namespaces || {});
  const { data: configMaps, ...configMapsQuery } = useConfigMapsForCluster(
    environmentId,
    namespaceNames,
    {
      autoRefreshRate: tableState.autoRefreshRate * 1000,
    }
  );
  const { data: applications, ...applicationsQuery } =
    useApplicationsForCluster(environmentId, namespaceNames);

  const filteredConfigMaps = useMemo(
    () =>
      configMaps?.filter(
        (configMap) =>
          (isAdmin && tableState.showSystemResources) ||
          !isSystemNamespace(configMap.metadata?.namespace ?? '')
      ) || [],
    [configMaps, tableState, isAdmin]
  );
  const configMapRowData = useConfigMapRowData(
    filteredConfigMaps,
    applications ?? [],
    applicationsQuery.isLoading
  );

  return (
    <Datatable<IndexOptional<ConfigMapRowData>>
      dataset={configMapRowData}
      columns={columns}
      settingsManager={tableState}
      isLoading={configMapsQuery.isLoading || namespacesQuery.isLoading}
      emptyContentLabel="No ConfigMaps found"
      title="ConfigMaps"
      titleIcon={FileCode}
      getRowId={(row) => row.metadata?.uid ?? ''}
      isRowSelectable={(row) =>
        !isSystemNamespace(row.original.metadata?.namespace ?? '')
      }
      disableSelect={readOnly}
      renderTableActions={(selectedRows) => (
        <TableActions selectedItems={selectedRows} />
      )}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <DefaultDatatableSettings
            settings={tableState}
            hideShowSystemResources={!isAdmin}
          />
        </TableSettingsMenu>
      )}
      description={
        <SystemResourceDescription
          showSystemResources={tableState.showSystemResources || !isAdmin}
        />
      }
    />
  );
}

// useConfigMapRowData appends the `inUse` property to the ConfigMap data (for the unused badge in the name column)
// and wraps with useMemo to prevent unnecessary calculations
function useConfigMapRowData(
  configMaps: ConfigMap[],
  applications: Application[],
  applicationsLoading: boolean
): ConfigMapRowData[] {
  return useMemo(
    () =>
      configMaps.map((configMap) => ({
        ...configMap,
        inUse:
          // if the apps are loading, set inUse to true to hide the 'unused' badge
          applicationsLoading || getIsConfigMapInUse(configMap, applications),
      })),
    [configMaps, applicationsLoading, applications]
  );
}

function TableActions({
  selectedItems,
}: {
  selectedItems: ConfigMapRowData[];
}) {
  const environmentId = useEnvironmentId();
  const deleteConfigMapMutation = useMutationDeleteConfigMaps(environmentId);

  async function handleRemoveClick(configMaps: ConfigMap[]) {
    const confirmed = await confirmDelete(
      `Are you sure you want to remove the selected ${pluralize(
        configMaps.length,
        'ConfigMap'
      )}?`
    );
    if (!confirmed) {
      return;
    }

    const configMapsToDelete = configMaps.map((configMap) => ({
      namespace: configMap.metadata?.namespace ?? '',
      name: configMap.metadata?.name ?? '',
    }));

    await deleteConfigMapMutation.mutateAsync(configMapsToDelete);
  }

  return (
    <Authorized authorizations="K8sConfigMapsW">
      <Button
        className="btn-wrapper"
        color="dangerlight"
        disabled={selectedItems.length === 0}
        onClick={async () => {
          handleRemoveClick(selectedItems);
        }}
        icon={Trash2}
        data-cy="k8sConfig-removeConfigButton"
      >
        Remove
      </Button>
      <Link to="kubernetes.configmaps.new" className="ml-1">
        <Button
          className="btn-wrapper"
          color="secondary"
          icon={Plus}
          data-cy="k8sConfig-addConfigWithFormButton"
        >
          Add with form
        </Button>
      </Link>
      <Link
        to="kubernetes.deploy"
        params={{
          referrer: 'kubernetes.configurations',
          tab: 'configmaps',
        }}
        className="ml-1"
        data-cy="k8sConfig-deployFromManifestButton"
      >
        <Button className="btn-wrapper" color="primary" icon={Plus}>
          Create from manifest
        </Button>
      </Link>
    </Authorized>
  );
}
