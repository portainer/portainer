import { List } from 'lucide-react';
import { useEffect } from 'react';

import { useAuthorizations } from '@/react/hooks/useUser';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';

import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import { useRepeater } from '@@/datatables/useRepeater';
import { useTableState } from '@@/datatables/useTableState';

import { KubernetesStack } from '../../types';

import { columns } from './columns';
import { SubRows } from './SubRows';
import { Namespace } from './types';
import { StacksSettingsMenu } from './StacksSettingsMenu';
import { NamespaceFilter } from './NamespaceFilter';
import { TableActions } from './TableActions';

const storageKey = 'kubernetes.applications.stacks';

const settingsStore = createStore(storageKey);

interface Props {
  dataset: Array<KubernetesStack>;
  onRemove(selectedItems: Array<KubernetesStack>): void;
  onRefresh(): Promise<void>;
  namespace?: string;
  namespaces: Array<Namespace>;
  onNamespaceChange(namespace: string): void;
  isLoading?: boolean;
  showSystem?: boolean;
  setSystemResources(showSystem: boolean): void;
}

export function ApplicationsStacksDatatable({
  dataset,
  onRemove,
  onRefresh,
  namespace = '',
  namespaces,
  onNamespaceChange,
  isLoading,
  showSystem,
  setSystemResources,
}: Props) {
  const tableState = useTableState(settingsStore, storageKey);

  useEffect(() => {
    tableState.setShowSystemResources(showSystem || false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSystem]);

  const { authorized } = useAuthorizations('K8sApplicationsW');
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
        <div className="w-full">
          <div className="min-w-[140px] float-right mr-2">
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
        <StacksSettingsMenu
          setSystemResources={setSystemResources}
          settings={tableState}
        />
      )}
      getRowId={(row) => `${row.Name}-${row.ResourcePool}`}
    />
  );
}
