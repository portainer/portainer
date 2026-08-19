import { useUsers } from '@/portainer/users/queries';
import { useCurrentUser } from '@/react/hooks/useUser';

import { PageHeader } from '@@/PageHeader';

import { useTeams } from '../queries';

import { CreateTeamForm } from './CreateTeamForm';
import { TeamsDatatable } from './TeamsDatatable';

export function ListView() {
  const { isPureAdmin } = useCurrentUser();

  const usersQuery = useUsers(false);
  const teamsQuery = useTeams(!isPureAdmin, 0);

  return (
    <>
      <PageHeader
        title="Teams"
        breadcrumbs={[{ label: 'Teams management' }]}
        reload
      />

      {isPureAdmin && usersQuery.data && teamsQuery.data && (
        <CreateTeamForm users={usersQuery.data} teams={teamsQuery.data} />
      )}

      {teamsQuery.data && (
        <TeamsDatatable teams={teamsQuery.data} isAdmin={isPureAdmin} />
      )}
    </>
  );
}
