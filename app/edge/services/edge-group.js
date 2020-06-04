import angular from 'angular';

angular.module('portainer.edge').factory('EdgeGroupService', function EdgeGroupServiceFactory(EdgeGroups) {
  var service = {};

  service.group = function group(groupId) {
    return EdgeGroups.get({ id: groupId }).$promise;
  };

  service.groups = function groups() {
    return EdgeGroups.query({}).$promise;
  };

  service.remove = function remove(groupId) {
    return EdgeGroups.remove({ id: groupId }).$promise;
  };

  service.create = function create(group) {
    return EdgeGroups.create(group).$promise;
  };

  service.update = function update(group) {
    return EdgeGroups.update(group).$promise;
  };

  return service;
});
