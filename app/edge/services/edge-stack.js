import angular from 'angular';

angular.module('portainer.edge').factory('EdgeStackService', function EdgeStackServiceFactory(EdgeStacks) {
  var service = {};

  service.stack = function stack(stackId) {
    return EdgeStacks.get({ id: stackId }).$promise;
  };

  service.stacks = function stacks() {
    return EdgeStacks.query({}).$promise;
  };

  service.remove = function remove(stackId) {
    return EdgeStacks.remove({ id: stackId }).$promise;
  };

  service.create = function create(stack) {
    return EdgeStacks.create(stack).$promise;
  };

  service.update = function update(stack) {
    return EdgeStacks.update(stack).$promise;
  };

  return service;
});
