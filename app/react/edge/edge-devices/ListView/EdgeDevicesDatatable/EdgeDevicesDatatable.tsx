import _ from 'lodash';
import { useStore } from 'zustand';
import { Box } from 'react-feather';
import { useState } from 'react';

import { EdgeTypes, Environment } from '@/react/portainer/environments/types';
import { EnvironmentGroup } from '@/react/portainer/environments/environment-groups/types';
import { useEnvironmentList } from '@/react/portainer/environments/queries/useEnvironmentList';

import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import { TableSettingsMenu } from '@@/datatables';
import { ColumnVisibilityMenu } from '@@/datatables/ColumnVisibilityMenu';
import { InformationPanel } from '@@/InformationPanel';
import { TextTip } from '@@/Tip/TextTip';
import { useSearchBarState } from '@@/datatables/SearchBar';

import { AMTDevicesDatatable } from './AMTDevicesDatatable';
import { columns } from './columns';
import { EdgeDevicesDatatableActions } from './EdgeDevicesDatatableActions';
import { EdgeDevicesDatatableSettings } from './EdgeDevicesDatatableSettings';
import { RowProvider } from './columns/RowContext';
import styles from './EdgeDevicesDatatable.module.css';
import { createStore } from './datatable-store';

export interface EdgeDevicesTableProps {
  storageKey: string;
  isFdoEnabled: boolean;
  isOpenAmtEnabled: boolean;
  showWaitingRoomLink: boolean;
  mpsServer: string;
  groups: EnvironmentGroup[];
}
const storageKey = 'edgeDevices';

const settingsStore = createStore(storageKey);

export function EdgeDevicesDatatable({
  isFdoEnabled,
  isOpenAmtEnabled,
  showWaitingRoomLink,
  mpsServer,
  groups,
}: EdgeDevicesTableProps) {
  const settings = useStore(settingsStore);
  const [page, setPage] = useState(0);

  const [search, setSearch] = useSearchBarState(storageKey);

  const hidableColumns = _.compact(
    columns.filter((col) => col.canHide).map((col) => col.id)
  );

  const { environments, isLoading, totalCount } = useEnvironmentList(
    {
      edgeDevice: true,
      search,
      types: EdgeTypes,
      excludeSnapshots: true,
      page: page + 1,
      pageLimit: settings.pageSize,
      sort: settings.sortBy.id,
      order: settings.sortBy.desc ? 'desc' : 'asc',
    },
    settings.autoRefreshRate * 1000
  );

  const someDeviceHasAMTActivated = environments.some(
    (environment) =>
      environment.AMTDeviceGUID && environment.AMTDeviceGUID !== ''
  );

  return (
    <>
      {isOpenAmtEnabled && someDeviceHasAMTActivated && (
        <InformationPanel>
          <div className={styles.kvmTip}>
            <TextTip color="blue">
              For the KVM function to work you need to have the MPS server added
              to your trusted site list, browse to this
              <a
                href={`https://${mpsServer}`}
                target="_blank"
                rel="noreferrer"
                className="mx-px"
              >
                site
              </a>
              and add to your trusted site list
            </TextTip>
          </div>
        </InformationPanel>
      )}
      <RowProvider context={{ isOpenAmtEnabled, groups }}>
        <ExpandableDatatable
          dataset={environments}
          columns={columns}
          isLoading={isLoading}
          totalCount={totalCount}
          title="Edge Devices"
          titleIcon={Box}
          initialPageSize={settings.pageSize}
          onPageSizeChange={settings.setPageSize}
          initialSortBy={settings.sortBy}
          onSortByChange={settings.setSortBy}
          searchValue={search}
          onSearchChange={setSearch}
          renderSubRow={(row) => (
            <tr>
              <td />
              <td colSpan={row.cells.length - 1}>
                <AMTDevicesDatatable environmentId={row.original.Id} />
              </td>
            </tr>
          )}
          initialTableState={{ pageIndex: page }}
          pageCount={Math.ceil(totalCount / settings.pageSize)}
          renderTableActions={(selectedRows) => (
            <EdgeDevicesDatatableActions
              selectedItems={selectedRows}
              isFDOEnabled={isFdoEnabled}
              isOpenAMTEnabled={isOpenAmtEnabled}
              showWaitingRoomLink={showWaitingRoomLink}
            />
          )}
          renderTableSettings={(tableInstance) => {
            const columnsToHide = tableInstance.allColumns.filter(
              (colInstance) => hidableColumns?.includes(colInstance.id)
            );
            return (
              <>
                <ColumnVisibilityMenu<Environment>
                  columns={columnsToHide}
                  onChange={(hiddenColumns) => {
                    settings.setHiddenColumns(hiddenColumns);
                    tableInstance.setHiddenColumns(hiddenColumns);
                  }}
                  value={settings.hiddenColumns}
                />
                <TableSettingsMenu>
                  <EdgeDevicesDatatableSettings settings={settings} />
                </TableSettingsMenu>
              </>
            );
          }}
          onPageChange={setPage}
        />
      </RowProvider>
    </>
  );
}
