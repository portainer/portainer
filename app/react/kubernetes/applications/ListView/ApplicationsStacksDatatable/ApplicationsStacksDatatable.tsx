import { List } from 'lucide-react';
import { useEffect } from 'react';

import { useAuthorizations } from '@/react/hooks/useUser';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { isSystemNamespace } from '@/react/kubernetes/namespaces/queries/useIsSystemNamespace';
import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';

import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import { useTableState } from '@@/datatables/useTableState';

import { useAllApplicationsQuery } from '../../application.queries';
import { Application } from '../ApplicationsDatatable/types';

import { columns } from './columns';
import { SubRows } from './SubRows';
import { Namespace, Stack } from './types';
import { StacksSettingsMenu } from './StacksSettingsMenu';
import { NamespaceFilter } from './NamespaceFilter';
import { TableActions } from './TableActions';

const storageKey = 'kubernetes.applications.stacks';

const settingsStore = createStore(storageKey);

interface Props {
  onRemove(selectedItems: Array<Stack>): void;
  namespace?: string;
  namespaces: Array<Namespace>;
  onNamespaceChange(namespace: string): void;
  showSystem?: boolean;
  setSystemResources(showSystem: boolean): void;
}

export function ApplicationsStacksDatatable({
  onRemove,
  namespace = '',
  namespaces,
  onNamespaceChange,
  showSystem,
  setSystemResources,
}: Props) {
  const tableState = useTableState(settingsStore, storageKey);

  const { setShowSystemResources } = tableState;

  useEffect(() => {
    setShowSystemResources(showSystem || false);
  }, [showSystem, setShowSystemResources]);

  const envId = useEnvironmentId();
  const applicationsQuery = useAllApplicationsQuery(envId, {
    refetchInterval: tableState.autoRefreshRate * 1000,
    namespace,
    withDependencies: true,
  });
  const namespaceListQuery = useNamespacesQuery(envId);
  const applications = applicationsQuery.data ?? [];
  const filteredApplications = showSystem
    ? applications
    : applications.filter(
        (item) =>
          !isSystemNamespace(item.ResourcePool, namespaceListQuery.data ?? [])
      );

  const { authorized } = useAuthorizations('K8sApplicationsW');

  const dataset = parseStacksFromApplications(filteredApplications);

  return (
    <ExpandableDatatable
      getRowCanExpand={(row) => row.original.Applications.length > 0}
      title="Stacks"
      titleIcon={List}
      dataset={dataset}
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
              showSystem={showSystem}
            />
          </div>

          <div className="space-y-2">
            <SystemResourceDescription showSystemResources={showSystem} />
          </div>
        </div>
      }
      renderTableActions={(selectedItems) => (
        <TableActions selectedItems={selectedItems} onRemove={onRemove} />
      )}
      renderTableSettings={() => (
        <StacksSettingsMenu
          setSystemResources={setSystemResources}
          settings={tableState}
        />
      )}
      getRowId={(row) => `${row.Name}-${row.ResourcePool}`}
      data-cy="applications-stacks-datatable"
    />
  );
}

function parseStacksFromApplications(applications: Application[]) {
  const res = applications.reduce<Stack[]>((stacks, app) => {
    const updatedStacks = stacks.map((stack) => {
      if (
        stack.Name === app.StackName &&
        stack.ResourcePool === app.ResourcePool
      ) {
        return {
          ...stack,
          Applications: [...stack.Applications, app],
        };
      }
      return stack;
    });

    const stackExists = updatedStacks.some(
      (stack) =>
        stack.Name === app.StackName && stack.ResourcePool === app.ResourcePool
    );

    if (!stackExists && app.StackName) {
      updatedStacks.push({
        Name: app.StackName,
        ResourcePool: app.ResourcePool,
        Applications: [app],
        Highlighted: false,
      });
    }
    return updatedStacks;
  }, []);
  return res;
}
