import {
  PortainerEndpoint,
  PortainerDockerSnapshot,
  PortainerKubernetesData,
  PortainerEnvironmentEdgeSettings,
  PortainerKubernetesStorageClassConfig,
} from '@api/types.gen';

import { DockerSnapshot } from '@/react/docker/snapshots/types';

import {
  ContainerEngine,
  Environment,
  EnvironmentEdge,
  EnvironmentId,
  EnvironmentStatus,
  EnvironmentType,
  KubernetesSettings,
  StorageClass,
} from '../types';

export function buildUrl(id?: EnvironmentId, action?: string) {
  let baseUrl = 'endpoints';
  if (id) {
    baseUrl += `/${id}`;
  }

  if (action) {
    baseUrl += `/${action}`;
  }

  return baseUrl;
}

export function toEnvironment(endpoint: PortainerEndpoint): Environment {
  return {
    ...endpoint,
    Type: endpoint.Type ? endpoint.Type : EnvironmentType.Docker,
    Status: endpoint.Status ?? EnvironmentStatus.Down,
    ContainerEngine: toContainerEngine(endpoint.ContainerEngine),
    TagIds: endpoint.TagIds ?? [],
    Gpus: endpoint.Gpus ?? [],
    EnableGPUManagement: endpoint.EnableGPUManagement ?? false,
    Snapshots: endpoint.Snapshots?.map(toDockerSnapshot) || [],
    Agent: {
      Version: endpoint.Agent?.Version || '',
      // EE only
      IsOutdated: false,
    },
    Edge: toEdge(endpoint.Edge),
    Kubernetes: toKubernetesSettings(endpoint.Kubernetes),

    // EE only
    ChangeWindow: { Enabled: false, EndTime: '', StartTime: '' },
    DeploymentOptions: {
      hideAddWithForm: false,
      hideFileUpload: false,
      hideWebEditor: false,
      overrideGlobalOptions: false,
    },
    EnableImageNotification: false,
  };
}

function toKubernetesSettings(
  data: PortainerKubernetesData
): KubernetesSettings {
  return {
    ...data,
    Configuration: {
      ...data.Configuration,
      StorageClasses:
        data.Configuration?.StorageClasses?.map(toStorageClass) ?? [],
      IngressClasses: data.Configuration?.IngressClasses ?? [],
    },
  };

  function toStorageClass(
    original: PortainerKubernetesStorageClassConfig
  ): StorageClass {
    return {
      ...original,
      AccessModes: original.AccessModes ?? [],
    };
  }
}

function toContainerEngine(engine: string): ContainerEngine {
  switch (engine) {
    case ContainerEngine.Docker:
      return ContainerEngine.Docker;
    case ContainerEngine.Podman:
      return ContainerEngine.Podman;
    case '':
      return ContainerEngine.Kubernetes;
    default:
      return ContainerEngine.Docker;
  }
}

function toDockerSnapshot(snapshot: PortainerDockerSnapshot): DockerSnapshot {
  return {
    ...snapshot,
    GpuUseList: snapshot.GpuUseList ?? [],
  };
}

function toEdge(edge?: PortainerEnvironmentEdgeSettings): EnvironmentEdge {
  return {
    AsyncMode: edge?.AsyncMode ?? false,
    PingInterval: edge?.PingInterval ?? 0,
    SnapshotInterval: edge?.SnapshotInterval ?? 0,
    CommandInterval: edge?.CommandInterval ?? 0,
  };
}
