import _ from 'lodash';

import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { useIsStandAlone } from '@/react/docker/proxy/queries/useInfo';
import { useEnvironment } from '@/react/portainer/environments/queries';

import { ContainerListViewModel, ContainerStatus } from './types';
import { DockerContainerResponse } from './types/response';

/**
 * Transform an item of the raw docker container list reponse to a container list view model
 * @param response Raw docker container list reponse item
 * @returns ContainerListViewModel
 */
export function toListViewModel(
  response: DockerContainerResponse
): ContainerListViewModel {
  const resourceControl =
    response.Portainer?.ResourceControl &&
    new ResourceControlViewModel(response?.Portainer?.ResourceControl);
  const nodeName = response.Portainer?.Agent?.NodeName || '';

  const ip =
    Object.values(response?.NetworkSettings?.Networks || {})[0]?.IPAddress ||
    '';

  const labels = response.Labels || {};
  const stackName =
    labels['com.docker.compose.project'] ||
    labels['com.docker.stack.namespace'];

  const status = createStatus(response.Status);

  const ports = _.compact(
    response.Ports?.map(
      (p) =>
        p.PublicPort && {
          host: p.IP,
          private: p.PrivatePort,
          public: p.PublicPort,
        }
    )
  );

  const names = response.Names?.map((n) => {
    const nameWithoutSlash = n[0] === '/' ? n.slice(1) : n;
    return nameWithoutSlash;
  });

  return {
    ...response,
    ResourceControl: resourceControl,
    Names: names,
    NodeName: nodeName,
    IP: ip,
    StackName: stackName,
    Status: status,
    Ports: ports,
    StatusText: response.Status,
    Gpus: '',
  };
}

function createStatus(statusText = ''): ContainerStatus {
  const status = statusText.toLowerCase();

  if (status.includes(ContainerStatus.Paused)) {
    return ContainerStatus.Paused;
  }

  if (status.includes(ContainerStatus.Dead)) {
    return ContainerStatus.Dead;
  }

  if (status.includes(ContainerStatus.Created)) {
    return ContainerStatus.Created;
  }

  if (status.includes(ContainerStatus.Stopped)) {
    return ContainerStatus.Stopped;
  }

  if (status.includes(ContainerStatus.Exited)) {
    return ContainerStatus.Exited;
  }

  if (status.includes('(healthy)')) {
    return ContainerStatus.Healthy;
  }

  if (status.includes('(unhealthy)')) {
    return ContainerStatus.Unhealthy;
  }

  if (status.includes('(health: starting)')) {
    return ContainerStatus.Starting;
  }

  return ContainerStatus.Running;
}

export function useShowGPUsColumn(environmentId: EnvironmentId) {
  const isDockerStandalone = useIsStandAlone(environmentId);
  const enableGPUManagementQuery = useEnvironment(
    environmentId,
    (env) => env?.EnableGPUManagement
  );
  return isDockerStandalone && enableGPUManagementQuery.data;
}
