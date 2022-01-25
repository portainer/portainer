import { useTable, usePagination, useSortBy } from 'react-table';
import { useRowSelectColumn } from '@lineup-lite/hooks';
import { FDOProfilesDatatableActions } from 'Portainer/settings/edge-compute/FDOProfilesDatatable/FDOProfilesDatatableActions';
import { SelectedRowsCount } from 'Portainer/components/datatables/components/SelectedRowsCount';
import { PaginationControls } from 'Portainer/components/pagination-controls';
import { TableFooter } from 'Portainer/components/datatables/components/TableFooter';
import { useTableSettings } from 'Portainer/components/datatables/components/useTableSettings';
import { useRowSelect } from 'Portainer/components/datatables/components/useRowSelect';

import { Profile } from '@/portainer/hostmanagement/fdo/model';
import PortainerError from '@/portainer/error';
import {
  Table,
  TableActions,
  TableContainer,
  TableHeaderRow,
  TableRow,
  TableTitle,
} from '@/portainer/components/datatables/components';
import { FDOProfilesTableSettings } from '@/edge/devices/types';
import { useFDOProfiles } from '@/portainer/settings/edge-compute/FDOProfilesDatatable/useFDOProfiles';

import { useColumns } from './columns';

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
      <TableTitle icon="" label="Device Profiles" />

      <TableActions>
        <FDOProfilesDatatableActions
          isFDOEnabled={isFDOEnabled}
          selectedItems={selectedFlatRows.map((row) => row.original)}
        />
      </TableActions>

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
