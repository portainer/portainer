import {
  deleteEndpoint,
  disassociateEndpoint,
  endpointsByGroup,
  forceUpdateService,
  getEndpoint,
  getEndpoints,
  snapshotEndpoint,
  snapshotEndpoints,
  updateEndpoint,
  updatePoolAccess,
  updateSettings,
} from '@/portainer/environments/environment.service';
import { createLocalEndpoint, createAzureEndpoint, createLocalKubernetesEndpoint, createRemoteEndpoint } from '@/portainer/environments/environment.service/create';
import { getEnvironmentRegistries, getEnvironmentRegistry, updateEnvironmentRegistryAccess } from '@/portainer/environments/environment.service/registries';

/* @ngInject */
export function EndpointService() {
  return {
    endpoint: getEndpoint,
    endpoints: getEndpoints,
    snapshotEndpoints,
    snapshotEndpoint,
    endpointsByGroup,
    deassociateEndpoint: disassociateEndpoint,
    updateEndpoint,
    deleteEndpoint,

    createLocalEndpoint,
    createRemoteEndpoint,
    createLocalKubernetesEndpoint,
    createAzureEndpoint,

    updateSettings,
    registries: getEnvironmentRegistries,
    registry: getEnvironmentRegistry,
    updateRegistryAccess: updateEnvironmentRegistryAccess,
    updatePoolAccess,
    forceUpdateService,
  };
}
