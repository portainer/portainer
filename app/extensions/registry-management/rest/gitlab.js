import gitlabResponseGetLink from './transform/gitlabResponseGetLink'

angular.module('portainer.extensions.registrymanagement')
.factory('Gitlab', ['$resource', 'API_ENDPOINT_REGISTRIES',
function GitlabFactory($resource, API_ENDPOINT_REGISTRIES) {
  'use strict';
  return function(env) {
    const headers = {
      'X-RegistryManagement-URI': env.url,
      'Private-Token': env.token,
    };
    return $resource(API_ENDPOINT_REGISTRIES + '/proxies/gitlab/api/v4/:action', {},
    {
      listProjects: {
        method: 'GET',
        params: { action: 'projects', membership: 'true' },
        transformResponse: gitlabResponseGetLink,
        headers: Object.assign(headers, {
          'X-RegistryManagement-ForceNew': '1'
        })
      }
    },
    {
      stripTrailingSlashes: false
    });
  };
}]);
