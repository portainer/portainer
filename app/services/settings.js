angular.module('portainer.services')
.factory('Settings', ['DOCKER_ENDPOINT', 'DOCKER_PORT', 'UI_VERSION', 'PAGINATION_MAX_ITEMS', function SettingsFactory(DOCKER_ENDPOINT, DOCKER_PORT, UI_VERSION, PAGINATION_MAX_ITEMS) {
  'use strict';
  var url = DOCKER_ENDPOINT;
  if (DOCKER_PORT) {
    url = url + DOCKER_PORT + '\\' + DOCKER_PORT;
  }
  var firstLoad = (localStorage.getItem('firstLoad') || 'true') === 'true';
  return {
    displayAll: true,
    endpoint: DOCKER_ENDPOINT,
    uiVersion: UI_VERSION,
    url: url,
    firstLoad: firstLoad,
    pagination_count: PAGINATION_MAX_ITEMS
  };
}]);
