import _ from 'lodash-es';

angular.module('portainer.kubernetes')
.factory('KubernetesStorageService', ['$async', 'KubernetesStorage', function KubernetesStorageServiceFactory($async, KubernetesStorage) {
  'use strict';
  const service = {};

  service.storageClasses = storageClasses;

  async function storageClassesAsync() {
    try {
      const classes = await KubernetesStorage.query().$promise;
      return _.map(classes.items, (item) => item.metadata.name);
    } catch (err) {
      Promise.reject({ msg: 'Unable to retrieve storage classes', err: err });
    }
  }

  function storageClasses() {
    return $async(storageClassesAsync);
  }

  return service;
}]);
