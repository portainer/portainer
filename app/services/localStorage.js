angular.module('portainer.services')
.factory('LocalStorage', ['localStorageService', function LocalStorageFactory(localStorageService) {
  'use strict';
  return {
    storeEndpointState: function(state) {
      localStorageService.set('ENDPOINT_STATE', state);
    },
    getEndpointState: function() {
      return localStorageService.get('ENDPOINT_STATE');
    },
    storeJWT: function(jwt) {
      localStorageService.set('JWT', jwt);
    },
    getJWT: function() {
      return localStorageService.get('JWT');
    },
    deleteJWT: function() {
      localStorageService.remove('JWT');
    },
    storePaginationCount: function(key, count) {
      localStorageService.cookie.set('pagination_' + key, count);
    },
    getPaginationCount: function(key) {
      return localStorageService.cookie.get('pagination_' + key);
    },
    clean: function() {
      localStorageService.clearAll();
    }
  };
}]);
