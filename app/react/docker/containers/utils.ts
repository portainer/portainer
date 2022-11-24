import _ from 'lodash';

import { useInfo } from '@/docker/services/system.service';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';

import { DockerContainer, ContainerStatus } from './types';
import { DockerContainerResponse } from './types/response';

export function parseViewModel(
  response: DockerContainerResponse
): DockerContainer {
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

  return {
    ...response,
    ResourceControl: resourceControl,
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

export function useShowGPUsColumn(environmentID: EnvironmentId) {
  const envInfoQuery = useInfo(
    environmentID,
    (info) => !!info.Swarm?.NodeID && !!info.Swarm?.ControlAvailable
  );

  return envInfoQuery.data !== true && !envInfoQuery.isLoading;
}
