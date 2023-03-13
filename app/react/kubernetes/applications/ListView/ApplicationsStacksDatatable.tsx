import { Filter, List, Trash2 } from 'lucide-react';
import { useEffect } from 'react';

import { Authorized, useAuthorizations } from '@/react/hooks/useUser';

import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import { createPersistedStore, refreshableSettings } from '@@/datatables/types';
import { Button } from '@@/buttons';
import { useRepeater } from '@@/datatables/useRepeater';
import { useTableState } from '@@/datatables/useTableState';
import { PortainerSelect } from '@@/form-components/PortainerSelect';
import { InputGroup } from '@@/form-components/InputGroup';
import { Icon } from '@@/Icon';

import { SystemResourcesAlert } from '../../datatables/SystemResourcesAlert';
import { KubernetesStack } from '../types';
import { systemResourcesSettings } from '../../datatables/SystemResourcesSettings';

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
  namespaces: Namespace[];
  onNamespaceChange(namespace: string): void;
}

export function ApplicationsStacksDatatable({
  dataset,
  onRemove,
  onRefresh,
  namespace = '',
  namespaces,
  onNamespaceChange,
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
        <div className="w-full">
          <SystemResourcesAlert
            showSystemResources={tableState.showSystemResources}
          />

          <NamespaceFilter
            namespaces={namespaces}
            value={namespace}
            onChange={onNamespaceChange}
            showSystem={tableState.showSystemResources}
          />
        </div>
      }
      renderTableActions={(selectedRows) => (
        <>
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
          {/* <div class="form-group namespaces !mb-0 !mr-0 !h-[30px] w-fit min-w-[140px]">
          <div class="input-group">
            <span class="input-group-addon">
              <pr-icon icon="'filter'" size="'sm'"></pr-icon>
              Namespace
            </span>
            <select
              class="form-control !h-[30px] !py-1"
              ng-model="$ctrl.state.namespace"
              ng-change="$ctrl.onChangeNamespace()"
              data-cy="component-namespaceSelect"
              ng-options="o.Value as (o.Name + (o.IsSystem ? ' - system' : '')) for o in $ctrl.state.namespaces"
            >
            </select>
          </div>
        </div> */}
        </>
      )}
      renderTableSettings={() => <StacksSettingsMenu settings={tableState} />}
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
      <PortainerSelect
        value={value || ''}
        onChange={onChange}
        options={[
          { label: 'All namespaces', value: '' },
          ...transformedNamespaces,
        ]}
        bindToBody
        data-cy="component-namespaceSelect"
      />
    </InputGroup>
  );
}
