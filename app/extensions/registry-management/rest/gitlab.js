import gitlabResponseGetLink from './transform/gitlabResponseGetLink'

angular.module('portainer.extensions.registrymanagement')
.factory('Gitlab', ['$resource', 'API_ENDPOINT_REGISTRIES',
function GitlabFactory($resource, API_ENDPOINT_REGISTRIES) {
  'use strict';
  return function(env) {
    const headers = {};
    let domain = '';
    if (env) {
      headers['Private-Token'] = env.token;
      domain = encodeURIComponent(env.url);
    }

    const baseUrl = API_ENDPOINT_REGISTRIES + '/:id/proxies/gitlab/:domain/api/v4/projects';

    return $resource(baseUrl, {id:'@id'},
    {
      ping: {
        method: 'HEAD',
        params: { owned: 'true', simple: 'true' },
        headers: headers
      },
      pingWithForceNew: {
        method: 'HEAD',
        params: { owned: 'true', simple: 'true' },
        headers: Object.assign(headers, {
          'X-RegistryManagement-ForceNew': '1'
        })
      },
      projects: {
        method: 'GET',
        params: { membership: 'true', domain: domain },
        transformResponse: gitlabResponseGetLink,
        headers: Object.assign(headers, {
          'X-RegistryManagement-ForceNew': '1'
        })
      },
      // repositories : GET /projects/:id/registry/repositories
      repositories :{
        method: 'GET',
        url: baseUrl + '/:projectId/registry/repositories',
        params: { tags: true },
        headers: headers,
        transformResponse: gitlabResponseGetLink
      },
      // deleteRepository: DELETE /projects/:id/registry/repositories/:repository_id
      // tags: GET /projects/:id/registry/repositories/:repository_id/tags
      tags: {
        method: 'GET',
        url: baseUrl + '/:projectId/registry/repositories/:repositoryId/tags',
        headers: headers,
        transformResponse: gitlabResponseGetLink
      },
      // tag: GET /projects/:id/registry/repositories/:repository_id/tags/:tag_name
      tag: {
        method: 'GET',
        url: baseUrl + '/:projectId/registry/repositories/:repositoryId/tags/:tagName',
        headers: headers,
        transformResponse: gitlabResponseGetLink
      }
      // removeTag: DELETE /projects/:id/registry/repositories/:repository_id/tags/:tag_name
    });
  };
}]);
