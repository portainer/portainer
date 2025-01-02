import axios, { parseAxiosError } from '@/portainer/services/axios';
import { TeamId } from '@/react/portainer/users/teams/types';
import { UserId } from '@/portainer/users/types';
import {
  RegistryId,
  Registry,
} from '@/react/portainer/registries/types/registry';

import { EnvironmentId } from '../types';

import { buildUrl } from './utils';

export type RoleId = number;
interface AccessPolicy {
  RoleId: RoleId;
}

type UserAccessPolicies = Record<UserId, AccessPolicy>; // map[UserID]AccessPolicy
type TeamAccessPolicies = Record<TeamId, AccessPolicy>;

interface RegistryAccess {
  UserAccessPolicies: UserAccessPolicies;
  TeamAccessPolicies: TeamAccessPolicies;
  Namespaces: string[];
}

export async function updateEnvironmentRegistryAccess(
  environmentId: EnvironmentId,
  registryId: RegistryId,
  access: Partial<RegistryAccess>
) {
  try {
    await axios.put<void>(buildRegistryUrl(environmentId, registryId), access);
  } catch (e) {
    throw parseAxiosError(e);
  }
}

export async function getEnvironmentRegistries(
  id: EnvironmentId,
  namespace: string
) {
  try {
    const { data } = await axios.get<Registry[]>(buildRegistryUrl(id), {
      params: { namespace },
    });
    return data;
  } catch (e) {
    throw parseAxiosError(e);
  }
}

export async function getEnvironmentRegistry(
  endpointId: EnvironmentId,
  registryId: RegistryId
) {
  try {
    const { data } = await axios.get<Registry>(
      buildRegistryUrl(endpointId, registryId)
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e);
  }
}

function buildRegistryUrl(id: EnvironmentId, registryId?: RegistryId) {
  let url = `${buildUrl(id)}/registries`;

  if (registryId) {
    url += `/${registryId}`;
  }

  return url;
}
