import { Radio } from 'lucide-react';

import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { url } from '@/react/portainer/registries/ListView/RegistriesDatatable/columns/url';
import { AddButton } from '@/react/portainer/registries/ListView/RegistriesDatatable/AddButton';

import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

import { name } from './columns/name';
import { actions } from './columns/actions';

const columns = [name, url, actions];

const tableKey = 'registries';

const store = createPersistedStore(tableKey);

export function EnvironmentRegistriesDatatable() {
  const environmentId = useEnvironmentId();
  const query = useEnvironmentRegistries(environmentId);

  const tableState = useTableState(store, tableKey);

  return (
    <Datatable
      columns={columns}
      dataset={query.data || []}
      isLoading={query.isLoading}
      settingsManager={tableState}
      title="Registries"
      titleIcon={Radio}
      renderTableActions={() => <AddButton />}
      disableSelect
      data-cy="environment-registries-datatable"
    />
  );
}
