angular.module('portainer.app')
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
    storePaginationLimit: function(key, count) {
      localStorageService.cookie.set('pagination_' + key, count);
    },
    getPaginationLimit: function(key) {
      return localStorageService.cookie.get('pagination_' + key);
    },
    storeStoridgeAPIURL: function(url) {
      localStorageService.set('STORIDGE_API_URL', url);
    },
    getStoridgeAPIURL: function() {
      return localStorageService.get('STORIDGE_API_URL');
    },
    clearStoridgeAPIURL: function() {
      return localStorageService.remove('STORIDGE_API_URL');
    },
    getDataTableOrder: function(key) {
      return localStorageService.get('datatable_order_' + key);
    },
    storeDataTableOrder: function(key, data) {
      localStorageService.set('datatable_order_' + key, data);
    },
    getDataTableFilters: function(key) {
      return localStorageService.get('datatable_filters_' + key);
    },
    storeDataTableFilters: function(key, data) {
      localStorageService.set('datatable_filters_' + key, data);
    },
    getDataTableSettings: function(key) {
      return localStorageService.get('datatable_settings_' + key);
    },
    storeDataTableSettings: function(key, data) {
      localStorageService.set('datatable_settings_' + key, data);
    },
    clean: function() {
      localStorageService.clearAll();
    }
  };
}]);
