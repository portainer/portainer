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

  service.getDataTableOrder = function(key) {
    return LocalStorage.getDataTableOrder(key);
  };

  service.setDataTableOrder = function(key, orderBy, reverse) {
    var filter = {
      orderBy: orderBy,
      reverse: reverse
    };
    LocalStorage.storeDataTableOrder(key, filter);
  };

  return service;
}]);
