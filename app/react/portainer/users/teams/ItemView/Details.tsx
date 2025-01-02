import { useRouter } from '@uirouter/react';
import { Users } from 'lucide-react';

import { usePublicSettings } from '@/react/portainer/settings/queries';

import { Widget } from '@@/Widget';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { Team, TeamMembership, TeamRole } from '../types';
import { useDeleteTeamMutation } from '../queries/useDeleteTeamMutation';

interface Props {
  team: Team;
  memberships: TeamMembership[];
  isAdmin: boolean;
}

export function Details({ team, memberships, isAdmin }: Props) {
  const deleteMutation = useDeleteTeamMutation();
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
                    <div className="flex gap-2">
                      {!teamSyncQuery.data && team.Name}
                      {isAdmin && (
                        <DeleteButton
                          size="xsmall"
                          onConfirmed={handleDeleteClick}
                          confirmMessage="Do you want to delete this team? Users in this team will not be deleted."
                          data-cy={`delete-team-${team.Name}`}
                        >
                          Delete this team
                        </DeleteButton>
                      )}
                    </div>
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
    router.stateService.go('portainer.teams');
    deleteMutation.mutate(team.Id);
  }
}
