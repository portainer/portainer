angular.module('portainer.services')
.factory('Pagination', ['LocalStorage', 'PAGINATION_MAX_ITEMS', function PaginationFactory(LocalStorage, PAGINATION_MAX_ITEMS) {
  'use strict';
  return {
    getPaginationCount: function(key) {
      var storedCount = LocalStorage.getPaginationCount(key);
      var paginationCount = PAGINATION_MAX_ITEMS;
      if (storedCount !== null) {
        paginationCount = storedCount;
      }
      return '' + paginationCount;
    },
    setPaginationCount: function(key, count) {
      LocalStorage.storePaginationCount(key, count);
    }
  };
}]);
