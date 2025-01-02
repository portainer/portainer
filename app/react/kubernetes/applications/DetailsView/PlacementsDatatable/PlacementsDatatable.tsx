import { Minimize2 } from 'lucide-react';

import {
  BasicTableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';
import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import { TableSettingsMenu } from '@@/datatables';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { TextTip } from '@@/Tip/TextTip';

import { NodePlacementRowData } from '../types';

import { SubRow } from './PlacementsDatatableSubRow';
import { columns } from './columns';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

type Props = {
  isLoading: boolean;
  dataset: NodePlacementRowData[];
  hasPlacementWarning: boolean;
  tableState: TableSettings & {
    setSearch: (value: string) => void;
    search: string;
  };
};

export function PlacementsDatatable({
  isLoading,
  dataset,
  hasPlacementWarning,
  tableState,
}: Props) {
  return (
    <ExpandableDatatable
      isLoading={isLoading}
      getRowCanExpand={(row) => !row.original.acceptsApplication}
      title="Nodes vs. placement constraints/preferences"
      titleIcon={Minimize2}
      dataset={dataset}
      settingsManager={tableState}
      getRowId={(row) => row.name}
      columns={columns}
      disableSelect
      description={
        hasPlacementWarning ? (
          <TextTip>
            Based on the placement rules, the application pod can&apos;t be
            scheduled on any nodes.
          </TextTip>
        ) : (
          <TextTip color="blue">
            The table below shows whether or not this application can be
            deployed on the nodes listed.
          </TextTip>
        )
      }
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRate}
            onChange={tableState.setAutoRefreshRate}
          />
        </TableSettingsMenu>
      )}
      renderSubRow={(row) => (
        <SubRow node={row.original} cellCount={row.getVisibleCells().length} />
      )}
      data-cy="kubernetes-application-placements-datatable"
    />
  );
}
