import { useRouter } from '@uirouter/react';
import { useMemo } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useAuthorizations, Authorized } from '@/react/hooks/useUser';
import Route from '@/assets/ico/route.svg?c';
import { DefaultDatatableSettings } from '@/react/kubernetes/datatables/DefaultDatatableSettings';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { AddButton } from '@@/buttons';
import { useTableState } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { DeleteIngressesRequest, Ingress } from '../types';
import { useDeleteIngresses, useIngresses } from '../queries';
import { useNamespacesQuery } from '../../namespaces/queries/useNamespacesQuery';
import { Namespaces } from '../../namespaces/types';
import { CreateFromManifestButton } from '../../components/CreateFromManifestButton';

import { columns } from './columns';

import '../style.css';

interface SelectedIngress {
  Namespace: string;
  Name: string;
}
const storageKey = 'ingressClassesNameSpace';

const settingsStore = createStore(storageKey);

export function IngressDatatable() {
  const tableState = useTableState(settingsStore, storageKey);
  const environmentId = useEnvironmentId();

  const { authorized: canAccessSystemResources } = useAuthorizations(
    'K8sAccessSystemNamespaces'
  );
  const { data: namespaces, ...namespacesQuery } =
    useNamespacesQuery(environmentId);
  const { data: ingresses, ...ingressesQuery } = useIngresses(
    environmentId,
    Object.keys(namespaces || {}),
    {
      autoRefreshRate: tableState.autoRefreshRate * 1000,
    }
  );

  const filteredIngresses = useMemo(
    () =>
      ingresses?.filter(
        (ingress) =>
          (canAccessSystemResources && tableState.showSystemResources) ||
          !namespaces?.[ingress.Namespace].IsSystem
      ) || [],
    [ingresses, tableState, canAccessSystemResources, namespaces]
  );

  const ingressesWithIsSystem = useIngressesRowData(
    filteredIngresses || [],
    namespaces
  );

  const deleteIngressesMutation = useDeleteIngresses();

  const router = useRouter();

  return (
    <Datatable
      settingsManager={tableState}
      dataset={ingressesWithIsSystem}
      columns={columns}
      isLoading={ingressesQuery.isLoading || namespacesQuery.isLoading}
      emptyContentLabel="No supported ingresses found"
      title="Ingresses"
      titleIcon={Route}
      getRowId={(row) => row.Name + row.Type + row.Namespace}
      isRowSelectable={(row) => !namespaces?.[row.original.Namespace].IsSystem}
      renderTableActions={tableActions}
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
      disableSelect={useCheckboxes()}
    />
  );

  // useIngressesRowData appends the `isSyetem` property to the service data
  function useIngressesRowData(
    ingresses: Ingress[],
    namespaces?: Namespaces
  ): Ingress[] {
    return useMemo(
      () =>
        ingresses.map((r) => ({
          ...r,
          IsSystem: namespaces ? namespaces?.[r.Namespace].IsSystem : false,
        })),
      [ingresses, namespaces]
    );
  }

  function tableActions(selectedFlatRows: Ingress[]) {
    return (
      <Authorized authorizations="K8sIngressesW">
        <DeleteButton
          disabled={selectedFlatRows.length === 0}
          onConfirmed={() => handleRemoveClick(selectedFlatRows)}
          data-cy="k8sSecret-removeSecretButton"
          confirmMessage="Are you sure you want to delete the selected ingresses?"
        />

        <AddButton to=".create" color="secondary">
          Add with form
        </AddButton>

        <CreateFromManifestButton />
      </Authorized>
    );
  }

  function useCheckboxes() {
    const { authorized } = useAuthorizations(['K8sIngressesW']);
    return !authorized;
  }

  async function handleRemoveClick(ingresses: SelectedIngress[]) {
    const payload: DeleteIngressesRequest = {} as DeleteIngressesRequest;
    ingresses.forEach((ingress) => {
      payload[ingress.Namespace] = payload[ingress.Namespace] || [];
      payload[ingress.Namespace].push(ingress.Name);
    });

    deleteIngressesMutation.mutate(
      { environmentId, data: payload },
      {
        onSuccess: () => {
          router.stateService.reload();
        },
      }
    );
  }
}
