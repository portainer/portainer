import { useEffect } from 'react';
import {
  useTable,
  useSortBy,
  useGlobalFilter,
  usePagination,
} from 'react-table';
import { useRowSelectColumn } from '@lineup-lite/hooks';
import { Box, Plus, Trash2 } from 'react-feather';

import { useDebounce } from '@/portainer/hooks/useDebounce';
import { ContainerGroup } from '@/react/azure/types';
import { Authorized } from '@/portainer/hooks/useUser';
import { confirmDeletionAsync } from '@/portainer/services/modal.service/confirm';

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
import { useRowSelect } from '@@/datatables/useRowSelect';
import { Checkbox } from '@@/form-components/Checkbox';
import { TableFooter } from '@@/datatables/TableFooter';
import { SelectedRowsCount } from '@@/datatables/SelectedRowsCount';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';

import { TableSettings } from './types';
import { useColumns } from './columns';

export interface Props {
  tableKey: string;
  dataset: ContainerGroup[];
  onRemoveClick(containerIds: string[]): void;
}

export function ContainersDatatable({
  dataset,
  tableKey,
  onRemoveClick,
}: Props) {
  const { settings, setTableSettings } = useTableSettings<TableSettings>();
  const [searchBarValue, setSearchBarValue] = useSearchBarState(tableKey);

  const columns = useColumns();
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
  } = useTable<ContainerGroup>(
    {
      defaultCanFilter: false,
      columns,
      data: dataset,
      filterTypes: { multiple },
      initialState: {
        pageSize: settings.pageSize || 10,
        sortBy: [settings.sortBy],
        globalFilter: searchBarValue,
      },
      selectCheckboxComponent: Checkbox,
      autoResetSelectedRows: false,
      getRowId(row) {
        return row.id;
      },
    },
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

  const tableProps = getTableProps();
  const tbodyProps = getTableBodyProps();

  return (
    <div className="row">
      <div className="col-sm-12">
        <TableContainer>
          <TableTitle icon={Box} label="Containers">
            <SearchBar
              value={searchBarValue}
              onChange={handleSearchBarChange}
            />

            <TableActions>
              <Authorized authorizations="AzureContainerGroupDelete">
                <Button
                  color="dangerlight"
                  disabled={selectedFlatRows.length === 0}
                  onClick={() =>
                    handleRemoveClick(
                      selectedFlatRows.map((row) => row.original.id)
                    )
                  }
                  icon={Trash2}
                >
                  Remove
                </Button>
              </Authorized>

              <Authorized authorizations="AzureContainerGroupCreate">
                <Link to="azure.containerinstances.new" className="space-left">
                  <Button icon={Plus}>Add container</Button>
                </Link>
              </Authorized>
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
                  <TableHeaderRow<ContainerGroup>
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
                prepareRow={prepareRow}
                renderRow={(row, { key, className, role, style }) => (
                  <TableRow<ContainerGroup>
                    cells={row.cells}
                    key={key}
                    className={className}
                    role={role}
                    style={style}
                  />
                )}
                rows={page}
                emptyContent="No container available."
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
              totalCount={dataset.length}
              onPageLimitChange={handlePageSizeChange}
            />
          </TableFooter>
        </TableContainer>
      </div>
    </div>
  );

  async function handleRemoveClick(containerIds: string[]) {
    const confirmed = await confirmDeletionAsync(
      'Are you sure you want to delete the selected containers?'
    );
    if (!confirmed) {
      return null;
    }

    return onRemoveClick(containerIds);
  }

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
