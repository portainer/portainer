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
    storeLoginStateUUID: function(uuid) {
      localStorageService.cookie.set('LOGIN_STATE_UUID', uuid);
    },
    getLoginStateUUID: function() {
      return localStorageService.cookie.get('LOGIN_STATE_UUID');
    },
    storeOfflineMode: function(isOffline) {
      localStorageService.set('ENDPOINT_OFFLINE_MODE', isOffline);
    },
    getOfflineMode: function() {
      return localStorageService.get('ENDPOINT_OFFLINE_MODE');
    },
    storeEndpoints: function(data) {
      localStorageService.set('ENDPOINTS_DATA', data);
    },
    getEndpoints: function() {
      return localStorageService.get('ENDPOINTS_DATA');
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
    storeExtensionState: function(state) {
      localStorageService.set('EXTENSION_STATE', state);
    },
    getExtensionState: function() {
      return localStorageService.get('EXTENSION_STATE');
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
      localStorageService.cookie.set('datatable_pagination_' + key, count);
    },
    getPaginationLimit: function(key) {
      return localStorageService.cookie.get('datatable_pagination_' + key);
    },
    getDataTableOrder: function(key) {
      return localStorageService.cookie.get('datatable_order_' + key);
    },
    storeDataTableOrder: function(key, data) {
      localStorageService.cookie.set('datatable_order_' + key, data);
    },
    getDataTableTextFilters: function(key) {
      return localStorageService.cookie.get('datatable_text_filter_' + key);
    },
    storeDataTableTextFilters: function(key, data) {
      localStorageService.cookie.set('datatable_text_filter_' + key, data);
    },
    getDataTableFilters: function(key) {
      return localStorageService.cookie.get('datatable_filters_' + key);
    },
    storeDataTableFilters: function(key, data) {
      localStorageService.cookie.set('datatable_filters_' + key, data);
    },
    getDataTableSettings: function(key) {
      return localStorageService.cookie.get('datatable_settings_' + key);
    },
    storeDataTableSettings: function(key, data) {
      localStorageService.cookie.set('datatable_settings_' + key, data);
    },
    getDataTableExpandedItems: function(key) {
      return localStorageService.cookie.get('datatable_expandeditems_' + key);
    },
    storeDataTableExpandedItems: function(key, data) {
      localStorageService.cookie.set('datatable_expandeditems_' + key, data);
    },
    getDataTableSelectedItems: function(key) {
      return localStorageService.get('datatable_selecteditems_' + key);
    },
    storeDataTableSelectedItems: function(key, data) {
      localStorageService.set('datatable_selecteditems_' + key, data);
    },
    storeSwarmVisualizerSettings: function(key, data) {
      localStorageService.cookie.set('swarmvisualizer_' + key, data);
    },
    getSwarmVisualizerSettings: function(key) {
      return localStorageService.cookie.get('swarmvisualizer_' + key);
    },
    storeColumnVisibilitySettings: function(key, data) {
      localStorageService.cookie.set('col_visibility_' + key, data);
    },
    getColumnVisibilitySettings: function(key) {
      return localStorageService.cookie.get('col_visibility_' + key);
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
