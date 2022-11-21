import { Fragment, useEffect } from 'react';
import {
  useFilters,
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from 'react-table';

import { NomadEvent } from '@/react/nomad/types';
import { useDebouncedValue } from '@/react/hooks/useDebouncedValue';

import { PaginationControls } from '@@/PaginationControls';
import {
  Table,
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

import { useColumns } from './columns';

export interface EventsDatatableProps {
  data: NomadEvent[];
  isLoading: boolean;
}

export interface EventsTableSettings {
  autoRefreshRate: number;
  pageSize: number;
  sortBy: { id: string; desc: boolean };
}

export function EventsDatatable({ data, isLoading }: EventsDatatableProps) {
  const { settings, setTableSettings } =
    useTableSettings<EventsTableSettings>();
  const [searchBarValue, setSearchBarValue] = useSearchBarState('events');
  const columns = useColumns();
  const debouncedSearchValue = useDebouncedValue(searchBarValue);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    gotoPage,
    setPageSize,
    setGlobalFilter,
    state: { pageIndex, pageSize },
  } = useTable<NomadEvent>(
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
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  useEffect(() => {
    setGlobalFilter(debouncedSearchValue);
  }, [debouncedSearchValue, setGlobalFilter]);

  const tableProps = getTableProps();
  const tbodyProps = getTableBodyProps();

  return (
    <TableContainer>
      <TableTitle icon="fa-history" label="Events" />

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
              <TableHeaderRow<NomadEvent>
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
            isLoading={isLoading}
            emptyContent="No events found"
            renderRow={(row, { key, className, role, style }) => (
              <Fragment key={key}>
                <TableRow<NomadEvent>
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
}
