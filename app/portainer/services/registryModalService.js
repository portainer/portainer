import _ from 'lodash';
import { selectRegistry } from '@/react/docker/images/ItemView/RegistrySelectPrompt';

angular.module('portainer.app').factory('RegistryModalService', RegistryModalService);

function RegistryModalService(RegistryService) {
  const service = {};

  service.registryModal = async function (repository, registries) {
    const registryModel = RegistryService.retrievePorRegistryModelFromRepositoryWithRegistries(repository, registries);
    const defaultValue = _.get(registryModel, 'Registry.Id', 0);

    const registryId = await selectRegistry(registries, defaultValue);
    if (registryId === undefined) {
      return null;
    }

    return RegistryService.retrievePorRegistryModelFromRepositoryWithRegistries(repository, registries, registryId);
  };

  return service;
}
