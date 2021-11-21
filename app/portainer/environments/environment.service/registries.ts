import { AxiosError } from 'axios';

import axios from '@/portainer/services/axios';

import {
  EnvironmentId,
  TeamAccessPolicies,
  UserAccessPolicies,
} from '../types'; // map[UserID]AccessPolicy

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
    const axiosError = e as AxiosError;
    if (!axiosError.isAxiosError) {
      throw e;
    }
    throw new Error(axiosError.response?.data.message);
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
    const axiosError = e as AxiosError;
    if (!axiosError.isAxiosError) {
      throw e;
    }
    throw new Error(axiosError.response?.data.message);
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
    const axiosError = e as AxiosError;
    if (!axiosError.isAxiosError) {
      throw e;
    }
    throw new Error(axiosError.response?.data.message);
  }
}

function buildRegistryUrl(id: EnvironmentId, registryId?: RegistryId) {
  let url = `${buildUrl(id)}/registries`;

  if (registryId) {
    url += `/${registryId}`;
  }

  return url;
}
