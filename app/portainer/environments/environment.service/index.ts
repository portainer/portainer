import axios, { parseAxiosError } from '@/portainer/services/axios';
import { type EnvironmentGroupId } from '@/portainer/environment-groups/types';
import { type TagId } from '@/portainer/tags/types';
import { UserId } from '@/portainer/users/types';
import { TeamId } from '@/react/portainer/users/teams/types';

import type {
  Environment,
  EnvironmentId,
  EnvironmentType,
  EnvironmentSecuritySettings,
  EnvironmentStatus,
} from '../types';

import { buildUrl } from './utils';

export interface EnvironmentsQueryParams {
  search?: string;
  types?: EnvironmentType[] | readonly EnvironmentType[];
  tagIds?: TagId[];
  endpointIds?: EnvironmentId[];
  tagsPartialMatch?: boolean;
  groupIds?: EnvironmentGroupId[];
  status?: EnvironmentStatus[];
  edgeDevice?: boolean;
  edgeDeviceUntrusted?: boolean;
  excludeSnapshots?: boolean;
  provisioned?: boolean;
  name?: string;
  agentVersions?: string[];
}

export interface GetEnvironmentsOptions {
  start?: number;
  limit?: number;
  sort?: { by?: string; order?: 'asc' | 'desc' };
  query?: EnvironmentsQueryParams;
}

export async function getEnvironments(
  {
    start,
    limit,
    sort = { by: '', order: 'asc' },
    query = {},
  }: GetEnvironmentsOptions = { query: {} }
) {
  if (query.tagIds && query.tagIds.length === 0) {
    return { totalCount: 0, value: <Environment[]>[] };
  }

  const url = buildUrl();

  const params: Record<string, unknown> = {
    start,
    limit,
    sort: sort.by,
    order: sort.order,
    ...query,
  };

  try {
    const response = await axios.get<Environment[]>(url, { params });
    const totalCount = response.headers['x-total-count'];
    const totalAvailable = response.headers['x-total-available'];

    return {
      totalCount: parseInt(totalCount, 10),
      value: response.data,
      totalAvailable: parseInt(totalAvailable, 10),
    };
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}

export async function getAgentVersions() {
  try {
    const response = await axios.get<string[]>(
      buildUrl(undefined, 'agent_versions')
    );
    return response.data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}

export async function getEndpoint(id: EnvironmentId) {
  try {
    const { data: endpoint } = await axios.get<Environment>(buildUrl(id));
    return endpoint;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}

export async function snapshotEndpoints() {
  try {
    await axios.post<void>(buildUrl(undefined, 'snapshot'));
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}

export async function snapshotEndpoint(id: EnvironmentId) {
  try {
    await axios.post<void>(buildUrl(id, 'snapshot'));
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}

export async function endpointsByGroup(
  groupId: EnvironmentGroupId,
  start: number,
  limit: number,
  query: Omit<EnvironmentsQueryParams, 'groupIds'>
) {
  return getEnvironments({
    start,
    limit,
    query: { groupIds: [groupId], ...query },
  });
}

export async function disassociateEndpoint(id: EnvironmentId) {
  try {
    await axios.delete(buildUrl(id, 'association'));
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}

interface UpdatePayload {
  TLSCACert?: File;
  TLSCert?: File;
  TLSKey?: File;

  Name: string;
  PublicURL: string;
  GroupID: EnvironmentGroupId;
  TagIds: TagId[];

  EdgeCheckinInterval: number;

  TLS: boolean;
  TLSSkipVerify: boolean;
  TLSSkipClientVerify: boolean;
  AzureApplicationID: string;
  AzureTenantID: string;
  AzureAuthenticationKey: string;
}

async function uploadTLSFilesForEndpoint(
  id: EnvironmentId,
  tlscaCert?: File,
  tlsCert?: File,
  tlsKey?: File
) {
  await Promise.all([
    uploadCert('ca', tlscaCert),
    uploadCert('cert', tlsCert),
    uploadCert('key', tlsKey),
  ]);

  function uploadCert(type: 'ca' | 'cert' | 'key', cert?: File) {
    if (!cert) {
      return null;
    }
    try {
      return axios.post<void>(`upload/tls/${type}`, cert, {
        params: { folder: id },
      });
    } catch (e) {
      throw parseAxiosError(e as Error);
    }
  }
}

export async function updateEndpoint(
  id: EnvironmentId,
  payload: UpdatePayload
) {
  try {
    await uploadTLSFilesForEndpoint(
      id,
      payload.TLSCACert,
      payload.TLSCert,
      payload.TLSKey
    );

    const { data: endpoint } = await axios.put<Environment>(
      buildUrl(id),
      payload
    );

    return endpoint;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to update environment');
  }
}

export async function deleteEndpoint(id: EnvironmentId) {
  try {
    await axios.delete(buildUrl(id));
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}

export async function updatePoolAccess(
  id: EnvironmentId,
  resourcePool: string,
  usersToAdd: UserId[],
  teamsToAdd: TeamId[],
  usersToRemove: UserId[],
  teamsToRemove: TeamId[]
) {
  try {
    await axios.put<void>(`${buildUrl(id, 'pools')}/${resourcePool}/access`, {
      usersToAdd,
      teamsToAdd,
      usersToRemove,
      teamsToRemove,
    });
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}

export async function forceUpdateService(
  id: EnvironmentId,
  serviceID: string,
  pullImage: boolean
) {
  try {
    await axios.put(buildUrl(id, 'forceupdateservice'), {
      serviceID,
      pullImage,
    });
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}

export async function updateSettings(
  id: EnvironmentId,
  settings: EnvironmentSecuritySettings
) {
  try {
    await axios.put(buildUrl(id, 'settings'), settings);
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
