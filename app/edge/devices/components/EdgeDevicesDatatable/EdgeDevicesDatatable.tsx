import { useEffect } from 'react';
import {
  useTable,
  useExpanded,
  useSortBy,
  useFilters,
  useGlobalFilter,
} from 'react-table';
import { useRowSelectColumn } from '@lineup-lite/hooks';
import _ from 'lodash';

import { Environment } from '@/portainer/environments/types';
import { PaginationControls } from '@/portainer/components/pagination-controls';
import {
  Table,
  TableActions,
  TableContainer,
  TableHeaderRow,
  TableRow,
  TableSettingsMenu,
  TableTitle,
  TableTitleActions,
} from '@/portainer/components/datatables/components';
import { multiple } from '@/portainer/components/datatables/components/filter-types';
import { useTableSettings } from '@/portainer/components/datatables/components/useTableSettings';
import { ColumnVisibilityMenu } from '@/portainer/components/datatables/components/ColumnVisibilityMenu';
import { useDebounce } from '@/portainer/hooks/useDebounce';
import {
  useSearchBarState,
  SearchBar,
} from '@/portainer/components/datatables/components/SearchBar';
import { useRowSelect } from '@/portainer/components/datatables/components/useRowSelect';
import { TableFooter } from '@/portainer/components/datatables/components/TableFooter';
import { SelectedRowsCount } from '@/portainer/components/datatables/components/SelectedRowsCount';
import { EdgeDeviceTableSettings } from '@/edge/devices/types';
import { EdgeDevicesDatatableSettings } from '@/edge/devices/components/EdgeDevicesDatatable/EdgeDevicesDatatableSettings';
import { EdgeDevicesDatatableActions } from '@/edge/devices/components/EdgeDevicesDatatable/EdgeDevicesDatatableActions';
import { AMTDevicesDatatable } from '@/edge/devices/components/AMTDevicesDatatable/AMTDevicesDatatable';
import { TextTip } from '@/portainer/components/Tip/TextTip';
import { EnvironmentGroup } from '@/portainer/environment-groups/types';

import { RowProvider } from './columns/RowContext';
import { useColumns } from './columns';
import styles from './EdgeDevicesDatatable.module.css';
import { Pagination } from './types';

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
}

export function EdgeDevicesDatatable({
  storageKey,
  isFdoEnabled,
  isOpenAmtEnabled,
  showWaitingRoomLink,
  mpsServer,
  dataset,
  groups,
  setLoadingMessage,
  pagination,
  onChangePagination,
  totalCount,
}: EdgeDevicesTableProps) {
  const { settings, setTableSettings } =
    useTableSettings<EdgeDeviceTableSettings>();
  const [searchBarValue, setSearchBarValue] = useSearchBarState(storageKey);

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
    setGlobalFilter,
  } = useTable<Environment>(
    {
      defaultCanFilter: false,
      columns,
      data: dataset,
      filterTypes: { multiple },
      initialState: {
        hiddenColumns: settings.hiddenColumns,
        sortBy: [settings.sortBy],
        globalFilter: searchBarValue,
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
    useGlobalFilter,
    useSortBy,
    useExpanded,
    useRowSelect,
    useRowSelectColumn
  );

  const debouncedSearchValue = useDebounce(searchBarValue);

  useEffect(() => {
    setGlobalFilter(debouncedSearchValue);
  }, [debouncedSearchValue, setGlobalFilter]);

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
    <TableContainer>
      <TableTitle icon="fa-plug" label="Edge Devices">
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

      <TableActions>
        <EdgeDevicesDatatableActions
          selectedItems={selectedFlatRows.map((row) => row.original)}
          isFDOEnabled={isFdoEnabled}
          isOpenAMTEnabled={isOpenAmtEnabled}
          setLoadingMessage={setLoadingMessage}
          showWaitingRoomLink={showWaitingRoomLink}
        />
      </TableActions>

      {isOpenAmtEnabled && someDeviceHasAMTActivated && (
        <div className={styles.kvmTip}>
          <TextTip color="blue">
            For the KVM function to work you need to have the MPS server added
            to your trusted site list, browse to this{' '}
            <a href={`https://${mpsServer}`} target="_blank" rel="noreferrer">
              site
            </a>{' '}
            and add to your trusted site list
          </TextTip>
        </div>
      )}

      <SearchBar value={searchBarValue} onChange={handleSearchBarChange} />

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
          {rows.map((row) => {
            prepareRow(row);
            const { key, className, role, style } = row.getRowProps();
            const group = groupsById[row.original.GroupId];
            return (
              <RowProvider
                key={key}
                isOpenAmtEnabled={isOpenAmtEnabled}
                groupName={group[0]?.Name}
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
                      <AMTDevicesDatatable environmentId={row.original.Id} />
                    </td>
                  </tr>
                )}
              </RowProvider>
            );
          })}
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
    setSearchBarValue(value);
  }

  function handleSortChange(id: string, desc: boolean) {
    setTableSettings((settings) => ({
      ...settings,
      sortBy: { id, desc },
    }));
  }
}
