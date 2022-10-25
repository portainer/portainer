import { Plus, Share2, Trash2 } from 'lucide-react';
import clsx from 'clsx';

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

import { DockerNetworkViewModel } from './types';
import { useColumns } from './columns';

const storageKey = 'docker.networks';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

const settingsStore = createPersistedStore<TableSettings>(
  storageKey,
  'name',
  (set) => ({
    ...refreshableSettings(set),
  })
);

type DatasetType = Array<DockerNetworkViewModel>;
interface Props {
  dataset: DatasetType;
  onRemove(selectedItems: DatasetType): void;
  onRefresh(): Promise<void>;
}

export function NetworksDatatable({ dataset, onRemove, onRefresh }: Props) {
  const environmentId = useEnvironmentId();
  const settings = useTableState(settingsStore, storageKey);
  const isSwarm = useIsSwarm(environmentId);
  const columns = useColumns(isSwarm);
  useRepeater(settings.autoRefreshRate, onRefresh);

  return (
    <ExpandableDatatable<DockerNetworkViewModel>
      settingsManager={settings}
      title="Networks"
      titleIcon={Share2}
      dataset={dataset}
      columns={columns}
      getRowCanExpand={({ original: item }) =>
        !!(item.Subs && item.Subs?.length > 0)
      }
      renderSubRow={(row) => (
        <>
          {row.original.Subs &&
            row.original.Subs.map((network, idx) => (
              <tr
                key={`${network.Id}-${idx}`}
                className={clsx({
                  'datatable-highlighted': row.original.Highlighted,
                  'datatable-unhighlighted': !row.original.Highlighted,
                })}
              >
                <td />
                <td>TEST</td>
                {/* <td colSpan={row.cells.length - 1}>
                <Link
                  to="kubernetes.applications.application"
                  params={{ name: app.Name, namespace: app.ResourcePool }}
                >
                  {app.Name}
                </Link>
                {KubernetesNamespaceHelper.isSystemNamespace(
                  app.ResourcePool
                ) &&
                  KubernetesApplicationHelper.isExternalApplication(app) && (
                    <span className="space-left label label-primary image-tag">
                      external
                    </span>
                  )}
              </td> */}
              </tr>
            ))}
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
