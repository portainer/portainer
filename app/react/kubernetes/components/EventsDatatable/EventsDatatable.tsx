import { History } from 'lucide-react';
import { ReactNode } from 'react';

import { Event } from '@/react/kubernetes/queries/types';
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
  title?: ReactNode;
  titleIcon?: ReactNode;
};

export function EventsDatatable({
  dataset,
  tableState,
  isLoading,
  'data-cy': dataCy,
  noWidget,
  title = 'Events',
  titleIcon = History,
}: Props) {
  return (
    <Datatable<IndexOptional<Event>>
      dataset={dataset}
      columns={columns}
      settingsManager={tableState}
      isLoading={isLoading}
      title={title}
      titleIcon={titleIcon}
      getRowId={(row) => row.uid || ''}
      disableSelect
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRateMS}
            onChange={(value) => tableState.setAutoRefreshRate(value)}
          />
        </TableSettingsMenu>
      )}
      data-cy={dataCy}
      noWidget={noWidget}
    />
  );
}
