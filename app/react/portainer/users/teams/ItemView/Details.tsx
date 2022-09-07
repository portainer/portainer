import { useRouter } from '@uirouter/react';
import { useMutation, useQueryClient } from 'react-query';
import { Trash2, Users } from 'react-feather';

import { confirmDeletionAsync } from '@/portainer/services/modal.service/confirm';
import { usePublicSettings } from '@/react/portainer/settings/queries';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';

import { Button } from '@@/buttons';
import { Widget } from '@@/Widget';

import { Team, TeamId, TeamMembership, TeamRole } from '../types';
import { deleteTeam } from '../teams.service';

interface Props {
  team: Team;
  memberships: TeamMembership[];
  isAdmin: boolean;
}

export function Details({ team, memberships, isAdmin }: Props) {
  const deleteMutation = useDeleteTeam();
  const router = useRouter();
  const teamSyncQuery = usePublicSettings<boolean>({
    select: (settings) => settings.TeamSync,
  });

  const leaderCount = memberships.filter(
    (m) => m.Role === TeamRole.Leader
  ).length;

  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-xs-12">
        <Widget>
          <Widget.Title title="Team details" icon={Users} />

          <Widget.Body className="no-padding">
            <table className="table">
              <tbody>
                <tr>
                  <td>Name</td>
                  <td>
                    {!teamSyncQuery.data && team.Name}
                    {isAdmin && (
                      <Button
                        color="danger"
                        size="xsmall"
                        onClick={handleDeleteClick}
                        icon={Trash2}
                      >
                        Delete this team
                      </Button>
                    )}
                  </td>
                </tr>
                <tr>
                  <td>Leaders</td>
                  <td>{!teamSyncQuery.data && leaderCount}</td>
                </tr>
                <tr>
                  <td>Total users in team</td>
                  <td>{memberships.length}</td>
                </tr>
              </tbody>
            </table>
          </Widget.Body>
        </Widget>
      </div>
    </div>
  );

  async function handleDeleteClick() {
    const confirmed = await confirmDeletionAsync(
      `Do you want to delete this team? Users in this team will not be deleted.`
    );
    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(team.Id, {
      onSuccess() {
        router.stateService.go('portainer.teams');
      },
    });
  }
}

function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation(
    (id: TeamId) => deleteTeam(id),

    mutationOptions(
      withError('Unable to delete team'),
      withInvalidate(queryClient, [['teams']])
    )
  );
}
