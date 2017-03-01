angular.module('portainer.services')
.factory('ResourceControlService', ['$q', 'ResourceControl', function ResourceControlServiceFactory($q, ResourceControl) {
  'use strict';
  var service = {};

  service.setResourceControl = function(userID, resourceID) {
    return ResourceControl.create({ userId: userID }, { ResourceID: resourceID }).$promise;
  };

  service.removeResourceControl = function(userID, resourceID) {
    return ResourceControl.remove({ userId: userID, resourceID: resourceID }).$promise;
  };

  return service;
}]);
