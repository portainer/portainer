import { Row, TableRowProps } from 'react-table';
import { Shuffle, Trash2 } from 'lucide-react';
import { useStore } from 'zustand';
import { useRouter } from '@uirouter/react';
import clsx from 'clsx';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import {
  Authorized,
  useAuthorizations,
  useCurrentUser,
} from '@/react/hooks/useUser';
import KubernetesNamespaceHelper from '@/kubernetes/helpers/namespaceHelper';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';

import { Datatable, Table, TableSettingsMenu } from '@@/datatables';
import { confirmDelete } from '@@/modals/confirm';
import { useSearchBarState } from '@@/datatables/SearchBar';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';

import { useMutationDeleteServices, useServices } from '../service';
import { Service } from '../types';
import { DefaultDatatableSettings } from '../../datatables/DefaultDatatableSettings';

import { useColumns } from './columns';
import { createStore } from './datatable-store';
import { ServicesDatatableDescription } from './ServicesDatatableDescription';

const storageKey = 'k8sServicesDatatable';
const settingsStore = createStore(storageKey);

export function ServicesDatatable() {
  const environmentId = useEnvironmentId();
  const servicesQuery = useServices(environmentId);

  const settings = useStore(settingsStore);

  const [search, setSearch] = useSearchBarState(storageKey);
  const columns = useColumns();
  const readOnly = !useAuthorizations(['K8sServiceW']);
  const { isAdmin } = useCurrentUser();

  const filteredServices = servicesQuery.data?.filter(
    (service) =>
      (isAdmin && settings.showSystemResources) ||
      !KubernetesNamespaceHelper.isSystemNamespace(service.Namespace)
  );

  return (
    <Datatable
      dataset={filteredServices || []}
      columns={columns}
      isLoading={servicesQuery.isLoading}
      emptyContentLabel="No services found"
      title="Services"
      titleIcon={Shuffle}
      getRowId={(row) => row.UID}
      isRowSelectable={(row) =>
        !KubernetesNamespaceHelper.isSystemNamespace(row.values.namespace)
      }
      disableSelect={readOnly}
      renderTableActions={(selectedRows) => (
        <TableActions selectedItems={selectedRows} />
      )}
      initialPageSize={settings.pageSize}
      onPageSizeChange={settings.setPageSize}
      initialSortBy={settings.sortBy}
      onSortByChange={settings.setSortBy}
      searchValue={search}
      onSearchChange={setSearch}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <DefaultDatatableSettings
            settings={settings}
            hideShowSystemResources={!isAdmin}
          />
        </TableSettingsMenu>
      )}
      description={
        <ServicesDatatableDescription
          showSystemResources={settings.showSystemResources || !isAdmin}
        />
      }
      renderRow={servicesRenderRow}
    />
  );
}

// needed to apply custom styling to the row cells and not globally.
// required in the AC's for this ticket.
function servicesRenderRow<D extends Record<string, unknown>>(
  row: Row<D>,
  rowProps: TableRowProps,
  highlightedItemId?: string
) {
  return (
    <Table.Row<D>
      key={rowProps.key}
      cells={row.cells}
      className={clsx('[&>td]:!py-4 [&>td]:!align-top', rowProps.className, {
        active: highlightedItemId === row.id,
      })}
      role={rowProps.role}
      style={rowProps.style}
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
        <p>Are you sure you want to delete the selected service(s)?</p>
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
      <Authorized authorizations="K8sServiceW">
        <Button
          className="btn-wrapper"
          color="dangerlight"
          disabled={selectedItems.length === 0}
          onClick={() => handleRemoveClick(selectedItems)}
          icon={Trash2}
        >
          Remove
        </Button>

        <Link to="kubernetes.deploy" className="space-left">
          <Button className="btn-wrapper" color="primary" icon="plus">
            Create from manifest
          </Button>
        </Link>
      </Authorized>
    </div>
  );
}
