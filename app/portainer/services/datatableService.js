angular.module('portainer.app')
.factory('DatatableService', ['LocalStorage',
function DatatableServiceFactory(LocalStorage) {
  'use strict';

  var service = {};

  service.setDataTableSettings = function(key, settings) {
    LocalStorage.storeDataTableSettings(key, settings);
  };

  service.getDataTableSettings = function(key) {
    return LocalStorage.getDataTableSettings(key);
  };

  service.setDataTableFilters = function(key, filters) {
    LocalStorage.storeDataTableFilters(key, filters);
  };

  service.getDataTableFilters = function(key) {
    return LocalStorage.getDataTableFilters(key);
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

  service.setDataTableExpandedItems = function(key, expandedItems) {
    LocalStorage.storeDataTableExpandedItems(key, expandedItems);
  };

  service.getDataTableExpandedItems = function(key) {
    return LocalStorage.getDataTableExpandedItems(key);
  };

  service.setDataTableSelectedItems = function(key, selectedItems) {
    LocalStorage.storeDataTableSelectedItems(key, selectedItems);
  };

  service.getDataTableSelectedItems = function(key) {
    return LocalStorage.getDataTableSelectedItems(key);
  };

  return service;
}]);
