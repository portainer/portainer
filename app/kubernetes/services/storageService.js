import _ from 'lodash-es';

angular.module('portainer.kubernetes')
.factory('KubernetesStorageService', ['$async', 'KubernetesStorage', function KubernetesStorageServiceFactory($async, KubernetesStorage) {
  'use strict';
  const service = {};

  service.storageClasses = storageClasses;

  async function storageClassesAsync(endpointId) {
    try {
      const classes = await KubernetesStorage().get({endpointId: endpointId}).$promise;
      return _.map(classes.items, (item) => item.metadata.name);
    } catch (err) {
      throw { msg: 'Unable to retrieve storage classes', err: err };
    }
  }

  function storageClasses(endpointId) {
    return $async(storageClassesAsync, endpointId);
  }

  return service;
}]);
