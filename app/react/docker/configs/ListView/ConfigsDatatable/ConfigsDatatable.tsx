import { Clipboard } from 'lucide-react';

import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { AddButton } from '@@/buttons';
import { useTableState } from '@@/datatables/useTableState';

import { useConfigsList } from '../queries/useConfigsList';

import { columns } from './columns';
import { createStore } from './store';
import { DeleteConfigButton } from './DeleteConfigButton';

const storageKey = 'docker_configs';
const settingsStore = createStore(storageKey);

export function ConfigsDatatable() {
  const environmentId = useEnvironmentId();

  const tableState = useTableState(settingsStore, storageKey);

  const configListQuery = useConfigsList(environmentId, {
    refetchInterval: tableState.autoRefreshRate * 1000,
  });

  const hasWriteAccessQuery = useAuthorizations([
    'DockerConfigCreate',
    'DockerConfigDelete',
  ]);

  if (!configListQuery.data) {
    return null;
  }

  const dataset = configListQuery.data;

  return (
    <Datatable
      dataset={dataset}
      columns={columns}
      settingsManager={tableState}
      title="Configs"
      titleIcon={Clipboard}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRate}
            onChange={(value) => tableState.setAutoRefreshRate(value)}
          />
        </TableSettingsMenu>
      )}
      disableSelect={!hasWriteAccessQuery.authorized}
      data-cy="configs-datatable"
      renderTableActions={(selectedRows) =>
        hasWriteAccessQuery.authorized && (
          <div className="flex items-center gap-3">
            <Authorized authorizations="DockerConfigDelete">
              <DeleteConfigButton selectedItems={selectedRows} />
            </Authorized>

            <Authorized authorizations="DockerConfigCreate">
              <AddButton data-cy="add-docker-config-button">
                Add config
              </AddButton>
            </Authorized>
          </div>
        )
      }
    />
  );
}
