import { List } from 'lucide-react';

import { useAuthorizations } from '@/react/hooks/useUser';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { systemResourcesSettings } from '@/react/kubernetes/datatables/SystemResourcesSettings';

import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import { createPersistedStore, refreshableSettings } from '@@/datatables/types';
import { useRepeater } from '@@/datatables/useRepeater';
import { useTableState } from '@@/datatables/useTableState';
import { InsightsBox } from '@@/InsightsBox';

import { KubernetesStack } from '../../types';

import { columns } from './columns';
import { SubRows } from './SubRows';
import { Namespace, TableSettings } from './types';
import { StacksSettingsMenu } from './StacksSettingsMenu';
import { NamespaceFilter } from './NamespaceFilter';
import { TableActions } from './TableActions';

const storageKey = 'kubernetes.applications.stacks';

const settingsStore = createPersistedStore<TableSettings>(
  storageKey,
  'name',
  (set) => ({
    ...systemResourcesSettings(set),
    ...refreshableSettings(set),
  })
);

interface Props {
  dataset: Array<KubernetesStack>;
  onRemove(selectedItems: Array<KubernetesStack>): void;
  onRefresh(): Promise<void>;
  namespace?: string;
  namespaces: Array<Namespace>;
  onNamespaceChange(namespace: string): void;
  isLoading?: boolean;
}

export function ApplicationsStacksDatatable({
  dataset,
  onRemove,
  onRefresh,
  namespace = '',
  namespaces,
  onNamespaceChange,
  isLoading,
}: Props) {
  const tableState = useTableState(settingsStore, storageKey);

  const authorized = useAuthorizations('K8sApplicationsW');
  useRepeater(tableState.autoRefreshRate, onRefresh);

  return (
    <ExpandableDatatable
      getRowCanExpand={(row) => row.original.Applications.length > 0}
      title="Stacks"
      titleIcon={List}
      dataset={dataset}
      isLoading={isLoading}
      columns={columns}
      settingsManager={tableState}
      disableSelect={!authorized}
      renderSubRow={(row) => (
        <SubRows stack={row.original} span={row.getVisibleCells().length} />
      )}
      noWidget
      emptyContentLabel="No stack available."
      description={
        <div className="w-full space-y-2">
          <SystemResourceDescription
            showSystemResources={tableState.showSystemResources}
          />

          <div className="w-fit">
            <InsightsBox
              type="slim"
              header="From 2.18 on, you can filter this view by namespace."
              insightCloseId="k8s-namespace-filtering"
            />
          </div>
        </div>
      }
      renderTableActions={(selectedItems) => (
        <TableActions selectedItems={selectedItems} onRemove={onRemove} />
      )}
      renderTableSettings={() => <StacksSettingsMenu settings={tableState} />}
      renderSidebar={({ searchBar, tableActions, tableTitleSettings }) => (
        <div className="inline-flex flex-row-reverse flex-wrap gap-x-5 gap-y-3">
          {tableTitleSettings}

          {tableActions}

          {searchBar}

          <div className="min-w-[140px]">
            <NamespaceFilter
              namespaces={namespaces}
              value={namespace}
              onChange={onNamespaceChange}
              showSystem={tableState.showSystemResources}
            />
          </div>
        </div>
      )}
      getRowId={(row) => `${row.Name}-${row.ResourcePool}`}
    />
  );
}
