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
import { useRepeater } from '@@/datatables/useRepeater';
import { useTableState } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { useIsSwarm } from '../../proxy/queries/useInfo';

import { useColumns } from './columns';
import { DecoratedNetwork } from './types';
import { NestedNetworksDatatable } from './NestedNetworksTable';

const storageKey = 'docker.networks';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

const settingsStore = createPersistedStore<TableSettings>(
  storageKey,
  'name',
  (set) => ({
    ...refreshableSettings(set),
  })
);

type DatasetType = Array<DecoratedNetwork>;
interface Props {
  dataset: DatasetType;
  onRemove(selectedItems: DatasetType): void;
  onRefresh(): Promise<void>;
}

export function NetworksDatatable({ dataset, onRemove, onRefresh }: Props) {
  const settings = useTableState(settingsStore, storageKey);

  const environmentId = useEnvironmentId();
  const isSwarm = useIsSwarm(environmentId);

  const columns = useColumns(isSwarm);

  useRepeater(settings.autoRefreshRate, onRefresh);

  return (
    <ExpandableDatatable<DecoratedNetwork>
      settingsManager={settings}
      title="Networks"
      titleIcon={Network}
      dataset={dataset}
      columns={columns}
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
              onConfirmed={() => onRemove(selectedRows)}
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
            value={settings.autoRefreshRate}
          />
        </TableSettingsMenu>
      )}
      getRowId={(row) => `${row.Name}-${row.Id}`}
      data-cy="networks-datatable"
    />
  );
}
