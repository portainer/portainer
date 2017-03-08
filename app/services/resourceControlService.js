angular.module('portainer.services')
.factory('ResourceControlService', ['$q', 'ResourceControl', function ResourceControlServiceFactory($q, ResourceControl) {
  'use strict';
  var service = {};

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

  service.setVolumeResourceControl = function(userID, resourceID) {
    return ResourceControl.create({ userId: userID, resourceType: 'volume' }, { ResourceID: resourceID }).$promise;
  };

  service.removeVolumeResourceControl = function(userID, resourceID) {
    return ResourceControl.remove({ userId: userID, resourceId: resourceID, resourceType: 'volume' }).$promise;
  };

  return service;
}]);
