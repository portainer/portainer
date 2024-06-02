import { Event } from 'kubernetes-types/core/v1';
import { History } from 'lucide-react';

import { IndexOptional } from '@/react/kubernetes/configs/types';
import { TableSettings } from '@/react/kubernetes/datatables/DefaultDatatableSettings';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { TableState } from '@@/datatables/useTableState';

import { columns } from './columns';

type Props = {
  dataset: Event[];
  tableState: TableState<TableSettings>;
  isLoading: boolean;
  'data-cy': string;
  noWidget?: boolean;
};

export function EventsDatatable({
  dataset,
  tableState,
  isLoading,
  'data-cy': dataCy,
  noWidget,
}: Props) {
  return (
    <Datatable<IndexOptional<Event>>
      dataset={dataset}
      columns={columns}
      settingsManager={tableState}
      isLoading={isLoading}
      title="Events"
      titleIcon={History}
      getRowId={(row) => row.metadata?.uid || ''}
      disableSelect
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRate}
            onChange={(value) => tableState.setAutoRefreshRate(value)}
          />
        </TableSettingsMenu>
      )}
      data-cy={dataCy}
      noWidget={noWidget}
    />
  );
}
