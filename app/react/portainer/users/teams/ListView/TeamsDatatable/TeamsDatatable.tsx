import { useMutation, useQueryClient } from 'react-query';
import { Users } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

import { notifySuccess } from '@/portainer/services/notifications';
import { promiseSequence } from '@/portainer/helpers/promise-utils';
import { Team, TeamId } from '@/react/portainer/users/teams/types';
import { deleteTeam } from '@/react/portainer/users/teams/teams.service';

import { Datatable } from '@@/datatables';
import { buildNameColumn } from '@@/datatables/buildNameColumn';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';

const storageKey = 'teams';

const columns: ColumnDef<Team>[] = [
  buildNameColumn<Team>('Name', 'portainer.teams.team'),
];

interface Props {
  teams: Team[];
  isAdmin: boolean;
}

const settingsStore = createPersistedStore(storageKey, 'name');

export function TeamsDatatable({ teams, isAdmin }: Props) {
  const { handleRemove } = useRemoveMutation();
  const tableState = useTableState(settingsStore, storageKey);

  return (
    <Datatable<Team>
      dataset={teams}
      columns={columns}
      settingsManager={tableState}
      title="Teams"
      titleIcon={Users}
      renderTableActions={(selectedRows) =>
        isAdmin && (
          <DeleteButton
            onConfirmed={() => handleRemoveClick(selectedRows)}
            disabled={selectedRows.length === 0}
            confirmMessage="Are you sure you want to remove the selected teams?"
          />
        )
      }
      emptyContentLabel="No teams found"
    />
  );

  function handleRemoveClick(selectedRows: Team[]) {
    const ids = selectedRows.map((row) => row.Id);
    handleRemove(ids);
  }
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
    deleteMutation.mutate(teams, {
      onSuccess: () => {
        notifySuccess('Teams successfully removed', '');
      },
    });
  }
}
