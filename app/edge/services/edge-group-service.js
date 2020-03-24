angular.module('portainer.app').factory('EdgeGroupService', function EdgeGroupServiceFactory(EdgeGroups) {
  var service = {};

  // service.group = async function group(groupId) {
  // };

  service.groups = function groups() {
    return EdgeGroups.query({}).$promise;
  };

  service.remove = async function remove(groupId) {
    return EdgeGroups.remove({ id: groupId }).$promise;
  };

  // service.create = async function create(group) {
  // };

  // service.update = async function update(groupId, group) {
  // };

  return service;
});
