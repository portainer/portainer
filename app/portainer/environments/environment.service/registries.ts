import axios, { parseAxiosError } from '@/portainer/services/axios';

import {
  EnvironmentId,
  TeamAccessPolicies,
  UserAccessPolicies,
} from '../types';

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

export async function updateEnvironmentRegistryAccess(
  id: EnvironmentId,
  registryId: RegistryId,
  access: RegistryAccess
) {
  try {
    await axios.put<void>(buildRegistryUrl(id, registryId), access);
  } catch (e) {
    throw parseAxiosError(e as Error);
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
    throw parseAxiosError(e as Error);
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
    throw parseAxiosError(e as Error);
  }
}

function buildRegistryUrl(id: EnvironmentId, registryId?: RegistryId) {
  let url = `${buildUrl(id)}/registries`;

  if (registryId) {
    url += `/${registryId}`;
  }

  return url;
}
