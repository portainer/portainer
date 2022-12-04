import { List, Trash2 } from 'lucide-react';

import { Authorized, useAuthorizations } from '@/react/hooks/useUser';

import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import { createPersistedStore, refreshableSettings } from '@@/datatables/types';
import { Button } from '@@/buttons';
import { useRepeater } from '@@/datatables/useRepeater';
import { useTableState } from '@@/datatables/useTableState';

import { SystemResourcesAlert } from '../../datatables/SystemResourcesAlert';
import { KubernetesStack } from '../types';
import { systemResourcesSettings } from '../../datatables/DefaultDatatableSettings';

import { columns } from './columns';
import { SubRows } from './SubRows';
import { TableSettings } from './types';
import { StacksSettingsMenu } from './StacksSettingsMenu';

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
}

export function ApplicationsStacksDatatable({
  dataset,
  onRemove,
  onRefresh,
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
      columns={columns}
      settingsManager={tableState}
      disableSelect={!authorized}
      renderSubRow={(row) => (
        <SubRows stack={row.original} span={row.getVisibleCells().length} />
      )}
      noWidget
      emptyContentLabel="No stack available."
      description={
        <SystemResourcesAlert
          showSystemResources={tableState.showSystemResources}
        />
      }
      renderTableActions={(selectedRows) => (
        <Authorized authorizations="K8sApplicationsW">
          <Button
            disabled={selectedRows.length === 0}
            color="dangerlight"
            onClick={() => onRemove(selectedRows)}
            icon={Trash2}
            data-cy="k8sApp-removeStackButton"
          >
            Remove
          </Button>
        </Authorized>
      )}
      renderTableSettings={() => <StacksSettingsMenu settings={tableState} />}
      getRowId={(row) => `${row.Name}-${row.ResourcePool}`}
    />
  );
}
