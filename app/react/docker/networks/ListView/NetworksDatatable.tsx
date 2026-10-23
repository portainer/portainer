import { Network } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import {
  BasicTableSettings,
  createPersistedStore,
  refreshableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';
import { AddButton } from '@@/buttons';
import { TableSettingsMenu } from '@@/datatables';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { useTableState } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { useIsSwarm } from '../../proxy/queries/useInfo';

import { useColumns } from './columns';
import { DecoratedNetwork } from './types';
import { NestedNetworksDatatable } from './NestedNetworksTable';
import { useNetworksData } from './useNetworksData';

const storageKey = 'docker.networks';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

const settingsStore = createPersistedStore<TableSettings>(
  storageKey,
  'name',
  (set) => ({
    ...refreshableSettings(set),
  })
);

interface Props {
  onRemove(
    selectedItems: Array<{ nodeName?: string; id: string; name: string }>
  ): void;
}

export function NetworksDatatable({ onRemove }: Props) {
  const settings = useTableState(settingsStore, storageKey);

  const environmentId = useEnvironmentId();
  const isSwarm = useIsSwarm(environmentId);

  const datasetQuery = useNetworksData(settings.autoRefreshRateMS);
  const columns = useColumns(isSwarm);

  const dataset = datasetQuery.data;

  return (
    <ExpandableDatatable<DecoratedNetwork>
      settingsManager={settings}
      title="Networks"
      titleIcon={Network}
      dataset={dataset || []}
      columns={columns}
      isLoading={datasetQuery.isLoading}
      getRowCanExpand={({ original: item }) =>
        !!(item.Subs && item.Subs?.length > 0)
      }
      isRowSelectable={({ original: item }) => !item.ResourceControl?.System}
      renderSubRow={(row) => (
        <>
          {row.original.Subs && (
            <tr>
              <td colSpan={Number.MAX_SAFE_INTEGER}>
                <NestedNetworksDatatable dataset={row.original.Subs} />
              </td>
            </tr>
          )}
        </>
      )}
      renderTableActions={(selectedRows) => (
        <div className="flex gap-3">
          <Authorized
            authorizations={['DockerNetworkDelete', 'DockerNetworkCreate']}
          >
            <DeleteButton
              disabled={selectedRows.length === 0}
              data-cy="network-removeNetworkButton"
              confirmMessage="Do you want to remove the selected network(s)?"
              onConfirmed={() =>
                onRemove(
                  selectedRows.map((n) => ({
                    id: n.Id,
                    name: n.Name,
                    nodeName: n.NodeName,
                  }))
                )
              }
            />
          </Authorized>
          <Authorized authorizations="DockerNetworkCreate">
            <AddButton data-cy="network-addNetworkButton">
              Add network
            </AddButton>
          </Authorized>
        </div>
      )}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            onChange={settings.setAutoRefreshRate}
            value={settings.autoRefreshRateMS}
          />
        </TableSettingsMenu>
      )}
      getRowId={(row) => `${row.Name}-${row.Id}`}
      data-cy="networks-datatable"
    />
  );
}
