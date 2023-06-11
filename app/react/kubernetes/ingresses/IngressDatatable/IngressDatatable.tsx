import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from '@uirouter/react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useNamespaces } from '@/react/kubernetes/namespaces/queries';
import { useAuthorizations, Authorized } from '@/react/hooks/useUser';
import Route from '@/assets/ico/route.svg?c';

import { confirmDelete } from '@@/modals/confirm';
import { Datatable } from '@@/datatables';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

import { DeleteIngressesRequest, Ingress } from '../types';
import { useDeleteIngresses, useIngresses } from '../queries';

import { columns } from './columns';

import '../style.css';

interface SelectedIngress {
  Namespace: string;
  Name: string;
}
const storageKey = 'ingressClassesNameSpace';

const settingsStore = createPersistedStore(storageKey);

export function IngressDatatable() {
  const environmentId = useEnvironmentId();

  const { data: namespaces, ...namespacesQuery } = useNamespaces(environmentId);
  const ingressesQuery = useIngresses(
    environmentId,
    Object.keys(namespaces || {})
  );

  const deleteIngressesMutation = useDeleteIngresses();
  const tableState = useTableState(settingsStore, storageKey);

  const router = useRouter();

  return (
    <Datatable
      settingsManager={tableState}
      dataset={ingressesQuery.data || []}
      columns={columns}
      isLoading={ingressesQuery.isLoading || namespacesQuery.isLoading}
      emptyContentLabel="No supported ingresses found"
      title="Ingresses"
      titleIcon={Route}
      getRowId={(row) => row.Name + row.Type + row.Namespace}
      renderTableActions={tableActions}
      disableSelect={useCheckboxes()}
    />
  );

  function tableActions(selectedFlatRows: Ingress[]) {
    return (
      <div className="ingressDatatable-actions">
        <Authorized authorizations="AzureContainerGroupDelete">
          <Button
            className="btn-wrapper"
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
            <Button
              icon={Plus}
              className="btn-wrapper vertical-center"
              color="secondary"
            >
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
            <Button icon={Plus} className="btn-wrapper">
              Create from manifest
            </Button>
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
