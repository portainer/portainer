import { Plus, Trash2 } from 'react-feather';
import { useRouter } from '@uirouter/react';

import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { useNamespaces } from '@/react/kubernetes/namespaces/queries';
import { Authorized } from '@/portainer/hooks/useUser';
import { confirmDeletionAsync } from '@/portainer/services/modal.service/confirm';

import { Datatable } from '@@/datatables';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';

import { DeleteIngressesRequest, Ingress } from '../types';
import { useDeleteIngresses, useIngresses } from '../queries';

import { createStore } from './datatable-store';
import { useColumns } from './columns';

import '../style.css';

interface SelectedIngress {
  Namespace: string;
  Name: string;
}

const useStore = createStore('ingresses');

export function IngressDataTable() {
  const environmentId = useEnvironmentId();

  const nsResult = useNamespaces(environmentId);
  const result = useIngresses(environmentId, Object.keys(nsResult?.data || {}));

  const settings = useStore();

  const columns = useColumns();
  const deleteIngressesMutation = useDeleteIngresses();

  const router = useRouter();

  return (
    <Datatable
      dataset={result.data || []}
      storageKey="ingressClassesNameSpace"
      columns={columns}
      settingsStore={settings}
      isLoading={result.isLoading}
      emptyContentLabel="No supported ingresses found"
      titleOptions={{
        icon: 'svg-route',
        title: 'Ingresses',
      }}
      getRowId={(row) => row.Name + row.Type + row.Namespace}
      renderTableActions={tableActions}
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
            onClick={() =>
              handleRemoveClick(
                selectedFlatRows.map((row) => ({
                  Name: row.Name,
                  Namespace: row.Namespace,
                }))
              )
            }
            icon={Trash2}
          >
            Remove
          </Button>
        </Authorized>

        <Authorized authorizations="K8sIngressesAdd">
          <Link to="kubernetes.ingresses.create" className="space-left">
            <Button
              icon={Plus}
              className="btn-wrapper vertical-center"
              color="secondary"
            >
              Add with form
            </Button>
          </Link>
        </Authorized>
        <Authorized authorizations="K8sApplicationsW">
          <Link to="kubernetes.deploy" className="space-left">
            <Button icon={Plus} className="btn-wrapper">
              Create from manifest
            </Button>
          </Link>
        </Authorized>
      </div>
    );
  }

  async function handleRemoveClick(ingresses: SelectedIngress[]) {
    const confirmed = await confirmDeletionAsync(
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
