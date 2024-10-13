import { List } from 'lucide-react';

import { useAuthorizations } from '@/react/hooks/useUser';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { isSystemNamespace } from '@/react/kubernetes/namespaces/queries/useIsSystemNamespace';
import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';
import { DefaultDatatableSettings } from '@/react/kubernetes/datatables/DefaultDatatableSettings';

import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import { useTableState } from '@@/datatables/useTableState';
import { TableSettingsMenu } from '@@/datatables';

import { useApplications } from '../../application.queries';

import { columns } from './columns';
import { SubRows } from './SubRows';
import { Namespace, Stack } from './types';
import { NamespaceFilter } from './NamespaceFilter';
import { TableActions } from './TableActions';
import { getStacksFromApplications } from './getStacksFromApplications';

const storageKey = 'kubernetes.applications.stacks';

const settingsStore = createStore(storageKey);

interface Props {
  onRemove(selectedItems: Array<Stack>): void;
  namespace?: string;
  namespaces: Array<Namespace>;
  onNamespaceChange(namespace: string): void;
}

export function ApplicationsStacksDatatable({
  onRemove,
  namespace = '',
  namespaces,
  onNamespaceChange,
}: Props) {
  const tableState = useTableState(settingsStore, storageKey);

  const envId = useEnvironmentId();
  const applicationsQuery = useApplications(envId, {
    refetchInterval: tableState.autoRefreshRate * 1000,
    namespace,
    withDependencies: true,
  });
  const namespaceListQuery = useNamespacesQuery(envId);
  const applications = applicationsQuery.data ?? [];
  const filteredApplications = tableState.showSystemResources
    ? applications
    : applications.filter(
        (item) =>
          !isSystemNamespace(item.ResourcePool, namespaceListQuery.data ?? [])
      );

  const { authorized } = useAuthorizations('K8sApplicationsW');

  const stacks = getStacksFromApplications(filteredApplications);

  return (
    <ExpandableDatatable
      getRowCanExpand={(row) => row.original.Applications.length > 0}
      title="Stacks"
      titleIcon={List}
      dataset={stacks}
      isLoading={applicationsQuery.isLoading || namespaceListQuery.isLoading}
      columns={columns}
      settingsManager={tableState}
      disableSelect={!authorized}
      renderSubRow={(row) => (
        <SubRows stack={row.original} span={row.getVisibleCells().length} />
      )}
      noWidget
      description={
        <div className="w-full">
          <div className="float-right mr-2 min-w-[140px]">
            <NamespaceFilter
              namespaces={namespaces}
              value={namespace}
              onChange={onNamespaceChange}
              showSystem={tableState.showSystemResources}
            />
          </div>

          <div className="space-y-2">
            <SystemResourceDescription
              showSystemResources={tableState.showSystemResources}
            />
          </div>
        </div>
      }
      renderTableActions={(selectedItems) => (
        <TableActions selectedItems={selectedItems} onRemove={onRemove} />
      )}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <DefaultDatatableSettings settings={tableState} />
        </TableSettingsMenu>
      )}
      getRowId={(row) => `${row.Name}-${row.ResourcePool}`}
      data-cy="applications-stacks-datatable"
    />
  );
}
