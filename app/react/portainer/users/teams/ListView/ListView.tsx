import { useUsers } from '@/portainer/users/queries';
import { useUser } from '@/react/hooks/useUser';

import { PageHeader } from '@@/PageHeader';

import { useTeams } from '../queries';

import { CreateTeamForm } from './CreateTeamForm';
import { TeamsDatatable } from './TeamsDatatable';

export function ListView() {
  const { isAdmin } = useUser();

  const usersQuery = useUsers(false);
  const teamsQuery = useTeams(!isAdmin, 0, { enabled: !!usersQuery.data });

  return (
    <>
      <PageHeader title="Teams" breadcrumbs={[{ label: 'Teams management' }]} />

      {isAdmin && usersQuery.data && teamsQuery.data && (
        <CreateTeamForm users={usersQuery.data} teams={teamsQuery.data} />
      )}

      {teamsQuery.data && (
        <TeamsDatatable teams={teamsQuery.data} isAdmin={isAdmin} />
      )}
    </>
  );
}
