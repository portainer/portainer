import { Filter, List, Trash2 } from 'lucide-react';
import { useEffect } from 'react';

import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { systemResourcesSettings } from '@/react/kubernetes/datatables/SystemResourcesSettings';

import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import { createPersistedStore, refreshableSettings } from '@@/datatables/types';
import { Button } from '@@/buttons';
import { useRepeater } from '@@/datatables/useRepeater';
import { useTableState } from '@@/datatables/useTableState';
import { InputGroup } from '@@/form-components/InputGroup';
import { Icon } from '@@/Icon';
import { InsightsBox } from '@@/InsightsBox';
import { Select } from '@@/form-components/Input';

import { KubernetesStack } from '../../types';

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

interface Namespace {
  Id: string;
  Name: string;
  Yaml: string;
  IsSystem?: boolean;
}

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
      renderHeaderRightSide={(searchBar, tableActions, tableTitleSettings) => (
        <>
          <div className="mr-2">
            <NamespaceFilter
              namespaces={namespaces}
              value={namespace}
              onChange={onNamespaceChange}
              showSystem={tableState.showSystemResources}
            />
          </div>
          {searchBar}
          {tableActions}
          {tableTitleSettings}
        </>
      )}
      getRowId={(row) => `${row.Name}-${row.ResourcePool}`}
    />
  );
}

function transformNamespaces(namespaces: Namespace[], showSystem: boolean) {
  return namespaces
    .filter((ns) => showSystem || !ns.IsSystem)
    .map(({ Name, IsSystem }) => ({
      label: IsSystem ? `${Name} - system` : Name,
      value: Name,
    }));
}

function NamespaceFilter({
  namespaces,
  value,
  onChange,
  showSystem,
}: {
  namespaces: Namespace[];
  value: string;
  onChange: (value: string) => void;
  showSystem: boolean;
}) {
  const transformedNamespaces = transformNamespaces(namespaces, showSystem);

  // sync value with displayed namespaces
  useEffect(() => {
    const names = transformedNamespaces.map((ns) => ns.value);
    if (value && !names.find((ns) => ns === value)) {
      onChange(
        names.length > 0 ? names.find((ns) => ns === 'default') || names[0] : ''
      );
    }
  }, [value, onChange, transformedNamespaces]);

  return (
    <InputGroup>
      <InputGroup.Addon>
        <div className="flex items-center gap-1">
          <Icon icon={Filter} />
          Namespace
        </div>
      </InputGroup.Addon>
      <Select
        className="!h-[30px] py-1"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        options={[
          { label: 'All namespaces', value: '' },
          ...transformedNamespaces,
        ]}
      />
    </InputGroup>
  );
}
