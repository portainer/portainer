import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from '@uirouter/react';
import { useMemo } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useAuthorizations, Authorized } from '@/react/hooks/useUser';
import Route from '@/assets/ico/route.svg?c';
import { DefaultDatatableSettings } from '@/react/kubernetes/datatables/DefaultDatatableSettings';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';

import { confirmDelete } from '@@/modals/confirm';
import { Datatable, TableSettingsMenu } from '@@/datatables';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';
import { useTableState } from '@@/datatables/useTableState';

import { DeleteIngressesRequest, Ingress } from '../types';
import { useDeleteIngresses, useIngresses } from '../queries';
import { useNamespacesQuery } from '../../namespaces/queries/useNamespacesQuery';
import { Namespaces } from '../../namespaces/types';

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

  const canAccessSystemResources = useAuthorizations(
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
      <div className="ingressDatatable-actions">
        <Authorized authorizations="AzureContainerGroupDelete">
          <Button
            color="dangerlight"
            disabled={selectedFlatRows.length === 0}
            onClick={() => handleRemoveClick(selectedFlatRows)}
            icon={Trash2}
          >
            Remove
          </Button>
        </Authorized>

        <Authorized authorizations="K8sIngressesW">
          <Link
            to="kubernetes.ingresses.create"
            className="space-left no-decoration"
          >
            <Button icon={Plus} color="secondary">
              Add with form
            </Button>
          </Link>
        </Authorized>
        <Authorized authorizations="K8sIngressesW">
          <Link
            to="kubernetes.deploy"
            className="space-left no-decoration"
            params={{ referrer: 'kubernetes.ingresses' }}
          >
            <Button icon={Plus}>Create from manifest</Button>
          </Link>
        </Authorized>
      </div>
    );
  }

  function useCheckboxes() {
    return !useAuthorizations(['K8sIngressesW']);
  }

  async function handleRemoveClick(ingresses: SelectedIngress[]) {
    const confirmed = await confirmDelete(
      'Are you sure you want to delete the selected ingresses?'
    );
    if (!confirmed) {
      return null;
    }

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
    return ingresses;
  }
}
