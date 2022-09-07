import { useTable, usePagination, useSortBy } from 'react-table';
import { useRowSelectColumn } from '@lineup-lite/hooks';

import { Profile } from '@/portainer/hostmanagement/fdo/model';
import PortainerError from '@/portainer/error';

import { PaginationControls } from '@@/PaginationControls';
import { SelectedRowsCount } from '@@/datatables/SelectedRowsCount';
import { TableFooter } from '@@/datatables/TableFooter';
import { useTableSettings } from '@@/datatables/useTableSettings';
import { useRowSelect } from '@@/datatables/useRowSelect';
import {
  Table,
  TableContainer,
  TableHeaderRow,
  TableRow,
  TableTitle,
} from '@@/datatables';
import {
  PaginationTableSettings,
  SortableTableSettings,
} from '@@/datatables/types-old';

import { useFDOProfiles } from './useFDOProfiles';
import { useColumns } from './columns';
import { FDOProfilesDatatableActions } from './FDOProfilesDatatableActions';

export interface FDOProfilesTableSettings
  extends SortableTableSettings,
    PaginationTableSettings {}

export interface FDOProfilesDatatableProps {
  isFDOEnabled: boolean;
}

export function FDOProfilesDatatable({
  isFDOEnabled,
}: FDOProfilesDatatableProps) {
  const { settings, setTableSettings } =
    useTableSettings<FDOProfilesTableSettings>();
  const columns = useColumns();

  const { isLoading, profiles, error } = useFDOProfiles();

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    selectedFlatRows,
    gotoPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable<Profile>(
    {
      defaultCanFilter: false,
      columns,
      data: profiles,
      initialState: {
        pageSize: settings.pageSize || 10,
        sortBy: [settings.sortBy],
      },
      isRowSelectable() {
        return isFDOEnabled;
      },
      selectColumnWidth: 5,
    },
    useSortBy,
    usePagination,
    useRowSelect,
    useRowSelectColumn
  );

  const tableProps = getTableProps();
  const tbodyProps = getTableBodyProps();

  return (
    <TableContainer>
      <TableTitle icon="list" featherIcon label="Device Profiles">
        <FDOProfilesDatatableActions
          isFDOEnabled={isFDOEnabled}
          selectedItems={selectedFlatRows.map((row) => row.original)}
        />
      </TableTitle>

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
              <TableHeaderRow<Profile>
                key={key}
                className={className}
                role={role}
                style={style}
                headers={headerGroup.headers}
              />
            );
          })}
        </thead>
        <tbody
          className={tbodyProps.className}
          role={tbodyProps.role}
          style={tbodyProps.style}
        >
          {!isLoading && profiles && profiles.length > 0 ? (
            page.map((row) => {
              prepareRow(row);
              const { key, className, role, style } = row.getRowProps();

              return (
                <TableRow<Profile>
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
              <td colSpan={5} className="text-center text-muted">
                {userMessage(isLoading, error)}
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
          totalCount={profiles ? profiles.length : 0}
          onPageLimitChange={handlePageSizeChange}
        />
      </TableFooter>
    </TableContainer>
  );

  function handlePageSizeChange(pageSize: number) {
    setPageSize(pageSize);
    setTableSettings((settings) => ({ ...settings, pageSize }));
  }
}

function userMessage(isLoading: boolean, error?: PortainerError) {
  if (isLoading) {
    return 'Loading...';
  }

  if (error) {
    return error.message;
  }

  return 'No profiles found';
}
