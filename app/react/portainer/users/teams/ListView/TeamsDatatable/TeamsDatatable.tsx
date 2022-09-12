import { useRowSelectColumn } from '@lineup-lite/hooks';
import {
  Column,
  useGlobalFilter,
  usePagination,
  useRowSelect,
  useSortBy,
  useTable,
} from 'react-table';
import { useMutation, useQueryClient } from 'react-query';
import { Trash2, Users } from 'react-feather';

import { notifySuccess } from '@/portainer/services/notifications';
import { promiseSequence } from '@/portainer/helpers/promise-utils';
import { Team, TeamId } from '@/react/portainer/users/teams/types';
import { deleteTeam } from '@/react/portainer/users/teams/teams.service';
import { confirmDeletionAsync } from '@/portainer/services/modal.service/confirm';

import { PaginationControls } from '@@/PaginationControls';
import { Checkbox } from '@@/form-components/Checkbox';
import { Table } from '@@/datatables';
import { Button } from '@@/buttons';
import { SearchBar, useSearchBarState } from '@@/datatables/SearchBar';
import { TableFooter } from '@@/datatables/TableFooter';
import { SelectedRowsCount } from '@@/datatables/SelectedRowsCount';
import {
  TableSettingsProvider,
  useTableSettings,
} from '@@/datatables/useTableSettings';
import { TableContent } from '@@/datatables/TableContent';
import { buildNameColumn } from '@@/datatables/NameCell';

import { TableSettings } from './types';

const tableKey = 'teams';

const columns: readonly Column<Team>[] = [
  buildNameColumn('Name', 'Id', 'portainer.teams.team'),
] as const;

interface Props {
  teams: Team[];
  isAdmin: boolean;
}

export function TeamsDatatable({ teams, isAdmin }: Props) {
  const { handleRemove } = useRemoveMutation();

  const [searchBarValue, setSearchBarValue] = useSearchBarState(tableKey);
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
  } = useTable<Team>(
    {
      defaultCanFilter: false,
      columns,
      data: teams,

      initialState: {
        pageSize: settings.pageSize || 10,
        sortBy: [settings.sortBy],
        globalFilter: searchBarValue,
      },
      selectCheckboxComponent: Checkbox,
    },

    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect,
    isAdmin ? useRowSelectColumn : emptyPlugin
  );

  const tableProps = getTableProps();
  const tbodyProps = getTableBodyProps();

  return (
    <div className="row">
      <div className="col-sm-12">
        <Table.Container>
          <Table.Title icon={Users} label="Teams">
            <SearchBar
              value={searchBarValue}
              onChange={handleSearchBarChange}
            />

            {isAdmin && (
              <Table.Actions>
                <Button
                  color="dangerlight"
                  onClick={handleRemoveClick}
                  disabled={selectedFlatRows.length === 0}
                  icon={Trash2}
                >
                  Remove
                </Button>
              </Table.Actions>
            )}
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
                  <Table.HeaderRow<Team>
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
                prepareRow={prepareRow}
                renderRow={(row, { key, className, role, style }) => (
                  <Table.Row<Team>
                    cells={row.cells}
                    key={key}
                    className={className}
                    role={role}
                    style={style}
                  />
                )}
                rows={page}
                emptyContent="No teams found"
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
              totalCount={teams.length}
              onPageLimitChange={handlePageSizeChange}
            />
          </TableFooter>
        </Table.Container>
      </div>
    </div>
  );

  function handlePageSizeChange(pageSize: number) {
    setPageSize(pageSize);
    setTableSettings({ pageSize });
  }

  function handleSearchBarChange(value: string) {
    setSearchBarValue(value);
    setGlobalFilter(value);
  }

  function handleSortChange(id: string, desc: boolean) {
    setTableSettings({ sortBy: { id, desc } });
  }

  function handleRemoveClick() {
    const ids = selectedFlatRows.map((row) => row.original.Id);
    handleRemove(ids);
  }
}

const defaultSettings: TableSettings = {
  pageSize: 10,
  sortBy: { id: 'name', desc: false },
};

export function TeamsDatatableContainer(props: Props) {
  return (
    <TableSettingsProvider<TableSettings>
      defaults={defaultSettings}
      storageKey={tableKey}
    >
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <TeamsDatatable {...props} />
    </TableSettingsProvider>
  );
}

function useRemoveMutation() {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    async (ids: TeamId[]) =>
      promiseSequence(ids.map((id) => () => deleteTeam(id))),
    {
      meta: {
        error: { title: 'Failure', message: 'Unable to remove team' },
      },
      onSuccess() {
        return queryClient.invalidateQueries(['teams']);
      },
    }
  );

  return { handleRemove };

  async function handleRemove(teams: TeamId[]) {
    const confirmed = await confirmDeletionAsync(
      'Are you sure you want to remove the selected teams?'
    );

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(teams, {
      onSuccess: () => {
        notifySuccess('Teams successfully removed', '');
      },
    });
  }
}

function emptyPlugin() {}
emptyPlugin.pluginName = 'emptyPlugin';
