import { useTable, useExpanded, useSortBy, useFilters } from 'react-table';
import { useRowSelectColumn } from '@lineup-lite/hooks';
import _ from 'lodash';

import { Environment } from '@/react/portainer/environments/types';
import { AMTDevicesDatatable } from '@/edge/EdgeDevices/EdgeDevicesView/AMTDevicesDatatable/AMTDevicesDatatable';
import { EnvironmentGroup } from '@/portainer/environment-groups/types';

import { PaginationControls } from '@@/PaginationControls';
import {
  Table,
  TableActions,
  TableContainer,
  TableHeaderRow,
  TableRow,
  TableSettingsMenu,
  TableTitle,
  TableTitleActions,
} from '@@/datatables';
import { multiple } from '@@/datatables/filter-types';
import { useTableSettings } from '@@/datatables/useTableSettings';
import { ColumnVisibilityMenu } from '@@/datatables/ColumnVisibilityMenu';
import { SearchBar } from '@@/datatables/SearchBar';
import { useRowSelect } from '@@/datatables/useRowSelect';
import { TableFooter } from '@@/datatables/TableFooter';
import { SelectedRowsCount } from '@@/datatables/SelectedRowsCount';
import { TextTip } from '@@/Tip/TextTip';

import { EdgeDevicesDatatableActions } from './EdgeDevicesDatatableActions';
import { EdgeDevicesDatatableSettings } from './EdgeDevicesDatatableSettings';
import { RowProvider } from './columns/RowContext';
import { useColumns } from './columns';
import styles from './EdgeDevicesDatatable.module.css';
import { EdgeDeviceTableSettings, Pagination } from './types';

export interface EdgeDevicesTableProps {
  storageKey: string;
  isFdoEnabled: boolean;
  isOpenAmtEnabled: boolean;
  showWaitingRoomLink: boolean;
  mpsServer: string;
  dataset: Environment[];
  groups: EnvironmentGroup[];
  setLoadingMessage(message: string): void;
  pagination: Pagination;
  onChangePagination(pagination: Partial<Pagination>): void;
  totalCount: number;
  search: string;
  onChangeSearch(search: string): void;
}

export function EdgeDevicesDatatable({
  isFdoEnabled,
  isOpenAmtEnabled,
  showWaitingRoomLink,
  mpsServer,
  dataset,
  onChangeSearch,
  search,
  groups,
  setLoadingMessage,
  pagination,
  onChangePagination,
  totalCount,
}: EdgeDevicesTableProps) {
  const { settings, setTableSettings } =
    useTableSettings<EdgeDeviceTableSettings>();

  const columns = useColumns();

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    selectedFlatRows,
    allColumns,
    setHiddenColumns,
  } = useTable<Environment>(
    {
      defaultCanFilter: false,
      columns,
      data: dataset,
      filterTypes: { multiple },
      initialState: {
        hiddenColumns: settings.hiddenColumns,
        sortBy: [settings.sortBy],
      },
      isRowSelectable() {
        return true;
      },
      autoResetExpanded: false,
      autoResetSelectedRows: false,
      getRowId(originalRow: Environment) {
        return originalRow.Id.toString();
      },
      selectColumnWidth: 5,
    },
    useFilters,
    useSortBy,
    useExpanded,
    useRowSelect,
    useRowSelectColumn
  );

  const columnsToHide = allColumns.filter((colInstance) => {
    const columnDef = columns.find((c) => c.id === colInstance.id);
    return columnDef?.canHide;
  });

  const tableProps = getTableProps();
  const tbodyProps = getTableBodyProps();

  const someDeviceHasAMTActivated = dataset.some(
    (environment) =>
      environment.AMTDeviceGUID && environment.AMTDeviceGUID !== ''
  );

  const groupsById = _.groupBy(groups, 'Id');

  return (
    <div className="row">
      <div className="col-sm-12">
        <TableContainer>
          <TableTitle icon="box" featherIcon label="Edge Devices">
            <SearchBar value={search} onChange={handleSearchBarChange} />
            <TableActions>
              <EdgeDevicesDatatableActions
                selectedItems={selectedFlatRows.map((row) => row.original)}
                isFDOEnabled={isFdoEnabled}
                isOpenAMTEnabled={isOpenAmtEnabled}
                setLoadingMessage={setLoadingMessage}
                showWaitingRoomLink={showWaitingRoomLink}
              />
            </TableActions>
            <TableTitleActions>
              <ColumnVisibilityMenu<Environment>
                columns={columnsToHide}
                onChange={handleChangeColumnsVisibility}
                value={settings.hiddenColumns}
              />
              <TableSettingsMenu>
                <EdgeDevicesDatatableSettings />
              </TableSettingsMenu>
            </TableTitleActions>
          </TableTitle>
          {isOpenAmtEnabled && someDeviceHasAMTActivated && (
            <div className={styles.kvmTip}>
              <TextTip color="blue">
                For the KVM function to work you need to have the MPS server
                added to your trusted site list, browse to this{' '}
                <a
                  href={`https://${mpsServer}`}
                  target="_blank"
                  rel="noreferrer"
                  className="space-right"
                >
                  site
                </a>
                and add to your trusted site list
              </TextTip>
            </div>
          )}
          <Table
            className={tableProps.className}
            role={tableProps.role}
            style={tableProps.style}
          >
            <thead>
              {headerGroups.map((headerGroup) => {
                const { key, className, role, style } =
                  headerGroup.getHeaderGroupProps();
                return (
                  <TableHeaderRow<Environment>
                    key={key}
                    className={className}
                    role={role}
                    style={style}
                    headers={headerGroup.headers}
                    onSortChange={handleSortChange}
                  />
                );
              })}
            </thead>
            <tbody
              className={tbodyProps.className}
              role={tbodyProps.role}
              style={tbodyProps.style}
            >
              <Table.Content
                prepareRow={prepareRow}
                rows={rows}
                renderRow={(row, { key, className, role, style }) => {
                  const group = groupsById[row.original.GroupId];

                  return (
                    <RowProvider
                      key={key}
                      context={{ isOpenAmtEnabled, groupName: group[0]?.Name }}
                    >
                      <TableRow<Environment>
                        cells={row.cells}
                        key={key}
                        className={className}
                        role={role}
                        style={style}
                      />
                      {row.isExpanded && (
                        <tr>
                          <td />
                          <td colSpan={row.cells.length - 1}>
                            <AMTDevicesDatatable
                              environmentId={row.original.Id}
                            />
                          </td>
                        </tr>
                      )}
                    </RowProvider>
                  );
                }}
              />
            </tbody>
          </Table>
          <TableFooter>
            <SelectedRowsCount value={selectedFlatRows.length} />
            <PaginationControls
              isPageInputVisible
              pageLimit={pagination.pageLimit}
              page={pagination.page}
              onPageChange={(p) => gotoPage(p)}
              totalCount={totalCount}
              onPageLimitChange={handlePageSizeChange}
            />
          </TableFooter>
        </TableContainer>
      </div>
    </div>
  );

  function gotoPage(pageIndex: number) {
    onChangePagination({ page: pageIndex });
  }

  function setPageSize(pageSize: number) {
    onChangePagination({ pageLimit: pageSize });
  }

  function handlePageSizeChange(pageSize: number) {
    setPageSize(pageSize);
    setTableSettings((settings) => ({ ...settings, pageSize }));
  }

  function handleChangeColumnsVisibility(hiddenColumns: string[]) {
    setHiddenColumns(hiddenColumns);
    setTableSettings((settings) => ({ ...settings, hiddenColumns }));
  }

  function handleSearchBarChange(value: string) {
    onChangeSearch(value);
  }

  function handleSortChange(id: string, desc: boolean) {
    setTableSettings((settings) => ({
      ...settings,
      sortBy: { id, desc },
    }));
  }
}
