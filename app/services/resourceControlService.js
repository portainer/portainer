angular.module('portainer.services')
.factory('ResourceControlService', ['$q', 'ResourceControl', 'RC', function ResourceControlServiceFactory($q, ResourceControl, RC) {
  'use strict';
  var service = {};

  service.createResourceControl = function(userIDs, teamIDs, resourceID) {
    return RC.create({}, {ResourceID: resourceID, Users: userIDs, Teams: teamIDs}).$promise;
  };

  service.deleteResourceControl = function(rcID) {
    return RC.remove({id: rcID}).$promise;
  };

  service.updateResourceControl = function(userIDs, teamIDs, rcID) {
    return RC.update({id: rcID}, {Users: userIDs, Teams: teamIDs}).$promise;
  };

  // OLD

  service.setContainerResourceControl = function(userID, resourceID) {
    return ResourceControl.create({ userId: userID, resourceType: 'container' }, { ResourceID: resourceID }).$promise;
  };

  service.removeContainerResourceControl = function(userID, resourceID) {
    return ResourceControl.remove({ userId: userID, resourceId: resourceID, resourceType: 'container' }).$promise;
  };

  service.setServiceResourceControl = function(userID, resourceID) {
    return ResourceControl.create({ userId: userID, resourceType: 'service' }, { ResourceID: resourceID }).$promise;
  };

  service.removeServiceResourceControl = function(userID, resourceID) {
    return ResourceControl.remove({ userId: userID, resourceId: resourceID, resourceType: 'service' }).$promise;
  };

  return service;
}]);
