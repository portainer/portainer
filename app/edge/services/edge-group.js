import angular from 'angular';

angular.module('portainer.edge').factory('EdgeGroupService', function EdgeGroupServiceFactory(EdgeGroups) {
  var service = {};

  service.groups = function groups() {
    return EdgeGroups.query({}).$promise;
  };

  return service;
});
