import {
  useTable,
  useSortBy,
  useFilters,
  useGlobalFilter,
  usePagination,
  Row,
} from 'react-table';
import { useRowSelectColumn } from '@lineup-lite/hooks';
import { useMemo } from 'react';

import type {
  ContainersTableSettings,
  DockerContainer,
} from '@/react/docker/containers/types';
import { Environment } from '@/portainer/environments/types';

import { PaginationControls } from '@@/PaginationControls';
import { Checkbox } from '@@/form-components/Checkbox';
import {
  QuickActionsSettings,
  buildAction,
} from '@@/datatables/QuickActionsSettings';
import { Table } from '@@/datatables';
import { multiple } from '@@/datatables/filter-types';
import { useTableSettings } from '@@/datatables/useTableSettings';
import { ColumnVisibilityMenu } from '@@/datatables/ColumnVisibilityMenu';
import { useSearchBarState, SearchBar } from '@@/datatables/SearchBar';
import { useRowSelect } from '@@/datatables/useRowSelect';
import { SelectedRowsCount } from '@@/datatables/SelectedRowsCount';

import { ContainersDatatableActions } from './ContainersDatatableActions';
import { ContainersDatatableSettings } from './ContainersDatatableSettings';
import { useColumns } from './columns';
import { RowProvider } from './RowContext';

export interface Props {
  isAddActionVisible: boolean;
  containers: DockerContainer[];
  isHostColumnVisible: boolean;
  isRefreshVisible: boolean;
  tableKey: string;
  environment: Environment;
}

const actions = [
  buildAction('logs', 'Logs'),
  buildAction('inspect', 'Inspect'),
  buildAction('stats', 'Stats'),
  buildAction('exec', 'Console'),
  buildAction('attach', 'Attach'),
];

export function ContainersDatatableTable({
  isAddActionVisible,
  containers,
  isHostColumnVisible,
  isRefreshVisible,
  tableKey,
  environment,
}: Props) {
  const { settings, setTableSettings } =
    useTableSettings<ContainersTableSettings>();
  const [searchBarValue, setSearchBarValue] = useSearchBarState(tableKey);

  const columns = useColumns(isHostColumnVisible);

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
  } = useTable<DockerContainer>(
    {
      defaultCanFilter: false,
      columns,
      data: containers,
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
      getRowId(originalRow: DockerContainer) {
        return originalRow.Id;
      },
      selectCheckboxComponent: Checkbox,
      autoResetSelectedRows: false,
      autoResetGlobalFilter: false,
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect,
    useRowSelectColumn
  );

  const columnsToHide = allColumns.filter((colInstance) => {
    const columnDef = columns.find((c) => c.id === colInstance.id);
    return columnDef?.canHide;
  });

  const rowContext = useMemo(() => ({ environment }), [environment]);

  const tableProps = getTableProps();
  const tbodyProps = getTableBodyProps();

  return (
    <Table.Container>
      <Table.Title icon="fa-cubes" label="Containers">
        <SearchBar value={searchBarValue} onChange={handleSearchBarChange} />
        <Table.Actions>
          <ContainersDatatableActions
            selectedItems={selectedFlatRows.map((row) => row.original)}
            isAddActionVisible={isAddActionVisible}
            endpointId={environment.Id}
          />
        </Table.Actions>
        <Table.TitleActions>
          <ColumnVisibilityMenu<DockerContainer>
            columns={columnsToHide}
            onChange={handleChangeColumnsVisibility}
            value={settings.hiddenColumns}
          />

          <Table.SettingsMenu
            quickActions={<QuickActionsSettings actions={actions} />}
          >
            <ContainersDatatableSettings isRefreshVisible={isRefreshVisible} />
          </Table.SettingsMenu>
        </Table.TitleActions>
      </Table.Title>

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
              <Table.HeaderRow<DockerContainer>
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
            emptyContent="No container available."
            rows={page}
            prepareRow={prepareRow}
            renderRow={(row, { key, className, role, style }) => (
              <RowProvider context={rowContext} key={key}>
                <Table.Row<DockerContainer>
                  cells={row.cells}
                  className={className}
                  role={role}
                  style={style}
                  key={key}
                />
              </RowProvider>
            )}
          />
        </tbody>
      </Table>

      <Table.Footer>
        <SelectedRowsCount value={selectedFlatRows.length} />
        <PaginationControls
          showAll
          pageLimit={pageSize}
          page={pageIndex + 1}
          onPageChange={(p) => gotoPage(p - 1)}
          totalCount={containers.length}
          onPageLimitChange={handlePageSizeChange}
        />
      </Table.Footer>
    </Table.Container>
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
    setGlobalFilter(value);
  }

  function handleSortChange(id: string, desc: boolean) {
    setTableSettings((settings) => ({
      ...settings,
      sortBy: { id, desc },
    }));
  }
}
