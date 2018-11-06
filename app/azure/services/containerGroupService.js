import { ContainerGroupViewModel, CreateContainerGroupRequest } from '../models/container_group';

angular.module('portainer.azure')
.factory('ContainerGroupService', ['$q', 'ContainerGroup', function ContainerGroupServiceFactory($q, ContainerGroup) {
  'use strict';
  var service = {};

  service.containerGroups = function(subscriptionId) {
    var deferred = $q.defer();

    ContainerGroup.query({ subscriptionId: subscriptionId }).$promise
    .then(function success(data) {
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

  service.create = function(model, subscriptionId, resourceGroupName) {
    var payload = new CreateContainerGroupRequest(model);
    return ContainerGroup.create({
      subscriptionId: subscriptionId,
      resourceGroupName: resourceGroupName,
      containerGroupName: model.Name
    }, payload).$promise;
  };

  return service;
}]);
