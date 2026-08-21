import _ from 'lodash';
import { useMemo } from 'react';

import {
  TeamAccessViewModel,
  UserAccessViewModel,
} from '@/portainer/models/access';
import { useUsers } from '@/portainer/users/queries';
import { useTeams } from '@/react/portainer/users/teams/queries/useTeams';
import { Access } from '@/react/portainer/access-control/AccessManagement/AccessDatatable/types';

import { EnvironmentGroup } from '../types';

/** Splits the users and teams between those already authorized on the group and those still available to be added. */
export function useGroupAccesses(group?: EnvironmentGroup) {
  const usersQuery = useUsers(false, 0, !!group, (users) =>
    users.map((user) => new UserAccessViewModel(user))
  );
  const teamsQuery = useTeams(false, 0, {
    enabled: !!group,
    select: (teams) => teams.map((team) => new TeamAccessViewModel(team)),
  });

  const userPolicies = group?.UserAccessPolicies;
  const teamPolicies = group?.TeamAccessPolicies;
  const users = usersQuery.data;
  const teams = teamsQuery.data;

  const accesses = useMemo(() => {
    const [authorized, available] = _.partition(
      [...(users || []), ...(teams || [])] as Array<Access>,
      (access) =>
        access.Type === 'user'
          ? !!userPolicies?.[access.Id]
          : !!teamPolicies?.[access.Id]
    );

    return {
      authorizedUsersAndTeams: authorized,
      availableUsersAndTeams: _.orderBy(available, 'Name', 'asc'),
    };
  }, [users, teams, userPolicies, teamPolicies]);

  return {
    ...accesses,
    isLoading: usersQuery.isLoading || teamsQuery.isLoading,
  };
}
