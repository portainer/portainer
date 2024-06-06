import { Layers } from 'lucide-react';

import { Authorized, useAuthorizations } from '@/react/hooks/useUser';

import { refreshableSettings } from '@@/datatables/types';
import { Datatable, TableSettingsMenu } from '@@/datatables';
import { useTableStateWithStorage } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';
import { useRepeater } from '@@/datatables/useRepeater';
import { AddButton } from '@@/buttons';

import { systemResourcesSettings } from '../../datatables/SystemResourcesSettings';
import { CreateFromManifestButton } from '../../components/CreateFromManifestButton';
import {
  DefaultDatatableSettings,
  TableSettings,
} from '../../datatables/DefaultDatatableSettings';
import { SystemResourceDescription } from '../../datatables/SystemResourceDescription';
import { isDefaultNamespace } from '../isDefaultNamespace';

import { NamespaceViewModel } from './types';
import { useColumns } from './columns/useColumns';

export function NamespacesDatatable({
  dataset,
  onRemove,
  onRefresh,
}: {
  dataset: Array<NamespaceViewModel>;
  onRemove(items: Array<NamespaceViewModel>): void;
  onRefresh(): void;
}) {
  const tableState = useTableStateWithStorage<TableSettings>(
    'kube-namespaces',
    'Name',
    (set) => ({
      ...systemResourcesSettings(set),
      ...refreshableSettings(set),
    })
  );

  const hasWriteAuthQuery = useAuthorizations(
    'K8sResourcePoolDetailsW',
    undefined,
    true
  );
  const columns = useColumns();
  useRepeater(tableState.autoRefreshRate, onRefresh);

  const filteredDataset = tableState.showSystemResources
    ? dataset
    : dataset.filter((item) => !item.Namespace.IsSystem);

  return (
    <Datatable
      data-cy="k8sNamespace-namespaceTable"
      dataset={filteredDataset}
      columns={columns}
      settingsManager={tableState}
      title="Namespaces"
      titleIcon={Layers}
      getRowId={(item) => item.Namespace.Id}
      isRowSelectable={({ original: item }) =>
        hasWriteAuthQuery.authorized &&
        !item.Namespace.IsSystem &&
        !isDefaultNamespace(item.Namespace.Name)
      }
      renderTableActions={(selectedItems) => (
        <Authorized authorizations="K8sResourcePoolDetailsW" adminOnlyCE>
          <DeleteButton
            onClick={() => onRemove(selectedItems)}
            disabled={selectedItems.length === 0}
            data-cy="delete-namespace-button"
          />

          <AddButton color="secondary" data-cy="add-namespace-form-button">
            Add with form
          </AddButton>

          <CreateFromManifestButton data-cy="k8s-namespaces-deploy-button" />
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
  );
}
