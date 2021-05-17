import { RegistryTypes } from './registryTypes';

export function DockerHubViewModel() {
  this.Type = RegistryTypes.ANONYMOUS;
  this.Name = 'DockerHub (anonymous)';
  this.URL = 'docker.io';
}
