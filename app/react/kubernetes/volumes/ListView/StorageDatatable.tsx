import { createColumnHelper } from '@tanstack/react-table';
import { HardDrive } from 'lucide-react';

import { TableSettingsMenu } from '@@/datatables';
import {
  BasicTableSettings,
  RefreshableTableSettings,
  refreshableSettings,
} from '@@/datatables/types';
import { useTableStateWithStorage } from '@@/datatables/useTableState';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { useRepeater } from '@@/datatables/useRepeater';
import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import { buildExpandColumn } from '@@/datatables/expand-column';
import { Link } from '@@/Link';

import { StorageClassViewModel } from './types';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

const helper = createColumnHelper<StorageClassViewModel>();

const columns = [
  buildExpandColumn<StorageClassViewModel>(),
  helper.accessor('Name', {
    header: 'Storage',
  }),
  helper.accessor('size', {
    header: 'Usage',
  }),
];

export function StorageDatatable({
  dataset,
  onRefresh,
}: {
  dataset: Array<StorageClassViewModel>;
  onRefresh: () => void;
}) {
  const tableState = useTableStateWithStorage<TableSettings>(
    'kubernetes.volumes.storages',
    'Name',
    (set) => ({
      ...refreshableSettings(set),
    })
  );

  useRepeater(tableState.autoRefreshRate, onRefresh);

  return (
    <ExpandableDatatable
      noWidget
      disableSelect
      dataset={dataset}
      columns={columns}
      title="Storage"
      titleIcon={HardDrive}
      settingsManager={tableState}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRate}
            onChange={(value) => tableState.setAutoRefreshRate(value)}
          />
        </TableSettingsMenu>
      )}
      getRowCanExpand={(row) => row.original.Volumes.length > 0}
      renderSubRow={(row) => <SubRow item={row.original} />}
    />
  );
}

function SubRow({ item }: { item: StorageClassViewModel }) {
  return (
    <>
      {item.Volumes.map((vol) => (
        <tr key={vol.PersistentVolumeClaim.Id}>
          <td />
          <td>
            <Link
              to="kubernetes.volumes.volume"
              params={{
                name: vol.PersistentVolumeClaim.Name,
                namespace: vol.PersistentVolumeClaim.Namespace,
              }}
            >
              {vol.PersistentVolumeClaim.Name}
            </Link>
          </td>
          <td>{vol.PersistentVolumeClaim.Storage}</td>
        </tr>
      ))}
    </>
  );
}
