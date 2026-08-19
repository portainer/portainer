import { PortainerNamespaceAccessesConfigMap } from '@/react/kubernetes/configs/constants';
import { User } from '@/portainer/users/types';
import { Team } from '@/react/portainer/users/teams/types';
import { Configuration } from '@/react/kubernetes/configs/types';

import { NamespaceAccess, NamespaceAccessesMap } from './types';

export function parseNamespaceAccesses(
  data: Configuration | null,
  namespaceName: string,
  users: User[],
  teams: Team[]
) {
  if (!data) {
    return [];
  }
  const namespacesAccesses: NamespaceAccessesMap = JSON.parse(
    data?.Data?.[PortainerNamespaceAccessesConfigMap.accessKey] ?? '{}'
  );
  const userAccessesIds = Object.keys(
    namespacesAccesses[namespaceName]?.UserAccessPolicies ?? {}
  );
  const userAccesses: NamespaceAccess[] = users
    .filter((user) => userAccessesIds.includes(`${user.Id}`))
    .map((user) => ({
      id: user.Id,
      name: user.Username,
      type: 'user',
    }));
  const teamAccessesIds = Object.keys(
    namespacesAccesses[namespaceName]?.TeamAccessPolicies ?? {}
  );
  const teamAccesses: NamespaceAccess[] = teams
    .filter((team) => teamAccessesIds.includes(`${team.Id}`))
    .map((team) => ({
      id: team.Id,
      name: team.Name,
      type: 'team',
    }));
  return [...userAccesses, ...teamAccesses];
}
