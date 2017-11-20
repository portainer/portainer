angular.module('portainer.services')
.factory('LocalStorage', ['localStorageService', function LocalStorageFactory(localStorageService) {
  'use strict';
  return {
    storeEndpointID: function(id) {
      localStorageService.set('ENDPOINT_ID', id);
    },
    getEndpointID: function() {
      return localStorageService.get('ENDPOINT_ID');
    },
    storeEndpointPublicURL: function(publicURL) {
      localStorageService.set('ENDPOINT_PUBLIC_URL', publicURL);
    },
    getEndpointPublicURL: function() {
      return localStorageService.get('ENDPOINT_PUBLIC_URL');
    },
    storeEndpointState: function(state) {
      localStorageService.set('ENDPOINT_STATE', state);
    },
    getEndpointState: function() {
      return localStorageService.get('ENDPOINT_STATE');
    },
    storeApplicationState: function(state) {
      localStorageService.set('APPLICATION_STATE', state);
    },
    getApplicationState: function() {
      return localStorageService.get('APPLICATION_STATE');
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
    },
    storeFilterContainerShowAll: function(filter) {
      localStorageService.cookie.set('filter_containerShowAll', filter);
    },
    getFilterContainerShowAll: function() {
      var filter = localStorageService.cookie.get('filter_containerShowAll');
      if (filter === null) {
        filter = true;
      }
      return filter;
    },
    storeQuickAccessItems: function(items) {
      localStorageService.set('quickAccessItems', items);
    },
    getQuickAccessItems: function() {
      return localStorageService.get('quickAccessItems');
    },
    storeQuickAccessOptions: function(options) {
      localStorageService.set('quickAccessOptions', options);
    },
    getQuickAccessOptions: function() {
      return localStorageService.get('quickAccessOptions');
    }
  };
}]);
