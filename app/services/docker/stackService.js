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

  service.stackV2 = function(name) {
    var deferred = $q.defer();

    var filters = {
      label: ['com.docker.compose.project=' + name]
    };

    ContainerService.containers(1, filters)
    .then(function success(data) {
      var containers = data;
      var services = StackHelper.getComposeV2ServicesFromContainers(containers);
      var stack = new StackV2ViewModel(name, containers, services);
      deferred.resolve(stack);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve stack details', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
