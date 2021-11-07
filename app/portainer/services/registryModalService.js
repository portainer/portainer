import _ from 'lodash';

angular.module('portainer.app').factory('RegistryModalService', ModalServiceFactory);

function ModalServiceFactory($q, ModalService, RegistryService) {
  const service = {};

  function registries2Options(registries) {
    return registries.map((r) => ({
      text: r.Name,
      value: String(r.Id),
    }));
  }

  service.registryModal = async function (repository, registries) {
    const deferred = $q.defer();

    const options = registries2Options(registries);
    const registryModel = RegistryService.retrievePorRegistryModelFromRepositoryWithRegistries(repository, registries);
    const defaultValue = String(_.get(registryModel, 'Registry.Id', '0'));

    ModalService.selectRegistry({
      inputOptions: options,
      value: defaultValue,
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
