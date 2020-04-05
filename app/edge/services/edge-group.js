import angular from 'angular';

angular.module('portainer.app').factory('EdgeGroupService', function EdgeGroupServiceFactory(EdgeGroups) {
  var service = {};

  // service.group = async function group(groupId) {
  // };

  service.groups = function groups() {
    return EdgeGroups.query({}).$promise;
  };

  service.remove = function remove(groupId) {
    return EdgeGroups.remove({ id: groupId }).$promise;
  };

  service.create = function create(group) {
    return EdgeGroups.create(group).$promise;
  };

  // service.update = async function update(groupId, group) {
  // };

  return service;
});
