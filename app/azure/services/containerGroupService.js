import { ContainerGroupViewModel } from '../models/container_group';

angular.module('portainer.azure').factory('ContainerGroupService', [
  '$q',
  'ContainerGroup',
  function ContainerGroupServiceFactory($q, ContainerGroup) {
    'use strict';
    var service = {};

    service.containerGroups = function (subscriptionId) {
      var deferred = $q.defer();

      ContainerGroup.query({ subscriptionId: subscriptionId })
        .$promise.then(function success(data) {
          var containerGroups = data.value.map(function (item) {
            return new ContainerGroupViewModel(item);
          });
          deferred.resolve(containerGroups);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve container groups', err: err });
        });

      return deferred.promise;
    };

    return service;
  },
]);
