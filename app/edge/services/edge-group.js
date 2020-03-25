import angular from 'angular';

angular.module('portainer.app').factory('EdgeGroupService', function EdgeGroupServiceFactory(EdgeGroups) {
  var service = {};

  service.group = async function group(groupId) {
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

  service.update = async function update(group) {
    return EdgeGroups.update(group).$promise;
  };

  return service;
});
