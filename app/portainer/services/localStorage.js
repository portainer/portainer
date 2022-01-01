angular.module('portainer.app').factory('LocalStorage', [
  'localStorageService',
  function LocalStorageFactory(localStorageService) {
    return {
      storeEndpointID: function (id) {
        localStorageService.set('ENDPOINT_ID', id);
      },
      getEndpointID: function () {
        return localStorageService.get('ENDPOINT_ID');
      },
      storeEndpointPublicURL: function (publicURL) {
        localStorageService.set('ENDPOINT_PUBLIC_URL', publicURL);
      },
      getEndpointPublicURL: function () {
        return localStorageService.get('ENDPOINT_PUBLIC_URL');
      },
      storeLoginStateUUID: function (uuid) {
        localStorageService.set('LOGIN_STATE_UUID', uuid);
      },
      getLoginStateUUID: function () {
        return localStorageService.get('LOGIN_STATE_UUID');
      },
      storeOfflineMode: function (isOffline) {
        localStorageService.set('ENDPOINT_OFFLINE_MODE', isOffline);
      },
      getOfflineMode: function () {
        return localStorageService.get('ENDPOINT_OFFLINE_MODE');
      },
      storeEndpoints: function (data) {
        localStorageService.set('ENDPOINTS_DATA', data);
      },
      getEndpoints: function () {
        return localStorageService.get('ENDPOINTS_DATA');
      },
      storeEndpointState: function (state) {
        localStorageService.set('ENDPOINT_STATE', state);
      },
      getEndpointState: function () {
        return localStorageService.get('ENDPOINT_STATE');
      },
      storeApplicationState: function (state) {
        localStorageService.set('APPLICATION_STATE', state);
      },
      getApplicationState: function () {
        return localStorageService.get('APPLICATION_STATE');
      },
      storeUIState: function (state) {
        localStorageService.set('UI_STATE', state);
      },
      getUIState: function () {
        return localStorageService.get('UI_STATE');
      },
      storeJWT: function (jwt) {
        localStorageService.set('JWT', jwt);
      },
      getJWT: function () {
        return localStorageService.get('JWT');
      },
      deleteJWT: function () {
        localStorageService.remove('JWT');
      },
      storePaginationLimit: function (key, count) {
        localStorageService.set('datatable_pagination_' + key, count);
      },
      getPaginationLimit: function (key) {
        return localStorageService.get('datatable_pagination_' + key);
      },
      getDataTableOrder: function (key) {
        return localStorageService.get('datatable_order_' + key);
      },
      storeDataTableOrder: function (key, data) {
        localStorageService.set('datatable_order_' + key, data);
      },
      getDataTableTextFilters: function (key) {
        return localStorageService.get('datatable_text_filter_' + key);
      },
      storeDataTableTextFilters: function (key, data) {
        localStorageService.set('datatable_text_filter_' + key, data);
      },
      getDataTableFilters: function (key) {
        return localStorageService.get('datatable_filters_' + key);
      },
      storeDataTableFilters: function (key, data) {
        localStorageService.set('datatable_filters_' + key, data);
      },
      getDataTableSettings: function (key) {
        return localStorageService.get('datatable_settings_' + key);
      },
      storeDataTableSettings: function (key, data) {
        localStorageService.set('datatable_settings_' + key, data);
      },
      getDataTableExpandedItems: function (key) {
        return localStorageService.get('datatable_expandeditems_' + key);
      },
      storeDataTableExpandedItems: function (key, data) {
        localStorageService.set('datatable_expandeditems_' + key, data);
      },
      getDataTableSelectedItems: function (key) {
        return localStorageService.get('datatable_selecteditems_' + key);
      },
      storeDataTableSelectedItems: function (key, data) {
        localStorageService.set('datatable_selecteditems_' + key, data);
      },
      storeSwarmVisualizerSettings: function (key, data) {
        localStorageService.set('swarmvisualizer_' + key, data);
      },
      getSwarmVisualizerSettings: function (key) {
        return localStorageService.get('swarmvisualizer_' + key);
      },
      storeColumnVisibilitySettings: function (key, data) {
        localStorageService.set('col_visibility_' + key, data);
      },
      getColumnVisibilitySettings: function (key) {
        return localStorageService.get('col_visibility_' + key);
      },
      storeJobImage: function (data) {
        localStorageService.set('job_image', data);
      },
      getJobImage: function () {
        return localStorageService.get('job_image');
      },
      storeActiveTab: function (key, index) {
        return localStorageService.set('active_tab_' + key, index);
      },
      getActiveTab: function (key) {
        const activeTab = localStorageService.get('active_tab_' + key);
        return activeTab === null ? 0 : activeTab;
      },
      storeToolbarToggle(value) {
        localStorageService.set('toolbar_toggle', value);
      },
      getToolbarToggle() {
        return localStorageService.get('toolbar_toggle');
      },
      storeLogoutReason: (reason) => localStorageService.set('logout_reason', reason),
      getLogoutReason: () => localStorageService.get('logout_reason'),
      cleanLogoutReason: () => localStorageService.remove('logout_reason'),
      clean: function () {
        localStorageService.clearAll();
      },
      cleanAuthData() {
        localStorageService.remove('JWT', 'APPLICATION_STATE', 'LOGIN_STATE_UUID');
      },
      cleanEndpointData() {
        localStorageService.remove('ENDPOINT_ID', 'ENDPOINT_PUBLIC_URL', 'ENDPOINT_OFFLINE_MODE', 'ENDPOINTS_DATA', 'ENDPOINT_STATE');
      },
      storeKubernetesSummaryToggle(value) {
        localStorageService.set('kubernetes_summary_expanded', value);
      },
      getKubernetesSummaryToggle() {
        return localStorageService.get('kubernetes_summary_expanded');
      },
    };
  },
]);
