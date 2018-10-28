import angular from 'angular';

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
    storeUIState: function(state) {
      localStorageService.cookie.set('UI_STATE', state);
    },
    getUIState: function() {
      return localStorageService.cookie.get('UI_STATE');
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
    getDataTableExpandedItems: function(key) {
      return localStorageService.get('datatable_expandeditems_' + key);
    },
    storeDataTableExpandedItems: function(key, data) {
      localStorageService.set('datatable_expandeditems_' + key, data);
    },
    getDataTableSelectedItems: function(key) {
      return localStorageService.get('datatable_selecteditems_' + key);
    },
    storeDataTableSelectedItems: function(key, data) {
      localStorageService.set('datatable_selecteditems_' + key, data);
    },
    storeSwarmVisualizerSettings: function(key, data) {
      localStorageService.set('swarmvisualizer_' + key, data);
    },
    getSwarmVisualizerSettings: function(key) {
      return localStorageService.get('swarmvisualizer_' + key);
    },
    storeColumnVisibilitySettings: function(key, data) {
      localStorageService.set('col_visibility_' + key, data);
    },
    getColumnVisibilitySettings: function(key) {
      return localStorageService.get('col_visibility_' + key);
    },
    storeJobImage: function(data) {
      localStorageService.set('job_image', data);
    },
    getJobImage: function() {
      return localStorageService.get('job_image');
    },
    clean: function() {
      localStorageService.clearAll();
    }
  };
}]);
