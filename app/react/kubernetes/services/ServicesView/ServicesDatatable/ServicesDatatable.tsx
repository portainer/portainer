import { Shuffle, Trash2 } from 'lucide-react';
import { useRouter } from '@uirouter/react';
import clsx from 'clsx';
import { Row } from '@tanstack/react-table';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import {
  Authorized,
  useAuthorizations,
  useCurrentUser,
} from '@/react/hooks/useUser';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { pluralize } from '@/portainer/helpers/strings';

import { Datatable, Table, TableSettingsMenu } from '@@/datatables';
import { confirmDelete } from '@@/modals/confirm';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';
import { useTableState } from '@@/datatables/useTableState';

import {
  useMutationDeleteServices,
  useServicesForCluster,
} from '../../service';
import { Service } from '../../types';
import { DefaultDatatableSettings } from '../../../datatables/DefaultDatatableSettings';
import { isSystemNamespace } from '../../../namespaces/utils';
import { useNamespaces } from '../../../namespaces/queries';
import { SystemResourceDescription } from '../../../datatables/SystemResourceDescription';

import { columns } from './columns';
import { createStore } from './datatable-store';

const storageKey = 'k8sServicesDatatable';
const settingsStore = createStore(storageKey);

export function ServicesDatatable() {
  const tableState = useTableState(settingsStore, storageKey);
  const environmentId = useEnvironmentId();
  const { data: namespaces, ...namespacesQuery } = useNamespaces(environmentId);
  const namespaceNames = (namespaces && Object.keys(namespaces)) || [];
  const { data: services, ...servicesQuery } = useServicesForCluster(
    environmentId,
    namespaceNames,
    {
      autoRefreshRate: tableState.autoRefreshRate * 1000,
    }
  );

  const readOnly = !useAuthorizations(['K8sServiceW']);
  const { isAdmin } = useCurrentUser();

  const filteredServices = services?.filter(
    (service) =>
      (isAdmin && tableState.showSystemResources) ||
      !isSystemNamespace(service.Namespace)
  );

  return (
    <Datatable
      dataset={filteredServices || []}
      columns={columns}
      settingsManager={tableState}
      isLoading={servicesQuery.isLoading || namespacesQuery.isLoading}
      emptyContentLabel="No services found"
      title="Services"
      titleIcon={Shuffle}
      getRowId={(row) => row.UID}
      isRowSelectable={(row) => !isSystemNamespace(row.original.Namespace)}
      disableSelect={readOnly}
      renderTableActions={(selectedRows) => (
        <TableActions selectedItems={selectedRows} />
      )}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <DefaultDatatableSettings
            settings={tableState}
            hideShowSystemResources={!isAdmin}
          />
        </TableSettingsMenu>
      )}
      description={
        <SystemResourceDescription
          showSystemResources={tableState.showSystemResources || !isAdmin}
        />
      }
      renderRow={servicesRenderRow}
    />
  );
}

// needed to apply custom styling to the row cells and not globally.
// required in the AC's for this ticket.
function servicesRenderRow(row: Row<Service>, highlightedItemId?: string) {
  return (
    <Table.Row<Service>
      cells={row.getVisibleCells()}
      className={clsx('[&>td]:!py-4 [&>td]:!align-top', {
        active: highlightedItemId === row.id,
      })}
    />
  );
}

interface SelectedService {
  Namespace: string;
  Name: string;
}

type TableActionsProps = {
  selectedItems: Service[];
};

function TableActions({ selectedItems }: TableActionsProps) {
  const environmentId = useEnvironmentId();
  const deleteServicesMutation = useMutationDeleteServices(environmentId);
  const router = useRouter();

  async function handleRemoveClick(services: SelectedService[]) {
    const confirmed = await confirmDelete(
      <>
        <p>{`Are you sure you want to remove the selected ${pluralize(
          services.length,
          'service'
        )}?`}</p>
        <ul className="pl-6">
          {services.map((s, index) => (
            <li key={index}>
              {s.Namespace}/{s.Name}
            </li>
          ))}
        </ul>
      </>
    );
    if (!confirmed) {
      return null;
    }

    const payload: Record<string, string[]> = {};
    services.forEach((service) => {
      payload[service.Namespace] = payload[service.Namespace] || [];
      payload[service.Namespace].push(service.Name);
    });

    deleteServicesMutation.mutate(
      { environmentId, data: payload },
      {
        onSuccess: () => {
          notifySuccess(
            'Services successfully removed',
            services.map((s) => `${s.Namespace}/${s.Name}`).join(', ')
          );
          router.stateService.reload();
        },
        onError: (error) => {
          notifyError(
            'Unable to delete service(s)',
            error as Error,
            services.map((s) => `${s.Namespace}/${s.Name}`).join(', ')
          );
        },
      }
    );
    return services;
  }

  return (
    <div className="servicesDatatable-actions">
      <Authorized authorizations="K8sServicesW">
        <Button
          className="btn-wrapper"
          color="dangerlight"
          disabled={selectedItems.length === 0}
          onClick={() => handleRemoveClick(selectedItems)}
          icon={Trash2}
        >
          Remove
        </Button>

        <Link
          to="kubernetes.deploy"
          params={{ referrer: 'kubernetes.services' }}
          className="space-left hover:no-decoration"
        >
          <Button className="btn-wrapper" color="primary" icon="plus">
            Create from manifest
          </Button>
        </Link>
      </Authorized>
    </div>
  );
}
