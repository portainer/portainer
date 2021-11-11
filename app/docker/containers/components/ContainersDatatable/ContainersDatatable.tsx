import { useEffect } from 'react';
import {
  useTable,
  useRowSelect,
  useSortBy,
  useFilters,
  useGlobalFilter,
  usePagination,
} from 'react-table';

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
  useSearchBarContext,
  SearchBar,
} from '@/portainer/components/datatables/components/SearchBar';
import type {
  ContainersTableSettings,
  DockerContainer,
} from '@/docker/containers/types';
import { useEndpoint } from '@/portainer/endpoints/useEndpoint';

import { ContainersDatatableActions } from './ContainersDatatableActions';
import { ContainersDatatableSettings } from './ContainersDatatableSettings';
import { useColumns } from './columns';

export interface ContainerTableProps {
  isAddActionVisible: boolean;
  dataset: DockerContainer[];
  onRefresh(): Promise<void>;
  isHostColumnVisible: boolean;
  autoFocusSearch: boolean;
}

export function ContainersDatatable({
  isAddActionVisible,
  dataset,
  onRefresh,
  isHostColumnVisible,
  autoFocusSearch,
}: ContainerTableProps) {
  const { settings, setTableSettings } = useTableSettings<
    ContainersTableSettings
  >();
  const [searchBarValue, setSearchBarValue] = useSearchBarContext();

  const columns = useColumns();

  const endpoint = useEndpoint();

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
      columns,
      data: dataset,
      filterTypes: { multiple },
      initialState: {
        pageSize: settings.pageSize || 10,
        hiddenColumns: settings.hiddenColumns,
        sortBy: [settings.sortBy],
        globalFilter: searchBarValue,
      },
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect
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
          <ColumnVisibilityMenu
            columns={columnsToHide}
            onChange={handleChangeColumnsVisibility}
            value={settings.hiddenColumns}
          />

          <TableSettingsMenu
            quickActions={<QuickActionsSettings actions={actions} />}
          >
            <ContainersDatatableSettings />
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

      <SearchBar
        value={searchBarValue}
        onChange={handleSearchBarChange}
        autoFocus={autoFocusSearch}
      />

      <Table
        className={tableProps.className}
        role={tableProps.role}
        style={tableProps.style}
      >
        <thead>
          {headerGroups.map((headerGroup) => {
            const {
              key,
              className,
              role,
              style,
            } = headerGroup.getHeaderGroupProps();

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
          {page.map((row) => {
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
          })}
        </tbody>
      </Table>

      <div className="footer">
        {selectedFlatRows.length !== 0 && (
          <div className="infoBar">
            {selectedFlatRows.length} item(s) selected
          </div>
        )}

        <PaginationControls
          showAll
          pageLimit={pageSize}
          page={pageIndex + 1}
          onPageChange={(p) => gotoPage(p - 1)}
          totalCount={dataset.length}
          onPageLimitChange={handlePageSizeChange}
        />
      </div>
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
