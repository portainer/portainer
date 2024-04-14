import LaptopCode from '@/assets/ico/laptop-code.svg?c';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { useRepeater } from '@@/datatables/useRepeater';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { useTableStateWithStorage } from '@@/datatables/useTableState';
import {
  BasicTableSettings,
  refreshableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';

import { columns } from './columns';
import { IntegratedApp } from './types';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

export function IntegratedAppsDatatable({
  dataset,
  onRefresh,
  isLoading,
  tableKey,
  tableTitle,
  dataCy,
}: {
  dataset: Array<IntegratedApp>;
  onRefresh: () => void;
  isLoading: boolean;
  tableKey: string;
  tableTitle: string;
  dataCy: string;
}) {
  const tableState = useTableStateWithStorage<TableSettings>(
    tableKey,
    'Name',
    (set) => ({
      ...refreshableSettings(set),
    })
  );
  useRepeater(tableState.autoRefreshRate, onRefresh);

  return (
    <Datatable
      dataset={dataset}
      settingsManager={tableState}
      columns={columns}
      disableSelect
      title={tableTitle}
      titleIcon={LaptopCode}
      isLoading={isLoading}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRate}
            onChange={tableState.setAutoRefreshRate}
          />
        </TableSettingsMenu>
      )}
      data-cy={dataCy}
    />
  );
}
