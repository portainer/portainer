angular.module('portainer.services')
.factory('Pagination', ['LocalStorage', 'Settings', function PaginationFactory(LocalStorage, Settings) {
  'use strict';
  return {
    getPaginationCount: function(key) {
      var storedCount = LocalStorage.getPaginationCount(key);
      var paginationCount = Settings.pagination_count;
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
