angular.module('portainer.app').factory('PaginationService', [
  'LocalStorage',
  'PAGINATION_MAX_ITEMS',
  function PaginationServiceFactory(LocalStorage, PAGINATION_MAX_ITEMS) {
    'use strict';

    var service = {};

    service.getPaginationLimit = function (key) {
      var paginationLimit = PAGINATION_MAX_ITEMS;

      var storedLimit = LocalStorage.getPaginationLimit(key);
      if (storedLimit !== null) {
        paginationLimit = storedLimit;
      }
      return '' + paginationLimit;
    };

    service.setPaginationLimit = function (key, limit) {
      LocalStorage.storePaginationLimit(key, limit);
    };

    return service;
  },
]);
