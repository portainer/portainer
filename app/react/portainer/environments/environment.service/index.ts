import { endpointList } from '@api/sdk.gen';
import { PortainerEndpoint } from '@api/types.gen';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import {
  Environment,
  EnvironmentId,
  EnvironmentType,
  EnvironmentSecuritySettings,
  EnvironmentStatus,
  EnvironmentGroupId,
  PlatformType,
  EdgeGroupId,
} from '@/react/portainer/environments/types';
import { type TagId } from '@/portainer/tags/types';
import { UserId } from '@/portainer/users/types';
import { TeamId } from '@/react/portainer/users/teams/types';
import {
  EdgeStack,
  StatusType as EdgeStackStatusType,
} from '@/react/edge/edge-stacks/types';

import { getPublicSettings } from '../../settings/settings.service';
import { SortType } from '../queries/useEnvironmentList';

import { buildUrl, toEnvironment } from './utils';

export type EdgeStackEnvironmentsQueryParams =
  | {
      edgeStackId?: EdgeStack['Id'];
    }
  | {
      edgeStackId: EdgeStack['Id'];
      edgeStackStatus?: EdgeStackStatusType;
    };

export interface BaseEnvironmentsQueryParams {
  search?: string;
  types?: EnvironmentType[] | readonly EnvironmentType[];
  tagIds?: TagId[];
  endpointIds?: EnvironmentId[];
  excludeIds?: EnvironmentId[];
  excludeGroupIds?: EnvironmentGroupId[];
  tagsPartialMatch?: boolean;
  groupIds?: EnvironmentGroupId[];
  status?: EnvironmentStatus[];
  edgeAsync?: boolean;
  edgeDeviceUntrusted?: boolean;
  excludeSnapshots?: boolean;
  name?: string;
  /** Filter environments by partial name match (case-insensitive, searches name only) */
  nameFilter?: string;
  agentVersions?: string[];
  updateInformation?: boolean;
  edgeCheckInPassedSeconds?: number;
  platformTypes?: PlatformType[];
  edgeGroupIds?: EdgeGroupId[];
  excludeEdgeGroupIds?: EdgeGroupId[];
  outdated?: boolean;
}

export type EnvironmentsQueryParams = BaseEnvironmentsQueryParams &
  EdgeStackEnvironmentsQueryParams;

export interface GetEnvironmentsOptions {
  start?: number;
  limit?: number;
  sort?: {
    by?: SortType;
    order?: 'asc' | 'desc';
  };
  query?: EnvironmentsQueryParams;
}

export async function getEnvironments(
  {
    start,
    limit,
    sort = { by: undefined, order: 'asc' },
    query = {},
  }: GetEnvironmentsOptions = { query: {} }
) {
  if (
    (query.tagIds && query.tagIds.length === 0) ||
    (query.endpointIds && query.endpointIds.length === 0)
  ) {
    return {
      totalCount: 0,
      value: <Environment[]>[],
      totalAvailable: 0,
      updateAvailable: false,
    };
  }

  const response = await endpointList({
    query: {
      start,
      limit,
      sort: sort.by,
      order: sort.order,
      ...query,
      types: query.types ? [...query.types] : undefined,
    },
  });

  const totalCount = (response.headers['x-total-count'] || '0') as string;
  const totalAvailable = (response.headers['x-total-available'] ||
    '0') as string;
  const updateAvailable = response.headers['x-update-available'] === 'true';

  return {
    totalCount: parseInt(totalCount, 10),
    value: (response.data ?? []).map(toEnvironment),
    totalAvailable: parseInt(totalAvailable, 10),
    updateAvailable,
  };
}

export interface GroupCount {
  groupName: string;
  groupID: number;
  count: number;
}

export interface PlatformCounts {
  docker: number;
  kubernetes: number;
  podman: number;
  azure: number;
}

export interface HealthCounts {
  down: number;
  up: number;
  heartbeat: number;
  outdated: number;
}

export interface EnvironmentSummaryCounts {
  total: number;
  up: number;
  down: number;
  outdated: number;
  unassigned: number;
  byGroup: GroupCount[];
  byPlatformType: PlatformCounts;
  byHealth: HealthCounts;
}

export async function getEnvironmentSummaryCounts() {
  try {
    const { data } = await axios.get<EnvironmentSummaryCounts>(
      buildUrl(undefined, 'summary')
    );
    return data;
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

export async function getEndpoint(id: EnvironmentId, excludeSnapshot = true) {
  try {
    const { data: endpoint } = await axios.get<PortainerEndpoint>(
      buildUrl(id),
      {
        params: { excludeSnapshot },
      }
    );
    return toEnvironment(endpoint);
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

export async function getDeploymentOptions(environmentId: EnvironmentId) {
  const publicSettings = await getPublicSettings();
  const endpoint = await getEndpoint(environmentId);

  if (
    publicSettings.GlobalDeploymentOptions.perEnvOverride &&
    endpoint.DeploymentOptions?.overrideGlobalOptions
  ) {
    return endpoint.DeploymentOptions;
  }

  return publicSettings.GlobalDeploymentOptions;
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
