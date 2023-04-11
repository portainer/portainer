import {
  ContainerConfig,
  HostConfig,
  NetworkingConfig,
} from 'docker-types/generated/1.41';

export interface CreateContainerRequest extends ContainerConfig {
  HostConfig: HostConfig;
  NetworkingConfig: NetworkingConfig;
}
