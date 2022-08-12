import {
  Column,
  useGlobalFilter,
  usePagination,
  useRowSelect,
  useSortBy,
  useTable,
} from 'react-table';
import { useRowSelectColumn } from '@lineup-lite/hooks';

import { Environment } from '@/portainer/environments/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { Button } from '@@/buttons';
import { Table } from '@@/datatables';
import { SearchBar, useSearchBarState } from '@@/datatables/SearchBar';
import { SelectedRowsCount } from '@@/datatables/SelectedRowsCount';
import { PaginationControls } from '@@/PaginationControls';
import { useTableSettings } from '@@/datatables/useTableSettings';

import { useAssociateDeviceMutation } from '../queries';

import { TableSettings } from './types';

const columns: readonly Column<Environment>[] = [
  {
    Header: 'Name',
    accessor: (row) => row.Name,
    id: 'name',
    disableFilters: true,
    Filter: () => null,
    canHide: false,
    sortType: 'string',
  },
  {
    Header: 'Edge ID',
    accessor: (row) => row.EdgeID,
    id: 'edge-id',
    disableFilters: true,
    Filter: () => null,
    canHide: false,
    sortType: 'string',
  },
] as const;

interface Props {
  devices: Environment[];
  isLoading: boolean;
  totalCount: number;
  storageKey: string;
}

export function DataTable({
  devices,
  storageKey,
  isLoading,
  totalCount,
}: Props) {
  const associateMutation = useAssociateDeviceMutation();

  const [searchBarValue, setSearchBarValue] = useSearchBarState(storageKey);
  const { settings, setTableSettings } = useTableSettings<TableSettings>();

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    selectedFlatRows,

    gotoPage,
    setPageSize,

    setGlobalFilter,
    state: { pageIndex, pageSize },
  } = useTable<Environment>(
    {
      defaultCanFilter: false,
      columns,
      data: devices,

      initialState: {
        pageSize: settings.pageSize || 10,
        sortBy: [settings.sortBy],
        globalFilter: searchBarValue,
      },
      isRowSelectable() {
        return true;
      },
      autoResetSelectedRows: false,
      getRowId(originalRow: Environment) {
        return originalRow.Id.toString();
      },
      selectColumnWidth: 5,
    },
    useGlobalFilter,
    useSortBy,

    usePagination,
    useRowSelect,
    useRowSelectColumn
  );

  const tableProps = getTableProps();
  const tbodyProps = getTableBodyProps();

  return (
    <div className="row">
      <div className="col-sm-12">
        <Table.Container>
          <Table.Title label="Edge Devices Waiting Room" icon="">
            <SearchBar
              onChange={handleSearchBarChange}
              value={searchBarValue}
            />
            <Table.Actions>
              <Button
                onClick={() =>
                  handleAssociateDevice(selectedFlatRows.map((r) => r.original))
                }
                disabled={selectedFlatRows.length === 0}
              >
                Associate Device
              </Button>
            </Table.Actions>
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
                  <Table.HeaderRow<Environment>
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
                emptyContent="No Edge Devices found"
                prepareRow={prepareRow}
                rows={page}
                isLoading={isLoading}
                renderRow={(row, { key, className, role, style }) => (
                  <Table.Row
                    cells={row.cells}
                    key={key}
                    className={className}
                    role={role}
                    style={style}
                  />
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
              totalCount={totalCount}
              onPageLimitChange={handlePageLimitChange}
            />
          </Table.Footer>
        </Table.Container>
      </div>
    </div>
  );

  function handleSortChange(colId: string, desc: boolean) {
    setTableSettings({ sortBy: { id: colId, desc } });
  }

  function handlePageLimitChange(pageSize: number) {
    setPageSize(pageSize);
    setTableSettings({ pageSize });
  }

  function handleSearchBarChange(value: string) {
    setGlobalFilter(value);
    setSearchBarValue(value);
  }

  function handleAssociateDevice(devices: Environment[]) {
    associateMutation.mutate(
      devices.map((d) => d.Id),
      {
        onSuccess() {
          notifySuccess('Success', 'Edge devices associated successfully');
        },
      }
    );
  }
}
