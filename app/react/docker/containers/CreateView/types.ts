import {
  ContainerConfig,
  HostConfig,
  NetworkingConfig,
} from 'docker-types/generated/1.44';

export interface CreateContainerRequest extends ContainerConfig {
  HostConfig: HostConfig;
  NetworkingConfig: NetworkingConfig;
}
