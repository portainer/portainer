import { useQuery } from '@tanstack/react-query';
import {
  ContainerConfig,
  ContainerState,
  GraphDriverData,
  HostConfig,
  MountPoint,
  NetworkSettings,
} from 'docker-types/generated/1.41';

import { PortainerResponse } from '@/react/docker/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { ContainerId } from '@/react/docker/containers/types';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { queryClient } from '@/react-tools/react-query';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import { withAgentTargetHeader } from '../../proxy/queries/utils';

import { queryKeys } from './query-keys';

/**
 * Raw Docker Container Details response
 */
export interface ContainerDetailsJSON {
  /**
   * The ID of the container
   */
  Id?: string;
  /**
   * The time the container was created
   */
  Created?: string;
  /**
   * The path to the command being run
   */
  Path?: string;
  /**
   * The arguments to the command being run
   */
  Args?: Array<string>;
  State?: ContainerState;
  /**
   * The container's image ID
   */
  Image?: string;
  ResolvConfPath?: string;
  HostnamePath?: string;
  HostsPath?: string;
  LogPath?: string;
  Name?: string;
  RestartCount?: number;
  Driver?: string;
  Platform?: string;
  MountLabel?: string;
  ProcessLabel?: string;
  AppArmorProfile?: string;
  /**
   * IDs of exec instances that are running in the container.
   */
  ExecIDs?: Array<string> | null;
  HostConfig?: HostConfig;
  GraphDriver?: GraphDriverData;
  /**
   * The size of files that have been created or changed by this
   * container.
   *
   */
  SizeRw?: number;
  /**
   * The total size of all the files in this container.
   */
  SizeRootFs?: number;
  Mounts?: Array<MountPoint>;
  Config?: ContainerConfig;
  NetworkSettings?: NetworkSettings;
}

export function useContainer(
  environmentId: EnvironmentId,
  containerId?: ContainerId,
  nodeName?: string,
  { enabled }: { enabled?: boolean } = {}
) {
  return useQuery(
    containerId ? queryKeys.container(environmentId, containerId) : [],
    () =>
      containerId
        ? getContainer(environmentId, containerId, { nodeName })
        : undefined,
    {
      meta: {
        title: 'Failure',
        message: 'Unable to retrieve container',
      },
      enabled: enabled && !!containerId,
    }
  );
}

export function invalidateContainer(
  environmentId: EnvironmentId,
  containerId?: ContainerId
) {
  return queryClient.invalidateQueries(
    containerId ? queryKeys.container(environmentId, containerId) : []
  );
}

export type ContainerDetailsResponse = PortainerResponse<ContainerDetailsJSON>;

/**
 * Raw docker API proxy
 * @param environmentId
 * @param id
 * @param param2
 * @returns
 */
export async function getContainer(
  environmentId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  try {
    const { data } = await axios.get<ContainerDetailsResponse>(
      buildDockerProxyUrl(environmentId, 'containers', id, 'json'),
      {
        headers: {
          ...withAgentTargetHeader(nodeName),
        },
      }
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to retrieve container');
  }
}
