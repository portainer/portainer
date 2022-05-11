import { useEffect } from 'react';
import {
  useTable,
  useSortBy,
  useFilters,
  useGlobalFilter,
  usePagination,
  Row,
} from 'react-table';
import { useRowSelectColumn } from '@lineup-lite/hooks';

import { PaginationControls } from '@/portainer/components/pagination-controls';
import {
  QuickActionsSettings,
  buildAction,
} from '@/portainer/components/datatables/components/QuickActionsSettings';
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
  SearchBar,
  useSearchBarState,
} from '@/portainer/components/datatables/components/SearchBar';
import type {
  ContainersTableSettings,
  DockerContainer,
} from '@/docker/containers/types';
import { useEnvironment } from '@/portainer/environments/useEnvironment';
import { useRowSelect } from '@/portainer/components/datatables/components/useRowSelect';
import { Checkbox } from '@/portainer/components/form-components/Checkbox';
import { TableFooter } from '@/portainer/components/datatables/components/TableFooter';
import { SelectedRowsCount } from '@/portainer/components/datatables/components/SelectedRowsCount';

import { ContainersDatatableActions } from './ContainersDatatableActions';
import { ContainersDatatableSettings } from './ContainersDatatableSettings';
import { useColumns } from './columns';

export interface ContainerTableProps {
  isAddActionVisible: boolean;
  dataset: DockerContainer[];
  onRefresh?(): Promise<void>;
  isHostColumnVisible: boolean;
  tableKey?: string;
}

export function ContainersDatatable({
  isAddActionVisible,
  dataset,
  onRefresh,
  isHostColumnVisible,
}: ContainerTableProps) {
  const { settings, setTableSettings } =
    useTableSettings<ContainersTableSettings>();
  const [searchBarValue, setSearchBarValue] = useSearchBarState('containers');

  const columns = useColumns();

  const endpoint = useEnvironment();

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
    toggleHideColumn,
    setGlobalFilter,
    state: { pageIndex, pageSize },
  } = useTable<DockerContainer>(
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
      isRowSelectable(row: Row<DockerContainer>) {
        return !row.original.IsPortainer;
      },
      autoResetSelectedRows: false,
      getRowId(originalRow: DockerContainer) {
        return originalRow.Id;
      },
      selectCheckboxComponent: Checkbox,
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect,
    useRowSelectColumn
  );

  const debouncedSearchValue = useDebounce(searchBarValue);

  useEffect(() => {
    setGlobalFilter(debouncedSearchValue);
  }, [debouncedSearchValue, setGlobalFilter]);

  useEffect(() => {
    toggleHideColumn('host', !isHostColumnVisible);
  }, [toggleHideColumn, isHostColumnVisible]);

  const columnsToHide = allColumns.filter((colInstance) => {
    const columnDef = columns.find((c) => c.id === colInstance.id);
    return columnDef?.canHide;
  });

  const actions = [
    buildAction('logs', 'Logs'),
    buildAction('inspect', 'Inspect'),
    buildAction('stats', 'Stats'),
    buildAction('exec', 'Console'),
    buildAction('attach', 'Attach'),
  ];

  const tableProps = getTableProps();
  const tbodyProps = getTableBodyProps();

  return (
    <TableContainer>
      <TableTitle icon="fa-cubes" label="Containers">
        <TableTitleActions>
          <ColumnVisibilityMenu<DockerContainer>
            columns={columnsToHide}
            onChange={handleChangeColumnsVisibility}
            value={settings.hiddenColumns}
          />

          <TableSettingsMenu
            quickActions={<QuickActionsSettings actions={actions} />}
          >
            <ContainersDatatableSettings isRefreshVisible={!!onRefresh} />
          </TableSettingsMenu>
        </TableTitleActions>
      </TableTitle>

      <TableActions>
        <ContainersDatatableActions
          selectedItems={selectedFlatRows.map((row) => row.original)}
          isAddActionVisible={isAddActionVisible}
          endpointId={endpoint.Id}
        />
      </TableActions>

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
              <TableHeaderRow<DockerContainer>
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
          {page.length > 0 ? (
            page.map((row) => {
              prepareRow(row);
              const { key, className, role, style } = row.getRowProps();
              return (
                <TableRow<DockerContainer>
                  cells={row.cells}
                  key={key}
                  className={className}
                  role={role}
                  style={style}
                />
              );
            })
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center text-muted">
                No container available.
              </td>
            </tr>
          )}
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
