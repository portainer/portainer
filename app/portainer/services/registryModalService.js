import _ from 'lodash';

angular.module('portainer.app').factory('RegistryModalService', ModalServiceFactory);

function ModalServiceFactory($q, EndpointService, Notifications, ModalService, RegistryService) {
  const service = {};

  function registries2Options(registries) {
    const options = [];

    for (const registry of registries) {
      options.push({
        text: registry.Name,
        value: String(registry.Id),
      });
    }

    return options;
  }

  service.registryModal = async function (repository, registries) {
    const deferred = $q.defer();

    const options = registries2Options(registries);
    const registryModel = RegistryService.retrievePorRegistryModelFromRepositoryWithRegistries(repository, registries);
    const defaultValue = String(_.get(registryModel, 'Registry.Id', '0'));

    ModalService.selectRegistry({
      options,
      defaultValue,
      callback: (registryId) => {
        if (registryId) {
          const registryModel = RegistryService.retrievePorRegistryModelFromRepositoryWithRegistries(repository, registries, registryId);
          deferred.resolve(registryModel);
        } else {
          deferred.resolve(null);
        }
      },
    });

    return deferred.promise;
  };

  return service;
}
