import { useQuery } from 'react-query';
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
import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';

import { urlBuilder } from '../containers.service';

import { queryKeys } from './query-keys';

export interface ContainerJSON {
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
  containerId: ContainerId
) {
  return useQuery(
    queryKeys.container(environmentId, containerId),
    () => getContainer(environmentId, containerId),
    {
      meta: {
        title: 'Failure',
        message: 'Unable to retrieve container',
      },
    }
  );
}

export type ContainerResponse = PortainerResponse<ContainerJSON>;

async function getContainer(
  environmentId: EnvironmentId,
  containerId: ContainerId
) {
  try {
    const { data } = await axios.get<ContainerResponse>(
      urlBuilder(environmentId, containerId, 'json')
    );
    return parseViewModel(data);
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to retrieve container');
  }
}

export function parseViewModel(response: ContainerResponse) {
  const resourceControl =
    response.Portainer?.ResourceControl &&
    new ResourceControlViewModel(response?.Portainer?.ResourceControl);

  return {
    ...response,
    ResourceControl: resourceControl,
  };
}
