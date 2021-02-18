export const API_ENDPOINT_EDGE_JOBS = 'api/edge_jobs';
export const API_ENDPOINT_ENDPOINTS = 'api/endpoints';
export const API_ENDPOINT_REGISTRIES = 'api/registries';
export const API_ENDPOINT_WEBHOOKS = 'api/webhooks';
export const PAGINATION_MAX_ITEMS = 10;
export const PORTAINER_FADEOUT = 1500;

angular
  .module('portainer')
  .constant('API_ENDPOINT_ENDPOINTS', API_ENDPOINT_ENDPOINTS)
  .constant('API_ENDPOINT_REGISTRIES', API_ENDPOINT_REGISTRIES)
  .constant('API_ENDPOINT_WEBHOOKS', API_ENDPOINT_WEBHOOKS)
  .constant('PAGINATION_MAX_ITEMS', PAGINATION_MAX_ITEMS);
