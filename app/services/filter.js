angular.module('portainer.services')
.factory('FilterService', ['LocalStorage',
function FilterServiceFactory(LocalStorage) {
  'use strict';

  var service = {};

  service.getDataTableHeaders = function(key) {
    return LocalStorage.getDataTableHeaders(key);
  };

  service.setDataTableHeaders = function(key, headers) {
    LocalStorage.storeDataTableHeaders(key, headers);
  };

  return service;
}]);
