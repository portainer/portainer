import { Fragment, useEffect } from 'react';
import {
  useTable,
  useExpanded,
  useSortBy,
  useFilters,
  useGlobalFilter,
  usePagination,
} from 'react-table';
import { useRowSelectColumn } from '@lineup-lite/hooks';

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
import { useRepeater } from '@/portainer/components/datatables/components/useRepeater';
import { useDebounce } from '@/portainer/hooks/useDebounce';
import {
  useSearchBarContext,
  SearchBar,
} from '@/portainer/components/datatables/components/SearchBar';
import { useRowSelect } from '@/portainer/components/datatables/components/useRowSelect';
import { TableFooter } from '@/portainer/components/datatables/components/TableFooter';
import { SelectedRowsCount } from '@/portainer/components/datatables/components/SelectedRowsCount';
import { EdgeDeviceTableSettings } from '@/edge/devices/types';
import { EdgeDevicesDatatableSettings } from '@/edge/devices/components/EdgeDevicesDatatable/EdgeDevicesDatatableSettings';
import { EdgeDevicesDatatableActions } from '@/edge/devices/components/EdgeDevicesDatatable/EdgeDevicesDatatableActions';
import { AMTDevicesDatatable } from '@/edge/devices/components/AMTDevicesDatatable/AMTDevicesDatatable';

import { useColumns } from './columns';

export interface EdgeDevicesTableProps {
  isEnabled: boolean;
  isFdoEnabled: boolean;
  isOpenAmtEnabled: boolean;
  dataset: Environment[];
  onRefresh(): Promise<void>;
  setLoadingMessage(message: string): void;
}

export function EdgeDevicesDatatable({
  isFdoEnabled,
  isOpenAmtEnabled,
  dataset,
  onRefresh,
  setLoadingMessage,
}: EdgeDevicesTableProps) {
  const { settings, setTableSettings } =
    useTableSettings<EdgeDeviceTableSettings>();
  const [searchBarValue, setSearchBarValue] = useSearchBarContext();

  const columns = useColumns();

  useRepeater(settings.autoRefreshRate, onRefresh);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    selectedFlatRows,
    allColumns,
    gotoPage,
    setPageSize,
    setHiddenColumns,
    setGlobalFilter,
    state: { pageIndex, pageSize },
  } = useTable<Environment>(
    {
      defaultCanFilter: false,
      columns,
      data: dataset,
      filterTypes: { multiple },
      initialState: {
        pageSize: settings.pageSize || 10,
        hiddenColumns: settings.hiddenColumns,
        sortBy: [settings.sortBy],
        globalFilter: searchBarValue,
      },
      isRowSelectable() {
        return true;
      },
      selectColumnWidth: 5,
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    useExpanded,
    usePagination,
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
        />
      </TableActions>

      <SearchBar
        value={searchBarValue}
        onChange={handleSearchBarChange}
      />

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
          {page.map((row) => {
            prepareRow(row);
            const { key, className, role, style } = row.getRowProps();

            return (
              <Fragment key={key}>
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
              </Fragment>
            );
          })}
        </tbody>
      </Table>

      <TableFooter>
        <SelectedRowsCount value={selectedFlatRows.length} />
        <PaginationControls
          showAll
          pageLimit={pageSize}
          page={pageIndex + 1}
          onPageChange={(p) => gotoPage(p - 1)}
          totalCount={dataset.length}
          onPageLimitChange={handlePageSizeChange}
        />
      </TableFooter>
    </TableContainer>
  );

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
