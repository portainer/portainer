import { ContainerConfig, HostConfig, NetworkingConfig } from 'docker-types';

export interface CreateContainerRequest extends ContainerConfig {
  HostConfig: HostConfig;
  NetworkingConfig: NetworkingConfig;
}
