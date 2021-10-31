import axios from '@/portainer/services/axios';

import { EnvironmentId, TeamAccessPolicies, UserAccessPolicies } from '../types'; // map[UserID]AccessPolicy

import { buildUrl } from './utils';

export type RegistryId = number;
export interface Registry {
  Id: RegistryId;
}

interface RegistryAccess {
  UserAccessPolicies: UserAccessPolicies;
  TeamAccessPolicies: TeamAccessPolicies;
  Namespaces: string[];
}

export async function updateEnvironmentRegistryAccess(id: EnvironmentId, registryId: RegistryId, access: RegistryAccess) {
  return axios.put<void>(buildRegistryUrl(id, registryId), access);
}

export async function getEnvironmentRegistries(id: EnvironmentId, namespace: string) {
  const { data } = await axios.get<Registry[]>(buildRegistryUrl(id), {
    params: { namespace },
  });
  return data;
}

export async function getEnvironmentRegistry(endpointId: EnvironmentId, registryId: RegistryId) {
  const { data } = await axios.get<Registry>(buildRegistryUrl(endpointId, registryId));
  return data;
}

function buildRegistryUrl(id: EnvironmentId, registryId?: RegistryId) {
  let url = `${buildUrl(id)}/registries`;

  if (registryId) {
    url += `/${registryId}`;
  }

  return url;
}
