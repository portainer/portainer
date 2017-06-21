angular.module('portainer.services')
.factory('StackService', ['$q', 'ContainerService', 'ServiceService', 'StackHelper', function StackServiceFactory($q, ContainerService, ServiceService, StackHelper) {
  'use strict';
  var service = {};

  service.stacks = function(includeServices) {
    var deferred = $q.defer();

    $q.all({
      containers: ContainerService.containers(1),
      services: includeServices ? ServiceService.services() : []
    })
    .then(function success(data) {
      var containers = data.containers;
      var composeV2Stacks = StackHelper.getComposeV2StacksFromContainers(containers);
      var services = data.services;
      var composeV3Stacks = StackHelper.getComposeV3StacksFromServices(services);

      var stacks = composeV2Stacks.concat(composeV3Stacks);
      deferred.resolve(stacks);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve stacks', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
