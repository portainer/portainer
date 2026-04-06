import { RegistryTypes } from './registryTypes';
import i18n from '@/i18n';

export function DockerHubViewModel() {
  this.Id = 0;
  this.Type = RegistryTypes.ANONYMOUS;
  this.Name = i18n.t('portainer_registries.dockerhub_anonymous');
  this.URL = 'docker.io';
}
