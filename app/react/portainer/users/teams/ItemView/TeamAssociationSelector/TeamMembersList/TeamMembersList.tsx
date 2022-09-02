import {
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from 'react-table';
import { useMemo, useState } from 'react';
import { Users, UserX } from 'react-feather';

import { User, UserId } from '@/portainer/users/types';
import { TeamId, TeamRole } from '@/react/portainer/users/teams/types';
import { useUser } from '@/portainer/hooks/useUser';
import { notifySuccess } from '@/portainer/services/notifications';
import {
  useRemoveMemberMutation,
  useTeamMemberships,
} from '@/react/portainer/users/teams/queries';

import { Widget } from '@@/Widget';
import { PageSelector } from '@@/PaginationControls/PageSelector';
import { Button } from '@@/buttons';
import { Table } from '@@/datatables';
import { Input } from '@@/form-components/Input';

import { name } from './name-column';
import { RowContext, RowProvider } from './RowContext';
import { teamRole } from './team-role-column';

const columns = [name, teamRole];

interface Props {
  users: User[];
  roles: Record<UserId, TeamRole>;
  disabled?: boolean;
  teamId: TeamId;
}

export function TeamMembersList({ users, roles, disabled, teamId }: Props) {
  const membershipsQuery = useTeamMemberships(teamId);

  const removeMemberMutation = useRemoveMemberMutation(
    teamId,
    membershipsQuery.data
  );

  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);

  const { isAdmin } = useUser();
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    gotoPage,
    setPageSize: setPageSizeInternal,
    setGlobalFilter: setGlobalFilterInternal,
    state: { pageIndex },
    setSortBy,
    rows,
  } = useTable<User>(
    {
      defaultCanFilter: false,
      columns,
      data: users,
      initialState: {
        pageSize,

        sortBy: [{ id: 'name', desc: false }],
        globalFilter: search,
      },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const tableProps = getTableProps();
  const tbodyProps = getTableBodyProps();
  const rowContext = useMemo<RowContext>(
    () => ({
      getRole(userId: UserId) {
        return roles[userId];
      },
      disabled,
      teamId,
    }),
    [roles, disabled, teamId]
  );
  return (
    <Widget>
      <Widget.Title icon={Users} title="Team members">
        Items per page:
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
          className="space-left"
        >
          <option value={Number.MAX_SAFE_INTEGER}>All</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </Widget.Title>
      <Widget.Taskbar className="col-sm-12 nopadding">
        <div className="col-sm-12 col-md-6 nopadding">
          {isAdmin && (
            <Button
              onClick={() =>
                handleRemoveMembers(rows.map(({ original }) => original.Id))
              }
              disabled={disabled || users.length === 0}
              icon={UserX}
            >
              Remove all users
            </Button>
          )}
        </div>
        <div className="col-sm-12 col-md-6 nopadding">
          <Input
            type="text"
            id="filter-users"
            value={search}
            onChange={handleSearchBarChange}
            placeholder="Filter..."
            className="input-sm"
          />
        </div>
      </Widget.Taskbar>
      <Widget.Body className="nopadding">
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
                <Table.HeaderRow<User>
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
              emptyContent="No users."
              prepareRow={prepareRow}
              rows={page}
              renderRow={(row, { key, className, role, style }) => (
                <RowProvider context={rowContext} key={key}>
                  <Table.Row<User>
                    cells={row.cells}
                    key={key}
                    className={className}
                    role={role}
                    style={style}
                  />
                </RowProvider>
              )}
            />
          </tbody>
        </Table>
        <Table.Footer>
          {pageSize !== 0 && (
            <div className="pagination-controls">
              <PageSelector
                maxSize={5}
                onPageChange={(p) => gotoPage(p - 1)}
                currentPage={pageIndex + 1}
                itemsPerPage={pageSize}
                totalCount={rows.length}
              />
            </div>
          )}
        </Table.Footer>
      </Widget.Body>
    </Widget>
  );

  function handlePageSizeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const pageSize = parseInt(e.target.value, 10);
    setPageSize(pageSize);
    setPageSizeInternal(pageSize);
  }

  function handleSearchBarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { value } = e.target;
    setSearch(value);
    setGlobalFilterInternal(value);
  }

  function handleSortChange(id: string, desc: boolean) {
    setSortBy([{ id, desc }]);
  }

  function handleRemoveMembers(userIds: UserId[]) {
    removeMemberMutation.mutate(userIds, {
      onSuccess() {
        notifySuccess('Success', 'All users successfully removed');
      },
    });
  }
}
