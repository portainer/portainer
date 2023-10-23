import { Plus, Share2, Trash2 } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import {
  BasicTableSettings,
  createPersistedStore,
  refreshableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';
import { Button } from '@@/buttons';
import { TableSettingsMenu } from '@@/datatables';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { useRepeater } from '@@/datatables/useRepeater';
import { useTableState } from '@@/datatables/useTableState';
import { Link } from '@@/Link';

import { useIsSwarm } from '../../proxy/queries/useInfo';

import { useColumns } from './columns';
import { DecoratedNetwork } from './types';
import { NestedNetworksDatatable } from './NestedNetwordsTable';

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
      titleIcon={Share2}
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
      emptyContentLabel="No networks available."
      renderTableActions={(selectedRows) => (
        <div className="flex gap-3">
          <Authorized
            authorizations={['DockerNetworkDelete', 'DockerNetworkCreate']}
          >
            <Button
              disabled={selectedRows.length === 0}
              color="dangerlight"
              onClick={() => onRemove(selectedRows)}
              icon={Trash2}
            >
              Remove
            </Button>
          </Authorized>
          <Authorized
            authorizations="DockerNetworkCreate"
            data-cy="network-addNetworkButton"
          >
            <Button icon={Plus} as={Link} props={{ to: '.new' }}>
              Add network
            </Button>
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
    />
  );
}
