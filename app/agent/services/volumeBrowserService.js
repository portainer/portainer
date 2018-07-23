angular.module('portainer.agent')
.factory('VolumeBrowserService', ['$q', 'Browse', function VolumeBrowserServiceFactory($q, Browse) {
  'use strict';
  var service = {};

  service.ls = function(volumeId, path) {
    return Browse.ls({ 'id': volumeId, 'path': path }).$promise;
  };

  service.get = function(volumeId, path) {
    return Browse.get({ 'id': volumeId, 'path': path }).$promise;
  };

  service.delete = function(volumeId, path) {
    return Browse.delete({ 'id': volumeId, 'path': path }).$promise;
  };

  service.rename = function(volumeId, path, newPath) {
    var payload = {
      CurrentFilePath: path,
      NewFilePath: newPath
    };
    return Browse.rename({ 'id': volumeId }, payload).$promise;
  };

  return service;
}]);
