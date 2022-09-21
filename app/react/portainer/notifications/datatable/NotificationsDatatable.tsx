import { Fragment, useEffect } from 'react';
import {
  useFilters,
  useGlobalFilter,
  usePagination,
  useRowSelect,
  useSortBy,
  useTable,
} from 'react-table';
import { Trash2 } from 'react-feather';
import { useRowSelectColumn } from '@lineup-lite/hooks';

import { useDebounce } from '@/portainer/hooks/useDebounce';
import { useUser } from '@/portainer/hooks/useUser';

import { PaginationControls } from '@@/PaginationControls';
import {
  Table,
  TableActions,
  TableContainer,
  TableHeaderRow,
  TableRow,
  TableTitle,
} from '@@/datatables';
import { multiple } from '@@/datatables/filter-types';
import { useTableSettings } from '@@/datatables/useTableSettings';
import { SearchBar, useSearchBarState } from '@@/datatables/SearchBar';
import { TableFooter } from '@@/datatables/TableFooter';
import { TableContent } from '@@/datatables/TableContent';
import { Button } from '@@/buttons';
import { SelectedRowsCount } from '@@/datatables/SelectedRowsCount';
import { Checkbox } from '@@/form-components/Checkbox';

import { ToastNotification } from '../types';
import { notificationsStore } from '../notifications-store';

import { useColumns } from './columns';

export interface NotificationLogsDatatableProps {
  data: ToastNotification[];
}

export interface NotificationLogsTableSettings {
  autoRefreshRate: number;
  pageSize: number;
  sortBy: { id: string; desc: boolean };
}

export function NotificationsDatatable({
  data,
}: NotificationLogsDatatableProps) {
  const { user } = useUser();
  const { settings, setTableSettings } =
    useTableSettings<NotificationLogsTableSettings>();
  const [searchBarValue, setSearchBarValue] =
    useSearchBarState('notifications');
  const columns = useColumns();
  const debouncedSearchValue = useDebounce(searchBarValue);

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
  } = useTable<ToastNotification>(
    {
      defaultCanFilter: false,
      columns,
      data,
      filterTypes: { multiple },
      initialState: {
        pageSize: settings.pageSize || 10,
        sortBy: [settings.sortBy],
        globalFilter: searchBarValue,
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

  useEffect(() => {
    setGlobalFilter(debouncedSearchValue);
  }, [debouncedSearchValue, setGlobalFilter]);

  const tableProps = getTableProps();
  const tbodyProps = getTableBodyProps();

  return (
    <TableContainer>
      <TableTitle icon="bell" featherIcon label="Notifications">
        <SearchBar value={searchBarValue} onChange={handleSearchBarChange} />
        <TableActions>
          <Button
            color="dangerlight"
            onClick={handleRemoveClick}
            disabled={selectedFlatRows.length === 0}
            icon={Trash2}
          >
            Remove
          </Button>
        </TableActions>
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
              <TableHeaderRow<ToastNotification>
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
          <TableContent
            rows={page}
            prepareRow={prepareRow}
            emptyContent="No notifications found"
            renderRow={(row, { key, className, role, style }) => (
              <Fragment key={key}>
                <TableRow<ToastNotification>
                  cells={row.cells}
                  key={key}
                  className={className}
                  role={role}
                  style={style}
                />
              </Fragment>
            )}
          />
        </tbody>
      </Table>

      <TableFooter>
        <SelectedRowsCount value={selectedFlatRows.length} />
        <PaginationControls
          showAll
          pageLimit={pageSize}
          page={pageIndex + 1}
          onPageChange={(p) => gotoPage(p - 1)}
          totalCount={data.length}
          onPageLimitChange={handlePageSizeChange}
        />
      </TableFooter>
    </TableContainer>
  );

  function handlePageSizeChange(pageSize: number) {
    setPageSize(pageSize);
    setTableSettings((settings) => ({ ...settings, pageSize }));
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

  function handleRemoveClick() {
    const ids = selectedFlatRows.map((row) => row.original.id);
    handleRemove(ids);
  }

  function handleRemove(notifications: string[]) {
    const { removeNotifications } = notificationsStore.getState();
    removeNotifications(user.Id, notifications);
  }
}
